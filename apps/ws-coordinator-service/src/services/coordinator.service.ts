import { Injectable } from '@nestjs/common';
import { WsCoordinatorPrismaService } from '@crypton-nestjs-kit/prisma';
import {
  IGetServiceRequest,
  IGetServiceResponse,
  IRegisterServiceRequest,
  IRegisterServiceResponse,
  Service,
  ServiceStatus,
  ServiceType,
} from '@crypton-nestjs-kit/common';
import { Prisma } from '@crypton-nestjs-kit/prisma/src/ws-coordinator/generated/ws-client';

@Injectable()
export class CoordinatorService {
  constructor(private readonly prisma: WsCoordinatorPrismaService) {}

  private mapPrismaServiceToDto(prismaService: any): Service {
    return {
      id: prismaService.id,
      url: prismaService.url,
      type: prismaService.type as unknown as ServiceType,
      load:
        prismaService.load instanceof Prisma.Decimal
          ? prismaService.load.toNumber()
          : Number(prismaService.load),
      status: prismaService.status as unknown as ServiceStatus,
      lastUpdated: prismaService.lastUpdated,
      createdAt: prismaService.createdAt,
    } as Service;
  }

  public async registerService(
    data: IRegisterServiceRequest,
  ): Promise<IRegisterServiceResponse> {
    try {
      const service = await this.prisma.service.findUnique({
        where: { url: data.url },
      });

      if (service) {
        await this.prisma.service.update({
          where: { id: service.id },
          data: {
            load: new Prisma.Decimal(data.load),
            status: ServiceStatus.ACTIVE,
            type: data.type,
          },
        });

        return {
          status: true,
          message: 'Service already registered, updated successfully',
        };
      }

      await this.prisma.service.create({
        data: {
          url: data.url,
          type: data.type,
          load: new Prisma.Decimal(data.load),
          status: ServiceStatus.ACTIVE,
        },
      });

      return {
        status: true,
        message: 'Service registered successfully',
      };
    } catch (e) {
      return {
        error: e.message,
        status: false,
        message: 'Service registration failed',
      };
    }
  }

  public async getAllServices(): Promise<{
    status: boolean;
    message: string;
    data: {
      services: Service[];
    };
    error?: string;
  }> {
    try {
      const services = (await this.prisma.service.findMany()).map((s) =>
        this.mapPrismaServiceToDto(s),
      );

      return {
        status: true,
        message: 'Get active services successfully',
        data: {
          services,
        },
      };
    } catch (e) {
      return {
        error: e.message,
        status: false,
        message: 'Get active services failed',
        data: {
          services: [],
        },
      };
    }
  }

  public async getActiveServices(): Promise<{
    status: boolean;
    message: string;
    data: {
      services: Service[];
    };
    error?: string;
  }> {
    try {
      const services = (
        await this.prisma.service.findMany({
          where: {
            status: ServiceStatus.ACTIVE,
          },
        })
      ).map((s) => this.mapPrismaServiceToDto(s));

      return {
        status: true,
        message: 'Get active services successfully',
        data: {
          services,
        },
      };
    } catch (e) {
      return {
        error: e.message,
        status: false,
        message: 'Get active services failed',
        data: {
          services: [],
        },
      };
    }
  }

  public async updateServiceStatusById(
    id: string,
    status: ServiceStatus,
  ): Promise<void> {
    await this.prisma.service.update({ where: { id }, data: { status } });
  }

  public async updateServiceLoadById(
    id: string,
    load: number,
    status: ServiceStatus,
  ): Promise<void> {
    await this.prisma.service.update({
      where: { id },
      data: { load: new Prisma.Decimal(load), status },
    });
  }

  public async getLeastLoadedService(
    data: IGetServiceRequest,
  ): Promise<IGetServiceResponse> {
    try {
      const { type } = data;

      const activeServices = (
        await this.prisma.service.findMany({
          where: { status: ServiceStatus.ACTIVE, type },
          orderBy: { load: 'asc' },
        })
      ).map((s) => this.mapPrismaServiceToDto(s));

      if (activeServices.length === 0) {
        return {
          data: { service: null },
          message: 'No active service available',
          status: true,
        };
      }

      return {
        data: { service: activeServices[0] },
        message: 'Service found',
        status: true,
      };
    } catch (e) {
      return {
        error: e.message,
        data: { service: null },
        message: 'Get least loaded service failed',
        status: false,
      };
    }
  }
}
