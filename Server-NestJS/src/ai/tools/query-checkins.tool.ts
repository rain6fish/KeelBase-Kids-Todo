// SPDX-License-Identifier: Apache-2.0

/**
 * 查询打卡工具 — query_checkins（只读）
 *
 * 按 userId 限定数据范围（本人数据）；EASY-2 自动生成。
 */

import { AiTool, ToolDefinition, ToolParameter, ToolResult } from '../interfaces/tool.interface';

interface CheckinsServiceLike {
  findAll(userId: number): Promise<any[]>;
}

export class QueryCheckinsTool implements AiTool {
  readonly name = 'query_checkins';
  readonly description = '查询打卡列表（本人数据）。用户问"有哪些打卡"时使用。';
  readonly parameters: ToolParameter[] = [];

  constructor(private readonly checkinsService: CheckinsServiceLike) {}

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
      const items = await this.checkinsService.findAll(Number(userId));
      const data = items.map((item) => {
        const o: Record<string, unknown> = { id: item.id };
        o.checkDate = item.checkDate;
        o.totalTasks = item.totalTasks;
        o.doneTasks = item.doneTasks;
        o.isPerfect = item.isPerfect;
        o.pointsEarned = item.pointsEarned;
        return o;
      });
      return { success: true, data };
    } catch (err) {
      return { success: false, error: (err as Error).message };
    }
  }
}
