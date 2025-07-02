import { Injectable } from '@nestjs/common';
import { BatchOperationStatus } from '@crypton-nestjs-kit/common';
import { CustomLoggerService } from '@crypton-nestjs-kit/logger';
import { BatchPrismaService } from '@crypton-nestjs-kit/prisma';

import {
  ProcessOperations,
  UpdateBatchOperationStatus,
} from '../interfaces/batch.interface';

@Injectable()
export class WorkerService {
  constructor(
    private readonly prisma: BatchPrismaService,
    private readonly logger: CustomLoggerService,
  ) {
    this.logger.setContext(WorkerService.name);
  }

  async getProcessOperations(data: {
    limit: number;
  }): Promise<ProcessOperations> {
    try {
      // TODO: index: status, created_at
      const result = (await this.prisma.batchOperation.findMany({
        select: {
          id: true,
          operationType: true,
          sql: true,
          createdAt: true,
        },
        where: { status: BatchOperationStatus.UNPROCESSED },
        orderBy: { createdAt: 'asc' },
        take: data.limit,
      })) as unknown as ProcessOperations;

      return result;
    } catch (e) {
      this.logger.error(e.message, 'getProcessOperations');

      return [];
    }
  }

  async setProcessOperationsStatus(data: { ids: string[] }): Promise<boolean> {
    try {
      await this.prisma.batchOperation.updateMany({
        where: { id: { in: data.ids } },
        data: { status: BatchOperationStatus.PROCESSING },
      });

      return true;
    } catch (e) {
      this.logger.error(e.message, 'setProcessOperationsStatus');

      return false;
    }
  }

  async updateBatchOperationStatus(
    data: UpdateBatchOperationStatus[],
  ): Promise<boolean> {
    try {
      await this.prisma.$transaction(
        data.map(({ id, status, error }) =>
          this.prisma.batchOperation.update({
            where: { id },
            data: { status, error: error ?? null },
          }),
        ),
      );

      return true;
    } catch (e) {
      this.logger.error(e.message, 'updateBatchOperationStatus');

      return false;
    }
  }
}
