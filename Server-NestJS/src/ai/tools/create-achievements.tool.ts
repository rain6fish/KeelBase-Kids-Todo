// SPDX-License-Identifier: Apache-2.0

/**
 * 创建成就工具 — create_achievement（写操作，需人工确认）
 *
 * EASY-2 自动生成：requiresConfirmation + requireVerifiedEmail（HS-2/HS-6）；
 * 幂等与撤销由 AiToolEffectsService 处理（resultType: achievement）。
 */

import { AiTool, ToolDefinition, ToolParameter, ToolResult } from '../interfaces/tool.interface';

interface AchievementsServiceLike {
  create(dto: any, userId: number): Promise<any>;
}

export class CreateAchievementTool implements AiTool {
  readonly name = 'create_achievement';
  readonly riskLevel = 'R2';
  readonly permissions = { requireVerifiedEmail: true };
  readonly description = '创建成就（累计积分、当前连签、最长连签、最后活跃日）。这是写操作，系统会弹出确认框，用户确认后才真正创建。';
  readonly parameters: ToolParameter[] = [
    { name: 'totalPoints', type: 'number', description: '累计积分', required: false },
    { name: 'currentStreak', type: 'number', description: '当前连签', required: false },
    { name: 'longestStreak', type: 'number', description: '最长连签', required: false },
    { name: 'lastActiveDate', type: 'string', description: '最后活跃日', required: false },
  ];

  constructor(private readonly achievementsService: AchievementsServiceLike) {}

  toToolDefinition(): ToolDefinition {
    return {
      type: 'function',
      function: {
        name: this.name,
        description: this.description,
        parameters: {
          type: 'object',
          properties: {
            totalPoints: { type: 'number', description: '累计积分' },
            currentStreak: { type: 'number', description: '当前连签' },
            longestStreak: { type: 'number', description: '最长连签' },
            lastActiveDate: { type: 'string', description: '最后活跃日' },
          },
          required: [],
        },
      },
    };
  }

  async execute(args: Record<string, unknown>, userId: string): Promise<ToolResult> {
    try {
      const dto: Record<string, unknown> = {};
        if (args.totalPoints !== undefined) dto.totalPoints = args.totalPoints as any;
        if (args.currentStreak !== undefined) dto.currentStreak = args.currentStreak as any;
        if (args.longestStreak !== undefined) dto.longestStreak = args.longestStreak as any;
        if (args.lastActiveDate !== undefined) dto.lastActiveDate = args.lastActiveDate as any;
      const entity = await this.achievementsService.create(dto, Number(userId));
      return { success: true, data: { id: entity.id, totalPoints: entity.totalPoints } };
    } catch (err) {
      return { success: false, error: (err as Error).message };
    }
  }
}
