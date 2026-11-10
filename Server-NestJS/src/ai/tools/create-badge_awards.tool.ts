// SPDX-License-Identifier: Apache-2.0

/**
 * 创建徽章授予工具 — create_badge_award（写操作，需人工确认）
 *
 * EASY-2 自动生成：requiresConfirmation + requireVerifiedEmail（HS-2/HS-6）；
 * 幂等与撤销由 AiToolEffectsService 处理（resultType: badge_award）。
 */

import { AiTool, ToolDefinition, ToolParameter, ToolResult } from '../interfaces/tool.interface';

interface BadgeAwardsServiceLike {
  create(dto: any, userId: number): Promise<any>;
}

export class CreateBadgeAwardTool implements AiTool {
  readonly name = 'create_badge_award';
  readonly riskLevel = 'R3';
  readonly requiresConfirmation = true;
  readonly permissions = { requireVerifiedEmail: true };
  readonly description = '创建徽章授予（徽章、获得日期）。这是写操作，系统会弹出确认框，用户确认后才真正创建。';
  readonly parameters: ToolParameter[] = [
    { name: 'badgeId', type: 'string', description: '徽章', required: true },
    { name: 'earnedOn', type: 'string', description: '获得日期', required: false },
  ];

  constructor(private readonly badge_awardsService: BadgeAwardsServiceLike) {}

  toToolDefinition(): ToolDefinition {
    return {
      type: 'function',
      function: {
        name: this.name,
        description: this.description,
        parameters: {
          type: 'object',
          properties: {
            badgeId: { type: 'string', description: '徽章' },
            earnedOn: { type: 'string', description: '获得日期' },
          },
          required: ['badgeId'],
        },
      },
    };
  }

  async execute(args: Record<string, unknown>, userId: string): Promise<ToolResult> {
    try {
      const dto: Record<string, unknown> = {};
        if (args.badgeId !== undefined) dto.badgeId = args.badgeId as any;
        if (args.earnedOn !== undefined) dto.earnedOn = args.earnedOn as any;
      const entity = await this.badge_awardsService.create(dto, Number(userId));
      return { success: true, data: { id: entity.id, badgeId: entity.badgeId } };
    } catch (err) {
      return { success: false, error: (err as Error).message };
    }
  }
}
