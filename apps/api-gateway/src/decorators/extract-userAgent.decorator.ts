import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const RequestUserAgentFromRequest = createParamDecorator(
  (data: unknown, context: ExecutionContext): string => {
    const request = context.switchToHttp().getRequest();

    return request.headers['user-agent'] || null;
  },
);
