// SPDX-License-Identifier: Apache-2.0

/**
 * 查询家庭工具 — query_families（只读）
 *
 * 按 userId 限定数据范围（本人数据）；EASY-2 自动生成。
 */

import { AiTool, ToolDefinition, ToolParameter, ToolResult } from '../interfaces/tool.interface';

interface FamiliesServiceLike {
  findAll(userId: number, q?: string): Promise<any[]>;
}

export class QueryFamiliesTool implements AiTool {
  readonly name = 'query_families';
  readonly description = '查询家庭列表（本人数据）。用户问"有哪些家庭"时使用。';
  readonly parameters: ToolParameter[] = [
    { name: 'keyword', type: 'string', description: '关键字（可选）', required: false },
  ];

  constructor(private readonly familiesService: FamiliesServiceLike) {}

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
      const items = await this.familiesService.findAll(Number(userId), keyword);
      const data = items.map((item) => {
        const o: Record<string, unknown> = { id: item.id };
        o.name = item.name;
        o.inviteCode = item.inviteCode;
        o.approvalMode = item.approvalMode;
        o.useTimeStart = item.useTimeStart;
        o.useTimeEnd = item.useTimeEnd;
        return o;
      });
      return { success: true, data };
    } catch (err) {
      return { success: false, error: (err as Error).message };
    }
  }
}
