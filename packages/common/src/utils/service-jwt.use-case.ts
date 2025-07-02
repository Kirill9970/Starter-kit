import { Inject, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@crypton-nestjs-kit/config';

/**
 * ServiceJwtGenerator is responsible for generating JWT tokens for inter-service (zero-trust) communication.
 */
@Injectable()
export class ServiceJwtGenerator {
  constructor(
    @Inject(JwtService)
    private readonly jwtService: JwtService,
    @Inject(ConfigService)
    private readonly configService: ConfigService,
  ) {}

  /**
   * Generates a service JWT token for inter-service requests.
   * @param options - JWT payload and signing options.
   *   - subject: Subject of the token (e.g., user id or service id)
   *   - actor: Who is acting (e.g., service name)
   *   - issuer: Who issues the token (e.g., api-gateway)
   *   - audience: Intended audience (e.g., user-service)
   *   - type: Token type (e.g., 'service', 'access')
   *   - permissions: Optional permissions/scope array
   *   - expiresIn: Optional expiration (default: '1m')
   * @returns JWT as string
   */
  async generateServiceJwt(options: {
    subject: string;
    actor: string;
    issuer: string;
    audience: string;
    type: string;
    permissions?: string[];
    expiresIn?: string | number;
  }): Promise<string> {
    const {
      subject,
      actor,
      issuer,
      audience,
      type,
      permissions,
      // expiresIn = '1h',
    } = options;

    // Use audience as the serviceId for secret lookup
    const secret = this.getServiceSecret(audience);

    // JWT standard claims: sub, act, iss, aud, typ, plus custom 'scope'
    const payload: Record<string, any> = {
      sub: subject,
      act: actor,
      iss: issuer,
      aud: audience,
      typ: type,
    };

    if (permissions) {
      payload.scope = permissions;
    }

    const token = await this.jwtService.signAsync(payload, {
      secret,
      expiresIn: 60 * 60,
    });

    return `${type}____${token}`;
  }

  /**
   * Returns the secret for a given serviceId (audience).
   * Tries both with and without '_service' suffix, then falls back to 'default'.
   * Throws if not found.
   * @param serviceId - Service identifier (audience)
   */
  private getServiceSecret(serviceId: string): string {
    const secrets = this.configService.get().auth.service_secrets as Record<
      string,
      string
    >;
    const secret =
      secrets[serviceId] || secrets[`${serviceId}_service`] || secrets.default;

    if (!secret) {
      throw new Error(`Service secret for "${serviceId}" not found`);
    }

    return secret;
  }
}
