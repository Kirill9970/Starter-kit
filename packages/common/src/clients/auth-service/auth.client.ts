import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy, RmqOptions, Transport } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';

import {
  ApiKeyValidateDto,
  CreateApiKeyDto,
  IActiveSessionsRequest,
  IActiveSessionsResponse,
  IApiKeyCreateResponse,
  IApiKeyListResponse,
  IApiKeyRemoveResponse,
  INativeLogin,
  ISessionCreateRequest,
  ISessionCreateResponse,
  ISessionsHistoryRequest,
  ISessionsHistoryResponse,
  ISessionUntilDateRequest,
  ISessionUntilDateResponse,
  ITerminateAllRequest,
  ITerminateAllResponse,
  ITerminateSessionRequest,
  ITerminateSessionResponse,
  ITokenCreateRequest,
  ITokenCreateResponse,
  ITokenRefreshRequest,
  ITokenRefreshResponse,
  ITokenVerifyRequest,
  ITokenVerifyResponse,
  UpdateApiKeyDto,
} from '../../types';
import { createRmqMessage } from '../../utils';

export const AUTH_INJECT_TOKEN = 'AUTH_SERVICE';

export const loadAuthClientOptions = (): RmqOptions => {
  const { env } = process;

  const BROKER_URL = env[`AUTH_SERVICE_RMQ_URL`] as string;
  const BROKER_QUEUE = env[`AUTH_SERVICE_RMQ_QUEUE`] as string;

  return {
    transport: Transport.RMQ,
    options: {
      urls: [BROKER_URL],
      queue: BROKER_QUEUE,
      queueOptions: {
        durable: false,
      },
    },
  };
};

@Injectable()
export class AuthClient {
  constructor(
    @Inject(AUTH_INJECT_TOKEN) private readonly authClientProxy: ClientProxy,
  ) {}

  /**
   * Native authentication (email/password).
   * @param request - Native login credentials and session data.
   * @param traceId - Trace identifier for request tracing in the system.
   * @param serviceToken - Token for zero-trust authorization between services.
   * @returns Authentication result with session data.
   */
  async authenticateNative(
    request: INativeLogin,
    traceId: string,
    serviceToken: string,
  ): Promise<any> {
    return await firstValueFrom(
      this.authClientProxy.send(
        AuthClientPatterns.AUTHENTICATE_NATIVE,
        await createRmqMessage(traceId, serviceToken, request),
      ),
    );
  }

  /**
   * OAuth/Social authentication.
   * @param request - OAuth credentials and session data.
   * @param traceId - Trace identifier for request tracing in the system.
   * @param serviceToken - Token for zero-trust authorization between services.
   * @returns Authentication result with session data.
   */
  async authenticateSocial(
    request: any,
    traceId: string,
    serviceToken: string,
  ): Promise<ISessionCreateResponse> {
    return await firstValueFrom(
      this.authClientProxy.send(
        AuthClientPatterns.AUTHENTICATE_SOCIAL,
        await createRmqMessage(traceId, serviceToken, request),
      ),
    );
  }

  /**
   * Creates a new session based on the provided request data.
   * @param request - Session creation request data.
   * @param traceId - Trace identifier for request tracing in the system.
   * @param serviceToken - Token for zero-trust authorization between services.
   * @returns Session creation result.
   */
  async sessionCreate(
    request: ISessionCreateRequest,
    traceId: string,
    serviceToken: string,
  ): Promise<ISessionCreateResponse> {
    return await firstValueFrom(
      this.authClientProxy.send(
        AuthClientPatterns.SESSION_CREATE,
        await createRmqMessage(traceId, serviceToken, request),
      ),
    );
  }

  /**
   * Creates and returns access and refresh tokens.
   * @param request - Token creation request data.
   * @param traceId - Trace identifier for request tracing in the system.
   * @param serviceToken - Token for zero-trust authorization between services.
   * @returns Token creation result.
   */
  async tokensCreate(
    request: ITokenCreateRequest,
    traceId: string,
    serviceToken: string,
  ): Promise<ITokenCreateResponse> {
    return await firstValueFrom(
      this.authClientProxy.send(
        AuthClientPatterns.TOKENS_CREATE,
        await createRmqMessage(traceId, serviceToken, request),
      ),
    );
  }

