// SPDX-License-Identifier: Apache-2.0

/**
 * 创建奖励工具 — create_reward（写操作，需人工确认）
 *
 * EASY-2 自动生成：requiresConfirmation + requireVerifiedEmail（HS-2/HS-6）；
 * 幂等与撤销由 AiToolEffectsService 处理（resultType: reward）。
 */

import { AiTool, ToolDefinition, ToolParameter, ToolResult } from '../interfaces/tool.interface';

interface RewardsServiceLike {
  create(dto: any, userId: number): Promise<any>;
}

export class CreateRewardTool implements AiTool {
  readonly name = 'create_reward';
  readonly riskLevel = 'R3';
  readonly requiresConfirmation = true;
  readonly permissions = { requireVerifiedEmail: true };
  readonly description = '创建奖励（奖励名称、描述、所需积分、启用）。这是写操作，系统会弹出确认框，用户确认后才真正创建。';
  readonly parameters: ToolParameter[] = [
    { name: 'title', type: 'string', description: '奖励名称', required: true },
    { name: 'description', type: 'string', description: '描述', required: false },
    { name: 'pointsCost', type: 'number', description: '所需积分', required: true },
    { name: 'isActive', type: 'boolean', description: '启用', required: false },
  ];

  constructor(private readonly rewardsService: RewardsServiceLike) {}

  toToolDefinition(): ToolDefinition {
    return {
      type: 'function',
      function: {
        name: this.name,
        description: this.description,
        parameters: {
          type: 'object',
          properties: {
            title: { type: 'string', description: '奖励名称' },
            description: { type: 'string', description: '描述' },
            pointsCost: { type: 'number', description: '所需积分' },
            isActive: { type: 'boolean', description: '启用' },
          },
          required: ['title', 'pointsCost'],
        },
      },
    };
  }

  async execute(args: Record<string, unknown>, userId: string): Promise<ToolResult> {
    try {
      const dto: Record<string, unknown> = {};
        if (args.title !== undefined) dto.title = args.title as any;
        if (args.description !== undefined) dto.description = args.description as any;
        if (args.pointsCost !== undefined) dto.pointsCost = args.pointsCost as any;
        if (args.isActive !== undefined) dto.isActive = args.isActive as any;
      const entity = await this.rewardsService.create(dto, Number(userId));
      return { success: true, data: { id: entity.id, title: entity.title } };
    } catch (err) {
      return { success: false, error: (err as Error).message };
    }
  }
}
