// SPDX-License-Identifier: Apache-2.0

/**
 * 查询奖励工具 — query_rewards（只读）
 *
 * 按 userId 限定数据范围（本人数据）；EASY-2 自动生成。
 */

import { AiTool, ToolDefinition, ToolParameter, ToolResult } from '../interfaces/tool.interface';

interface RewardsServiceLike {
  findAll(userId: number, q?: string): Promise<any[]>;
}

export class QueryRewardsTool implements AiTool {
  readonly name = 'query_rewards';
  readonly description = '查询奖励列表（本人数据）。用户问"有哪些奖励"时使用。';
  readonly parameters: ToolParameter[] = [
    { name: 'keyword', type: 'string', description: '关键字（可选）', required: false },
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
            keyword: { type: 'string', description: '关键字（可选）' },
          },
        },
      },
    };
  }

  async execute(args: Record<string, unknown>, userId: string): Promise<ToolResult> {
    try {
      const keyword = typeof args.keyword === 'string' ? args.keyword : undefined;
      const items = await this.rewardsService.findAll(Number(userId), keyword);
      const data = items.map((item) => {
        const o: Record<string, unknown> = { id: item.id };
        o.title = item.title;
        o.description = item.description;
        o.pointsCost = item.pointsCost;
        o.isActive = item.isActive;
        return o;
      });
      return { success: true, data };
    } catch (err) {
      return { success: false, error: (err as Error).message };
    }
  }
}
