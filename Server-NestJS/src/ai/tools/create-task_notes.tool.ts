// SPDX-License-Identifier: Apache-2.0

/**
 * 创建任务备注工具 — create_task_note（写操作，需人工确认）
 *
 * EASY-2 自动生成：requiresConfirmation + requireVerifiedEmail（HS-2/HS-6）；
 * 幂等与撤销由 AiToolEffectsService 处理（resultType: task_note）。
 */

import { AiTool, ToolDefinition, ToolParameter, ToolResult } from '../interfaces/tool.interface';

interface TaskNotesServiceLike {
  create(dto: any, userId: number): Promise<any>;
}

export class CreateTaskNoteTool implements AiTool {
  readonly name = 'create_task_note';
  readonly riskLevel = 'R3';
  readonly requiresConfirmation = true;
  readonly permissions = { requireVerifiedEmail: true };
  readonly description = '创建任务备注（任务、内容、类型、媒体地址）。这是写操作，系统会弹出确认框，用户确认后才真正创建。';
  readonly parameters: ToolParameter[] = [
    { name: 'taskId', type: 'string', description: '任务', required: true },
    { name: 'content', type: 'string', description: '内容', required: true },
    { name: 'contentType', type: 'string', description: '类型', required: true,
      enum: ['text', 'voice', 'image'] },
    { name: 'mediaUrl', type: 'string', description: '媒体地址', required: true },
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
            taskId: { type: 'string', description: '任务' },
            content: { type: 'string', description: '内容' },
            contentType: { type: 'string', description: '类型', enum: ['text', 'voice', 'image'] },
            mediaUrl: { type: 'string', description: '媒体地址' },
          },
          required: ['taskId', 'content', 'contentType', 'mediaUrl'],
        },
      },
    };
  }

  async execute(args: Record<string, unknown>, userId: string): Promise<ToolResult> {
    try {
      const dto: Record<string, unknown> = {};
        if (args.taskId !== undefined) dto.taskId = args.taskId as any;
        if (args.content !== undefined) dto.content = args.content as any;
        if (args.contentType !== undefined) dto.contentType = args.contentType as any;
        if (args.mediaUrl !== undefined) dto.mediaUrl = args.mediaUrl as any;
      const entity = await this.task_notesService.create(dto, Number(userId));
      return { success: true, data: { id: entity.id, taskId: entity.taskId } };
    } catch (err) {
      return { success: false, error: (err as Error).message };
    }
  }
}
