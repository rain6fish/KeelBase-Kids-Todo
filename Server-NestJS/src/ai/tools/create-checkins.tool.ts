// SPDX-License-Identifier: Apache-2.0

/**
 * 创建打卡工具 — create_checkin（写操作，需人工确认）
 *
 * EASY-2 自动生成：requiresConfirmation + requireVerifiedEmail（HS-2/HS-6）；
 * 幂等与撤销由 AiToolEffectsService 处理（resultType: checkin）。
 */

import { AiTool, ToolDefinition, ToolParameter, ToolResult } from '../interfaces/tool.interface';

interface CheckinsServiceLike {
  create(dto: any, userId: number): Promise<any>;
}

export class CreateCheckinTool implements AiTool {
  readonly name = 'create_checkin';
  readonly riskLevel = 'R2';
  readonly permissions = { requireVerifiedEmail: true };
  readonly description = '创建打卡（打卡日期、任务总数、完成数、全部完成、获得积分）。这是写操作，系统会弹出确认框，用户确认后才真正创建。';
  readonly parameters: ToolParameter[] = [
    { name: 'checkDate', type: 'string', description: '打卡日期', required: true },
    { name: 'totalTasks', type: 'number', description: '任务总数', required: false },
    { name: 'doneTasks', type: 'number', description: '完成数', required: false },
    { name: 'isPerfect', type: 'boolean', description: '全部完成', required: false },
    { name: 'pointsEarned', type: 'number', description: '获得积分', required: false },
  ];

  constructor(private readonly checkinsService: CheckinsServiceLike) {}

  toToolDefinition(): ToolDefinition {
    return {
      type: 'function',
      function: {
        name: this.name,
        description: this.description,
        parameters: {
          type: 'object',
          properties: {
            checkDate: { type: 'string', description: '打卡日期' },
            totalTasks: { type: 'number', description: '任务总数' },
            doneTasks: { type: 'number', description: '完成数' },
            isPerfect: { type: 'boolean', description: '全部完成' },
            pointsEarned: { type: 'number', description: '获得积分' },
          },
          required: ['checkDate'],
        },
      },
    };
  }

  async execute(args: Record<string, unknown>, userId: string): Promise<ToolResult> {
    try {
      const dto: Record<string, unknown> = {};
        if (args.checkDate !== undefined) dto.checkDate = args.checkDate as any;
        if (args.totalTasks !== undefined) dto.totalTasks = args.totalTasks as any;
        if (args.doneTasks !== undefined) dto.doneTasks = args.doneTasks as any;
        if (args.isPerfect !== undefined) dto.isPerfect = args.isPerfect as any;
        if (args.pointsEarned !== undefined) dto.pointsEarned = args.pointsEarned as any;
      const entity = await this.checkinsService.create(dto, Number(userId));
      return { success: true, data: { id: entity.id, checkDate: entity.checkDate } };
    } catch (err) {
      return { success: false, error: (err as Error).message };
    }
  }
}
