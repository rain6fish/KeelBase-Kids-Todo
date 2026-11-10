// SPDX-License-Identifier: Apache-2.0

/**
 * 查询成就工具 — query_achievements（只读）
 *
 * 按 userId 限定数据范围（本人数据）；EASY-2 自动生成。
 */

import { AiTool, ToolDefinition, ToolParameter, ToolResult } from '../interfaces/tool.interface';

interface AchievementsServiceLike {
  findAll(userId: number): Promise<any[]>;
}

export class QueryAchievementsTool implements AiTool {
  readonly name = 'query_achievements';
  readonly description = '查询成就列表（本人数据）。用户问"有哪些成就"时使用。';
  readonly parameters: ToolParameter[] = [];

  constructor(private readonly achievementsService: AchievementsServiceLike) {}

  toToolDefinition(): ToolDefinition {
    return {
      type: 'function',
      function: {
        name: this.name,
        description: this.description,
        parameters: { type: 'object', properties: {} },
      },
    };
  }

  async execute(args: Record<string, unknown>, userId: string): Promise<ToolResult> {
    try {
      const items = await this.achievementsService.findAll(Number(userId));
      const data = items.map((item) => {
        const o: Record<string, unknown> = { id: item.id };
        o.totalPoints = item.totalPoints;
        o.currentStreak = item.currentStreak;
        o.longestStreak = item.longestStreak;
        o.lastActiveDate = item.lastActiveDate;
        return o;
      });
      return { success: true, data };
    } catch (err) {
      return { success: false, error: (err as Error).message };
    }
  }
}
