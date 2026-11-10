// SPDX-License-Identifier: Apache-2.0

/**
 * 创建兑换记录工具 — create_reward_redemption（写操作，需人工确认）
 *
 * EASY-2 自动生成：requiresConfirmation + requireVerifiedEmail（HS-2/HS-6）；
 * 幂等与撤销由 AiToolEffectsService 处理（resultType: reward_redemption）。
 */

import { AiTool, ToolDefinition, ToolParameter, ToolResult } from '../interfaces/tool.interface';

interface RewardRedemptionsServiceLike {
  create(dto: any, userId: number): Promise<any>;
}

export class CreateRewardRedemptionTool implements AiTool {
  readonly name = 'create_reward_redemption';
  readonly riskLevel = 'R3';
  readonly requiresConfirmation = true;
  readonly permissions = { requireVerifiedEmail: true };
  readonly description = '创建兑换记录（奖励、消耗积分、已取消、备注）。这是写操作，系统会弹出确认框，用户确认后才真正创建。';
  readonly parameters: ToolParameter[] = [
    { name: 'rewardId', type: 'string', description: '奖励', required: true },
    { name: 'pointsSpent', type: 'number', description: '消耗积分', required: true },
    { name: 'isCancelled', type: 'boolean', description: '已取消', required: false },
    { name: 'note', type: 'string', description: '备注', required: false },
  ];

  constructor(private readonly reward_redemptionsService: RewardRedemptionsServiceLike) {}

  toToolDefinition(): ToolDefinition {
    return {
      type: 'function',
      function: {
        name: this.name,
        description: this.description,
        parameters: {
          type: 'object',
          properties: {
            rewardId: { type: 'string', description: '奖励' },
            pointsSpent: { type: 'number', description: '消耗积分' },
            isCancelled: { type: 'boolean', description: '已取消' },
            note: { type: 'string', description: '备注' },
          },
          required: ['rewardId', 'pointsSpent'],
        },
      },
    };
  }

  async execute(args: Record<string, unknown>, userId: string): Promise<ToolResult> {
    try {
      const dto: Record<string, unknown> = {};
        if (args.rewardId !== undefined) dto.rewardId = args.rewardId as any;
        if (args.pointsSpent !== undefined) dto.pointsSpent = args.pointsSpent as any;
        if (args.isCancelled !== undefined) dto.isCancelled = args.isCancelled as any;
        if (args.note !== undefined) dto.note = args.note as any;
      const entity = await this.reward_redemptionsService.create(dto, Number(userId));
      return { success: true, data: { id: entity.id, rewardId: entity.rewardId } };
    } catch (err) {
      return { success: false, error: (err as Error).message };
    }
  }
}
