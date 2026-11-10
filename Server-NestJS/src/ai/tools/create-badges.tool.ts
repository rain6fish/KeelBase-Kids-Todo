// SPDX-License-Identifier: Apache-2.0

/**
 * 创建徽章工具 — create_badge（写操作，需人工确认）
 *
 * EASY-2 自动生成：requiresConfirmation + requireVerifiedEmail（HS-2/HS-6）；
 * 幂等与撤销由 AiToolEffectsService 处理（resultType: badge）。
 */

import { AiTool, ToolDefinition, ToolParameter, ToolResult } from '../interfaces/tool.interface';

interface BadgesServiceLike {
  create(dto: any, userId: number): Promise<any>;
}

export class CreateBadgeTool implements AiTool {
  readonly name = 'create_badge';
  readonly riskLevel = 'R3';
  readonly requiresConfirmation = true;
  readonly permissions = { requireVerifiedEmail: true };
  readonly description = '创建徽章（徽章名称、描述、徽章类型、达成阈值、图标地址）。这是写操作，系统会弹出确认框，用户确认后才真正创建。';
  readonly parameters: ToolParameter[] = [
    { name: 'name', type: 'string', description: '徽章名称', required: true },
    { name: 'description', type: 'string', description: '描述', required: false },
    { name: 'badgeType', type: 'string', description: '徽章类型', required: true,
      enum: ['streak_3', 'streak_7', 'streak_30', 'streak_100', 'points_50', 'points_200', 'points_500', 'perfect_day', 'perfect_week'] },
    { name: 'threshold', type: 'number', description: '达成阈值', required: false },
    { name: 'iconUrl', type: 'string', description: '图标地址', required: true },
  ];

  constructor(private readonly badgesService: BadgesServiceLike) {}

  toToolDefinition(): ToolDefinition {
    return {
      type: 'function',
      function: {
        name: this.name,
        description: this.description,
        parameters: {
          type: 'object',
          properties: {
            name: { type: 'string', description: '徽章名称' },
            description: { type: 'string', description: '描述' },
            badgeType: { type: 'string', description: '徽章类型', enum: ['streak_3', 'streak_7', 'streak_30', 'streak_100', 'points_50', 'points_200', 'points_500', 'perfect_day', 'perfect_week'] },
            threshold: { type: 'number', description: '达成阈值' },
            iconUrl: { type: 'string', description: '图标地址' },
          },
          required: ['name', 'badgeType', 'iconUrl'],
        },
      },
    };
  }

  async execute(args: Record<string, unknown>, userId: string): Promise<ToolResult> {
    try {
      const dto: Record<string, unknown> = {};
        if (args.name !== undefined) dto.name = args.name as any;
        if (args.description !== undefined) dto.description = args.description as any;
        if (args.badgeType !== undefined) dto.badgeType = args.badgeType as any;
        if (args.threshold !== undefined) dto.threshold = args.threshold as any;
        if (args.iconUrl !== undefined) dto.iconUrl = args.iconUrl as any;
      const entity = await this.badgesService.create(dto, Number(userId));
      return { success: true, data: { id: entity.id, name: entity.name } };
    } catch (err) {
      return { success: false, error: (err as Error).message };
    }
  }
}
