import { Body, Controller, Delete, Get, Param, Query } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { AuthClient } from '@crypton-nestjs-kit/common';

import { Authorization } from '../../decorators/authorization.decorator';
import { CorrelationIdFromRequest } from '../../decorators/correlation-id-from-request.decorator';
import { ServiceTokenFromRequest } from '../../decorators/service-token-from-request.decorator';
import { UserIdFromRequest } from '../../decorators/user-id-from-request.decorator';

import {
  GetSessionsHistoryDto,
  SessionResponseDto,
  TerminateAllSessionsDto,
  TerminateSessionDto,
} from './dto/session.dto';

// TODO: Структурировать и привести к общему виду сваггер документацию

@ApiTags('Sessions')
@Controller('v1/auth/sessions')
@ApiBearerAuth()
export class SessionsController {
  constructor(private readonly authClient: AuthClient) {}

  @ApiOperation({
    summary: 'Get active sessions',
    description: 'Returns a list of all active sessions for the current user',
  })
  @ApiResponse({
    status: 200,
    description: 'List of active sessions',
    type: SessionResponseDto,
  })
  @Authorization(true)
  @Get('active')
  async getActiveSessions(
    @CorrelationIdFromRequest() traceId: string,
    @UserIdFromRequest() userId: string,
    @ServiceTokenFromRequest() serviceToken: string,
  ): Promise<SessionResponseDto> {
    try {
      const sessions = await this.authClient.getActiveSessions(
        traceId,
        serviceToken,
        {
          userId,
        },
      );

      return {
        sessions: sessions.activeSessions,
        message: 'Sessions found',
        count: sessions.count,
      };
    } catch (e) {
      console.log(e);
    }
  }

  @ApiOperation({
    summary: 'Get sessions history',
    description: 'Returns a list of all sessions with optional date filtering',
  })
  @ApiResponse({
    status: 200,
    description: 'Session history',
    type: SessionResponseDto,
  })
  @Authorization(true)
  @Get('history')
  async getSessionsHistory(
    @CorrelationIdFromRequest() traceId: string,
    @UserIdFromRequest() userId: string,
    @ServiceTokenFromRequest() serviceToken: string,
    @Query() query: GetSessionsHistoryDto,
  ): Promise<SessionResponseDto> {
    const { page = 1, limit = 10 } = query;

    const sessionsData = await this.authClient.getSessionsHistory(
      traceId,
      serviceToken,
      {
        page,
        limit,
        userId,
        traceId,
      },
    );

    return {
      sessions: sessionsData.sessions,
      count: sessionsData.count,
      message: 'Session history found',
    };
  }

  @ApiOperation({
    summary: 'Terminate session',
    description: 'Terminates a specific session by its ID',
  })
  @ApiResponse({
    status: 200,
    description: 'Session successfully terminated',
  })
  @Authorization(true)
  @Delete('terminate/:id')
  async terminateSession(
    @CorrelationIdFromRequest() traceId: string,
    @UserIdFromRequest() userId: string,
    @ServiceTokenFromRequest() serviceToken: string,
    @Param('id') id: string,
    @Body() body: TerminateSessionDto,
  ): Promise<{ message: string }> {
    await this.authClient.terminateSessionById(traceId, serviceToken, {
      userId,
      sessionId: id,
    });

    return { message: 'Session terminated successfully' };
  }

  @ApiOperation({
    summary: 'Terminate all sessions',
    description: 'Terminates all active sessions for the current user',
  })
  @ApiResponse({
    status: 200,
    description: 'All sessions terminated successfully',
  })
  @Authorization(true)
  @Delete('terminate/all')
  async terminateAllSessions(
    @CorrelationIdFromRequest() traceId: string,
    @UserIdFromRequest() userId: string,
    @ServiceTokenFromRequest() serviceToken: string,
    @Body() body: TerminateAllSessionsDto,
  ): Promise<{ message: string }> {
    await this.authClient.terminateAllSessions(traceId, serviceToken, {
      userId,
    });

    return { message: 'All sessions terminated successfully' };
  }
}
