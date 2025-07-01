export * from './shared-prisma.service';
export * from './shared-prisma.module';
export {
  PrismaClient as SharedPrismaClient,
  Prisma as SharedPrisma,
  $Enums as SharedPrismaEnums,
} from './generated/client';
