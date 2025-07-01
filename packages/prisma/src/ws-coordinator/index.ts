export * from './ws-coordinator-prisma.service';
export * from './ws-coordinator-prisma.module';
export {
  PrismaClient as WsCoordinatorPrismaClient,
  Prisma as WsCoordinatorPrisma,
  $Enums as WsCoordinatorPrismaEnums,
} from './generated/client';
