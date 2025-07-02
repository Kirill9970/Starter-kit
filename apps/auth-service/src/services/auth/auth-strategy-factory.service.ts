import { Injectable } from '@nestjs/common';
import {
  AuthCredentials,
  AuthStrategyType,
  IAuthResult,
  IAuthStrategy,
} from '@crypton-nestjs-kit/common';

// import { AppleOAuthStrategy } from '../strategies/apple-oauth.strategy';
// import { GoogleOAuthStrategy } from '../strategies/google-oauth.strategy';
import { NativeStrategy } from './strategies/native.strategy';
// import { TwitterOAuthStrategy } from '../strategies/twitter-oauth.strategy';

@Injectable()
export class AuthStrategyFactory {
  constructor(
    private readonly nativeStrategy: NativeStrategy, // private readonly googleOAuthStrategy: GoogleOAuthStrategy, // private readonly appleOAuthStrategy: AppleOAuthStrategy, // private readonly twitterOAuthStrategy: TwitterOAuthStrategy,
  ) {}

  /**
   * Создает стратегию авторизации на основе типа
   */
  createStrategy(strategyType: AuthStrategyType): IAuthStrategy {
    switch (strategyType) {
      case AuthStrategyType.NATIVE:
        return this.nativeStrategy;
      // case AuthStrategyType.GOOGLE:
      //   return this.googleOAuthStrategy;
      // case AuthStrategyType.APPLE:
      //   return this.appleOAuthStrategy;
      // case AuthStrategyType.TWITTER:
      //   return this.twitterOAuthStrategy;
      default:
        throw new Error(`Unsupported auth strategy type: ${strategyType}`);
    }
  }

  /**
   * Автоматически определяет тип стратегии на основе переданных данных
   */
  createStrategyFromCredentials(credentials: AuthCredentials): IAuthStrategy {
    if ('loginType' in credentials && 'password' in credentials) {
      return this.createStrategy(AuthStrategyType.NATIVE);
    }

    if ('provider' in credentials && 'accessToken' in credentials) {
      switch (credentials.provider.toLowerCase()) {
        case 'google':
          return this.createStrategy(AuthStrategyType.GOOGLE);
        case 'apple':
          return this.createStrategy(AuthStrategyType.APPLE);
        case 'twitter':
          return this.createStrategy(AuthStrategyType.TWITTER);
        default:
          throw new Error(
            `Unsupported OAuth provider: ${credentials.provider}`,
          );
      }
    }

    throw new Error('Invalid credentials format');
  }

  /**
   * Выполняет аутентификацию с автоматическим выбором стратегии
   */
  async authenticate(
    credentials: AuthCredentials,
    traceId?: string,
  ): Promise<IAuthResult> {
    const strategy = this.createStrategyFromCredentials(credentials);

    if ('provider' in credentials && 'accessToken' in credentials) {
      return await (strategy as any).validateOAuth(credentials);
    }

    return await strategy.authenticate(credentials, traceId);
  }

  /**
   * Получает список доступных стратегий
   */
  getAvailableStrategies(): AuthStrategyType[] {
    return Object.values(AuthStrategyType);
  }

  /**
   * Проверяет, поддерживается ли указанная стратегия
   */
  isStrategySupported(strategyType: AuthStrategyType): boolean {
    return this.getAvailableStrategies().includes(strategyType);
  }
}
