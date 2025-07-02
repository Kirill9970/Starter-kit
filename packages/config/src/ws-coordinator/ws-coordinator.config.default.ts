import { WsCoordinatorConfig } from './ws-coordinator.config.interface';

export const DEFAULT_WS_COORDINATOR_CONFIG: WsCoordinatorConfig = {
  prisma: {
    wsCoordinatorDatabaseUrl: '',
  },
};
