// SPDX-License-Identifier: Apache-2.0

/**
 * 创建任务工具 — create_task（写操作，需人工确认）
 *
 * EASY-2 自动生成：requiresConfirmation + requireVerifiedEmail（HS-2/HS-6）；
 * 幂等与撤销由 AiToolEffectsService 处理（resultType: task）。
 */

import { AiTool, ToolDefinition, ToolParameter, ToolResult } from '../interfaces/tool.interface';

interface TasksServiceLike {
  create(dto: any, userId: number): Promise<any>;
}

export class CreateTaskTool implements AiTool {
  readonly name = 'create_task';
  readonly riskLevel = 'R3';
  readonly requiresConfirmation = true;
  readonly permissions = { requireVerifiedEmail: true };
  readonly description = '创建任务（标题、描述、优先级、状态、任务日期、预计分钟、重复规则、审批状态、请求帮助、求助说明、排序）。这是写操作，系统会弹出确认框，用户确认后才真正创建。';
  readonly parameters: ToolParameter[] = [
    { name: 'title', type: 'string', description: '标题', required: true },
    { name: 'description', type: 'string', description: '描述', required: false },
    { name: 'priority', type: 'string', description: '优先级', required: true,
      enum: ['low', 'medium', 'high'] },
    { name: 'status', type: 'string', description: '状态', required: true,
      enum: ['todo', 'doing', 'done', 'cancelled'] },
    { name: 'taskDate', type: 'string', description: '任务日期', required: true },
    { name: 'estimatedMinutes', type: 'number', description: '预计分钟', required: false },
    { name: 'repeatRule', type: 'string', description: '重复规则', required: true,
      enum: ['none', 'daily', 'weekly', 'monthly'] },
    { name: 'approvalStatus', type: 'string', description: '审批状态', required: true,
      enum: ['none', 'pending', 'approved', 'rejected'] },
    { name: 'helpRequested', type: 'boolean', description: '请求帮助', required: false },
    { name: 'helpRequestNote', type: 'string', description: '求助说明', required: false },
    { name: 'sortOrder', type: 'number', description: '排序', required: false },
  ];

  constructor(private readonly tasksService: TasksServiceLike) {}

  toToolDefinition(): ToolDefinition {
    return {
      type: 'function',
      function: {
        name: this.name,
        description: this.description,
        parameters: {
          type: 'object',
          properties: {
            title: { type: 'string', description: '标题' },
            description: { type: 'string', description: '描述' },
            priority: { type: 'string', description: '优先级', enum: ['low', 'medium', 'high'] },
            status: { type: 'string', description: '状态', enum: ['todo', 'doing', 'done', 'cancelled'] },
            taskDate: { type: 'string', description: '任务日期' },
            estimatedMinutes: { type: 'number', description: '预计分钟' },
            repeatRule: { type: 'string', description: '重复规则', enum: ['none', 'daily', 'weekly', 'monthly'] },
            approvalStatus: { type: 'string', description: '审批状态', enum: ['none', 'pending', 'approved', 'rejected'] },
            helpRequested: { type: 'boolean', description: '请求帮助' },
            helpRequestNote: { type: 'string', description: '求助说明' },
            sortOrder: { type: 'number', description: '排序' },
          },
          required: ['title', 'priority', 'status', 'taskDate', 'repeatRule', 'approvalStatus'],
        },
      },
    };
  }

  async execute(args: Record<string, unknown>, userId: string): Promise<ToolResult> {
    try {
      const dto: Record<string, unknown> = {};
        if (args.title !== undefined) dto.title = args.title as any;
        if (args.description !== undefined) dto.description = args.description as any;
        if (args.priority !== undefined) dto.priority = args.priority as any;
        if (args.status !== undefined) dto.status = args.status as any;
        if (args.taskDate !== undefined) dto.taskDate = args.taskDate as any;
        if (args.estimatedMinutes !== undefined) dto.estimatedMinutes = args.estimatedMinutes as any;
        if (args.repeatRule !== undefined) dto.repeatRule = args.repeatRule as any;
        if (args.approvalStatus !== undefined) dto.approvalStatus = args.approvalStatus as any;
        if (args.helpRequested !== undefined) dto.helpRequested = args.helpRequested as any;
        if (args.helpRequestNote !== undefined) dto.helpRequestNote = args.helpRequestNote as any;
        if (args.sortOrder !== undefined) dto.sortOrder = args.sortOrder as any;
      const entity = await this.tasksService.create(dto, Number(userId));
      return { success: true, data: { id: entity.id, title: entity.title } };
    } catch (err) {
      return { success: false, error: (err as Error).message };
    }
  }
}
