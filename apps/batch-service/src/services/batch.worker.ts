import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import {
  BatchOperationStatus,
  MarketplaceClient,
  UserOperationTypeEnum,
} from '@crypton-nestjs-kit/common';
import { CustomLoggerService } from '@crypton-nestjs-kit/logger';
import { SettingService } from '@crypton-nestjs-kit/settings';
import { DataSource } from 'typeorm';

import {
  BatchOperationResult,
  ProcessOperations,
  UpdateBatchOperationStatus,
} from '../interfaces/batch.interface';
import { WorkerService } from './worker.service';

interface DoOperations {
  status: boolean;
  batchOperationResult: BatchOperationResult;
}

@Injectable()
export class BatchWorker implements OnModuleInit {
  constructor(
    private readonly logger: CustomLoggerService,
    private readonly workerService: WorkerService,
    @InjectDataSource()
    private readonly dataSource: DataSource,
    private readonly settingsService: SettingService,
    private readonly marketplaceClient: MarketplaceClient,
  ) {
    this.logger.setContext(BatchWorker.name);
  }

  async onModuleInit(): Promise<void> {
    try {
      setInterval(() => this.process(), this.BATCH_PROCESS_OPERATION_INTERVAL);
    } catch (e) {
      this.logger.error(e.message);
    }
  }

  async process(): Promise<void> {
    try {
      const operations: ProcessOperations =
        await this.workerService.getProcessOperations({
          limit: this.BATCH_PROCESS_OPERATION_LIMIT,
        });

      if (operations.length === 0) return;

      const processOperationIds = operations.map((operation) => operation.id);

      await this.workerService.setProcessOperationsStatus({
        ids: processOperationIds,
      });

      const doOperationsByTransaction = await this.doOperationsByTransaction(
        operations,
      );

      if (doOperationsByTransaction.status) {
        this.logger.log(`Transaction, operations: ${operations.length}`);

        this.#emitServices(doOperationsByTransaction.batchOperationResult);

        return;
      }

      const doOperationsByChunks = await this.doOperationsByChunks(operations);

      if (doOperationsByChunks.status) {
        this.logger.log(`Chunks, operations: ${operations.length}`);

        this.#emitServices(doOperationsByChunks.batchOperationResult);

        return;
      }

      this.logger.error(
        `The transactions were not processed properly. ${new Date()}`,
      );
    } catch (e) {
      this.logger.error(`Process error, ${e.message}`);
    }
  }

  /**
   * Executes all SQL operations within a single database transaction.
   *
   * @param operations - Array of operations containing SQL and metadata.
   * @returns Promise resolving to the transaction execution status and results.
   */
  async doOperationsByTransaction(
    operations: ProcessOperations,
  ): Promise<DoOperations> {
    const batchOperationResult = this.#emptyBatchOperationResult();

    const queryRunner = this.dataSource.createQueryRunner();
    const updated: UpdateBatchOperationStatus[] = [];

    try {
      const transaction = this.#buildTransaction(operations);

      await queryRunner.connect();
      await queryRunner.startTransaction();
      await queryRunner.query(transaction);

      operations.forEach((operation) => {
        updated.push({
          id: operation.id,
          status: BatchOperationStatus.SUCCESS,
          created_at: operation.created_at,
        });

        batchOperationResult[operation.operation_type].success.push({
          user_operation_id: operation.id,
        });
      });

      await this.workerService.updateBatchOperationStatus(updated);

      await queryRunner.commitTransaction();

      return {
        status: true,
        batchOperationResult,
      };
    } catch (e) {
      this.logger.error(e.message, this.doOperationsByTransaction.name);
      await queryRunner.rollbackTransaction();

      return {
        status: false,
        batchOperationResult,
      };
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * If `doOperationsByTransaction` fails, executes `doOperationsByChunks` as a fallback.
   *
   * Executes SQL operations concurrently using `Promise.allSettled`, ensuring each operation runs independently.
   *
   * @param operations - Array of operations, each with SQL and metadata.
   * @returns Promise resolving to the aggregated execution status and results.
   */
  async doOperationsByChunks(
    operations: ProcessOperations,
  ): Promise<DoOperations> {
    const batchOperationResult = this.#emptyBatchOperationResult();
    const updated: UpdateBatchOperationStatus[] = [];

    try {
      const promises = operations.map((operation) => ({
        operation,
        promise: this.dataSource.query(operation.sql),
      }));

      const settledResults = await Promise.allSettled(
        promises.map((p) => p.promise),
      );

      settledResults.forEach((result, index) => {
        const { operation } = promises[index];

        if (result.status === 'rejected') {
          batchOperationResult[operation.operation_type].failed.push({
            user_operation_id: operation.id,
          });

          updated.push({
            id: operation.id,
            status: BatchOperationStatus.FAIL,
            created_at: operation.created_at,
            error: result.reason.message,
          });
        }

        if (result.status === 'fulfilled') {
          batchOperationResult[operation.operation_type].success.push({
            user_operation_id: operation.id,
          });

          updated.push({
            id: operation.id,
            created_at: operation.created_at,
            status: BatchOperationStatus.SUCCESS,
          });
        }
      });

      await this.workerService.updateBatchOperationStatus(updated);

      return {
        status: true,
        batchOperationResult,
      };
    } catch (e) {
      this.logger.error(e.message);

      return {
        status: false,
        batchOperationResult,
      };
    }
  }

  async #emitServices(operations: BatchOperationResult): Promise<void> {
    Object.keys(operations).forEach((operation_type) => {
      if (
        operations[operation_type].success.length === 0 &&
        operations[operation_type].failed.length === 0
      )
        return;

      const data = operations[operation_type];

      switch (operation_type) {
        case UserOperationTypeEnum.MAKE_TRADEABLE:
          this.marketplaceClient.finishMakeTradeable(data);
          break;
        case UserOperationTypeEnum.MARKETPLACE_CANCEL:
          this.marketplaceClient.finishCancel(data);
          break;
        case UserOperationTypeEnum.MARKETPLACE_DEAL:
          this.marketplaceClient.finishDeal(data);
          break;
        case UserOperationTypeEnum.MARKETPLACE_LISTING:
          this.marketplaceClient.finishCreateOffer(data);
          break;
        case UserOperationTypeEnum.MARKETPLACE_UPDATE:
          this.marketplaceClient.finishUpdate(data);
          break;
        default:
          this.logger.error(
            `Unknown operation type ${operation_type} in batch`,
          );
          break;
      }
    });
  }

  #buildTransaction(operations: ProcessOperations): string {
    let transaction = ``;

    operations.forEach((operation) => {
      transaction += `${operation.sql};`;
    });

    return transaction;
  }

  #emptyBatchOperationResult(): BatchOperationResult {
    return Object.keys(UserOperationTypeEnum).reduce((acc, operation_type) => {
      acc[operation_type] = {
        success: [],
        failed: [],
      };

      return acc;
    }, {}) as BatchOperationResult;
  }

  get BATCH_PROCESS_OPERATION_LIMIT(): number {
    return this.settingsService.settings.BATCH_PROCESS_OPERATION_LIMIT;
  }

  get BATCH_PROCESS_OPERATION_INTERVAL(): number {
    return this.settingsService.settings.BATCH_PROCESS_OPERATION_INTERVAL;
  }
}