  /**
   * Verifies the provided token and returns verification result.
   * @param request - Token verification request data.
   * @param traceId - Trace identifier for request tracing in the system.
   * @param serviceToken - Token for zero-trust authorization between services.
   * @param isRejectDifferentIp - Optional flag to reject tokens from different IPs.
   * @returns Token verification result.
   */
  async tokenVerify(
    request: ITokenVerifyRequest,
    traceId: string,
    serviceToken: string,
    isRejectDifferentIp?: boolean,
  ): Promise<ITokenVerifyResponse> {
    return await firstValueFrom(
      this.authClientProxy.send(
        AuthClientPatterns.TOKEN_VERIFY,
        await createRmqMessage(traceId, serviceToken, {
          ...request,
          isRejectDifferentIp,
        }),
      ),
    );
  }

  /**
   * Refreshes the provided refresh token and returns a new access token.
   * @param request - Token refresh request data.
   * @param traceId - Trace identifier for request tracing in the system.
   * @param serviceToken - Token for zero-trust authorization between services.
   * @returns Token refresh result.
   */
  async refreshToken(
    request: ITokenRefreshRequest,
    traceId: string,
    serviceToken: string,
  ): Promise<ITokenRefreshResponse> {
    return await firstValueFrom(
      this.authClientProxy.send(
        AuthClientPatterns.REFRESH_TOKEN,
        await createRmqMessage(traceId, serviceToken, request),
      ),
    );
  }

  /**
   * Terminates all active sessions for a given user.
   * @param traceId - Trace identifier for request tracing in the system.
   * @param serviceToken - Token for zero-trust authorization between services.
   * @param request - Session termination request data.
   * @returns Session termination result.
   */
  async terminateAllSessions(
    traceId: string,
    serviceToken: string,
    request: ITerminateAllRequest,
  ): Promise<ITerminateAllResponse> {
    return await firstValueFrom(
      this.authClientProxy.send(
        AuthClientPatterns.SESSION_TERMINATE_ALL,
        await createRmqMessage(traceId, serviceToken, request),
      ),
    );
  }

  /**
   * Terminates a specific session by its ID.
   * @param traceId - Trace identifier for request tracing in the system.
   * @param serviceToken - Token for zero-trust authorization between services.
   * @param request - Session termination request data.
   * @returns Session termination result.
   */
  async terminateSessionById(
    traceId: string,
    serviceToken: string,
    request: ITerminateSessionRequest,
  ): Promise<ITerminateSessionResponse> {
    return await firstValueFrom(
      this.authClientProxy.send(
        AuthClientPatterns.SESSION_TERMINATE,
        await createRmqMessage(traceId, serviceToken, request),
      ),
    );
  }

  /**
   * Returns an array of active sessions for a given user.
   * @param traceId - Trace identifier for request tracing in the system.
   * @param serviceToken - Token for zero-trust authorization between services.
   * @param request - Active sessions request data.
   * @returns List of active sessions.
   */
  async getActiveSessions(
    traceId: string,
    serviceToken: string,
    request: IActiveSessionsRequest,
  ): Promise<IActiveSessionsResponse> {
    return await firstValueFrom(
      this.authClientProxy.send(
        AuthClientPatterns.GET_ACTIVE_SESSIONS,
        await createRmqMessage(traceId, serviceToken, request),
      ),
    );
  }

  /**
   * Returns session history for a given user.
   * @param traceId - Trace identifier for request tracing in the system.
   * @param serviceToken - Token for zero-trust authorization between services.
   * @param request - Session history request data.
   * @returns Session history result.
   */
  async getSessionsHistory(
    traceId: string,
    serviceToken: string,
    request: ISessionsHistoryRequest,
  ): Promise<ISessionsHistoryResponse> {
    return await firstValueFrom(
      this.authClientProxy.send(
        AuthClientPatterns.GET_SESSIONS_HISTORY,
        await createRmqMessage(traceId, serviceToken, request),
      ),
    );
  }

  /**
   * Returns sessions until a specific date for a given user.
   * @param traceId - Trace identifier for request tracing in the system.
   * @param serviceToken - Token for zero-trust authorization between services.
   * @param request - Sessions until date request data.
   * @returns Sessions until date result.
   */
  async getSessionsUntilDate(
    traceId: string,
    serviceToken: string,
    request: ISessionUntilDateRequest,
  ): Promise<ISessionUntilDateResponse> {
    return await firstValueFrom(
      this.authClientProxy.send(
        AuthClientPatterns.GET_SESSIONS_UNTIL_DATE,
        await createRmqMessage(traceId, serviceToken, request),
      ),
    );
  }

