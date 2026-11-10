// SPDX-License-Identifier: Apache-2.0

/**
 * 查询任务备注工具 — query_task_notes（只读）
 *
 * 按 userId 限定数据范围（本人数据）；EASY-2 自动生成。
 */

import { AiTool, ToolDefinition, ToolParameter, ToolResult } from '../interfaces/tool.interface';

interface TaskNotesServiceLike {
  findAll(userId: number, q?: string): Promise<any[]>;
}

export class QueryTaskNotesTool implements AiTool {
  readonly name = 'query_task_notes';
  readonly description = '查询任务备注列表（本人数据）。用户问"有哪些任务备注"时使用。';
  readonly parameters: ToolParameter[] = [
    { name: 'keyword', type: 'string', description: '关键字（可选）', required: false },
  ];

  constructor(private readonly task_notesService: TaskNotesServiceLike) {}

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
      const items = await this.task_notesService.findAll(Number(userId), keyword);
      const data = items.map((item) => {
        const o: Record<string, unknown> = { id: item.id };
        o.taskId = item.taskId;
        o.content = item.content;
        o.contentType = item.contentType;
        o.mediaUrl = item.mediaUrl;
        return o;
      });
      return { success: true, data };
    } catch (err) {
      return { success: false, error: (err as Error).message };
    }
  }
}
