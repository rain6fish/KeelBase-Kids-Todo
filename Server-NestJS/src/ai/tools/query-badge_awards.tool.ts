// SPDX-License-Identifier: Apache-2.0

/**
 * 查询徽章授予工具 — query_badge_awards（只读）
 *
 * 按 userId 限定数据范围（本人数据）；EASY-2 自动生成。
 */

import { AiTool, ToolDefinition, ToolParameter, ToolResult } from '../interfaces/tool.interface';

interface BadgeAwardsServiceLike {
  findAll(userId: number): Promise<any[]>;
}

export class QueryBadgeAwardsTool implements AiTool {
  readonly name = 'query_badge_awards';
  readonly description = '查询徽章授予列表（本人数据）。用户问"有哪些徽章授予"时使用。';
  readonly parameters: ToolParameter[] = [];

  constructor(private readonly badge_awardsService: BadgeAwardsServiceLike) {}

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
      const items = await this.badge_awardsService.findAll(Number(userId));
      const data = items.map((item) => {
        const o: Record<string, unknown> = { id: item.id };
        o.badgeId = item.badgeId;
        o.earnedOn = item.earnedOn;
        return o;
      });
      return { success: true, data };
    } catch (err) {
      return { success: false, error: (err as Error).message };
    }
  }
}