  /**
   * Creates a new API key.
   * @param request - API key creation data.
   * @param traceId - Trace identifier for request tracing in the system.
   * @param serviceToken - Token for zero-trust authorization between services.
   * @returns API key creation result.
   */
  async apiKeyCreate(
    request: CreateApiKeyDto,
    traceId: string,
    serviceToken: string,
  ): Promise<IApiKeyCreateResponse> {
    return await firstValueFrom(
      this.authClientProxy.send(
        AuthClientPatterns.API_KEY_CREATE,
        await createRmqMessage(traceId, serviceToken, request),
      ),
    );
  }

  /**
   * Updates an existing API key.
   * @param request - API key update data.
   * @param traceId - Trace identifier for request tracing in the system.
   * @param serviceToken - Token for zero-trust authorization between services.
   * @returns API key update result.
   */
  async apiKeyUpdate(
    request: { userId: string; id: string; dto: UpdateApiKeyDto },
    traceId: string,
    serviceToken: string,
  ): Promise<IApiKeyCreateResponse> {
    return await firstValueFrom(
      this.authClientProxy.send(
        AuthClientPatterns.API_KEY_UPDATE,
        await createRmqMessage(traceId, serviceToken, request),
      ),
    );
  }

  /**
   * Removes an API key by its ID.
   * @param id - API key ID.
   * @param traceId - Trace identifier for request tracing in the system.
   * @param serviceToken - Token for zero-trust authorization between services.
   * @returns API key removal result.
   */
  async apiKeyRemove(
    request: { id: string; userId: string },
    traceId: string,
    serviceToken: string,
  ): Promise<IApiKeyRemoveResponse> {
    return await firstValueFrom(
      this.authClientProxy.send(
        AuthClientPatterns.API_KEY_DELETE,
        await createRmqMessage(traceId, serviceToken, request),
      ),
    );
  }

  /**
   * Returns a list of all API keys.
   * @param traceId - Trace identifier for request tracing in the system.
   * @param serviceToken - Token for zero-trust authorization between services.
   * @returns List of API keys.
   */
  async apiKeyList(
    traceId: string,
    serviceToken: string,
  ): Promise<IApiKeyListResponse> {
    return await firstValueFrom(
      this.authClientProxy.send(
        AuthClientPatterns.API_KEY_LIST,
        await createRmqMessage(traceId, serviceToken),
      ),
    );
  }

  /**
   * Validates an API key.
   * @param request - API key validation data.
   * @param traceId - Trace identifier for request tracing in the system.
   * @param serviceToken - Token for zero-trust authorization between services.
   * @returns API key validation result.
   */
  async apiKeyValidate(
    request: ApiKeyValidateDto,
    traceId: string,
    serviceToken: string,
  ): Promise<{
    status: boolean;
    serviceToken: string;
    user: { userId: string };
    message: string;
  }> {
    return await firstValueFrom(
      this.authClientProxy.send(
        AuthClientPatterns.API_KEY_VALIDATE,
        await createRmqMessage(traceId, serviceToken, request),
      ),
    );
  }
}

export enum AuthClientPatterns {
  AUTHENTICATE_NATIVE = 'auth:native',
  AUTHENTICATE_SOCIAL = 'auth:social',
  SESSION_CREATE = 'session:create',
  TOKENS_CREATE = 'tokens:create',
  TOKEN_VERIFY = 'token:verify',
  REFRESH_TOKEN = 'token:refresh',
  SESSION_TERMINATE_ALL = 'session:terminate:all',
  SESSION_TERMINATE = 'session:terminate',
  GET_ACTIVE_SESSIONS = 'sessions:get:active',
  GET_SESSIONS_HISTORY = 'sessions:get:history',
  GET_SESSIONS_UNTIL_DATE = 'sessions:get:until_date',
  API_KEY_CREATE = 'api_key:create',
  API_KEY_UPDATE = 'api_key:update',
  API_KEY_DELETE = 'api_key:delete',
  API_KEY_LIST = 'api_key:get:list',
  API_KEY_VALIDATE = 'api-key:validate',
}
