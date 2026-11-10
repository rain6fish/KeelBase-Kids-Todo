// SPDX-License-Identifier: Apache-2.0

import { Body, Controller, Get, HttpCode, HttpStatus, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { CurrentAbility } from '../common/casl/current-ability.decorator';
import type { AppAbility } from '../common/casl/casl-ability.factory';
import type { JwtPayload } from '../auth/interfaces/jwt-payload.interface';
import { SyncService } from './sync.service';
import { RegisterDeviceDto } from './dto/register-device.dto';
import { PushChangesDto } from './dto/push-changes.dto';
import { AckDto } from './dto/ack.dto';

@ApiTags('离线同步')
@ApiBearerAuth()
@Controller({ path: 'sync', version: '1' })
export class SyncController {
  constructor(private readonly syncService: SyncService) {}

  @Post('register-device')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '登记/更新设备同步状态' })
  async registerDevice(@CurrentUser() user: JwtPayload, @Body() dto: RegisterDeviceDto) {
    return this.syncService.registerDevice(user, dto);
  }

  @Get('changes')
  @ApiOperation({ summary: '按 family 拉取 since 之后的增量变更' })
  async changes(
    @CurrentUser() user: JwtPayload,
    @Query('since') since?: string,
    @Query('limit') limit?: string,
    @Query('deviceId') deviceId?: string,
  ) {
    return this.syncService.pull(
      user,
      since ? Number(since) : 0,
      limit ? Number(limit) : 200,
      deviceId,
    );
  }

  @Post('push')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '推送离线期间的本地变更（逐条返回 applied/conflict/error）' })
  async push(
    @CurrentUser() user: JwtPayload,
    @CurrentAbility() ability: AppAbility,
    @Body() dto: PushChangesDto,
  ) {
    return this.syncService.push(user, ability, dto);
  }

  @Post('ack')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '确认已处理到某个变更序号' })
  async ack(@CurrentUser() user: JwtPayload, @Body() dto: AckDto) {
    return this.syncService.ack(user, dto);
  }
}
