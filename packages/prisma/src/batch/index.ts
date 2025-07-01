export * from './batch-prisma.service';
export * from './batch-prisma.module';
export {
  PrismaClient as BatchPrismaClient,
  Prisma as BatchPrisma,
  $Enums as BatchPrismaEnums,
} from './generated/client';
