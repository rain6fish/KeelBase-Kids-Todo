// SPDX-License-Identifier: Apache-2.0

/**
 * 创建家庭工具 — create_familie（写操作，需人工确认）
 *
 * EASY-2 自动生成：requiresConfirmation + requireVerifiedEmail（HS-2/HS-6）；
 * 幂等与撤销由 AiToolEffectsService 处理（resultType: familie）。
 */

import { AiTool, ToolDefinition, ToolParameter, ToolResult } from '../interfaces/tool.interface';

interface FamiliesServiceLike {
  create(dto: any, userId: number): Promise<any>;
}

export class CreateFamilieTool implements AiTool {
  readonly name = 'create_familie';
  readonly riskLevel = 'R3';
  readonly requiresConfirmation = true;
  readonly permissions = { requireVerifiedEmail: true };
  readonly description = '创建家庭（家庭名称、邀请码、审批模式、可用开始、可用结束）。这是写操作，系统会弹出确认框，用户确认后才真正创建。';
  readonly parameters: ToolParameter[] = [
    { name: 'name', type: 'string', description: '家庭名称', required: true },
    { name: 'inviteCode', type: 'string', description: '邀请码', required: true },
    { name: 'approvalMode', type: 'boolean', description: '审批模式', required: false },
    { name: 'useTimeStart', type: 'string', description: '可用开始', required: true },
    { name: 'useTimeEnd', type: 'string', description: '可用结束', required: true },
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
            name: { type: 'string', description: '家庭名称' },
            inviteCode: { type: 'string', description: '邀请码' },
            approvalMode: { type: 'boolean', description: '审批模式' },
            useTimeStart: { type: 'string', description: '可用开始' },
            useTimeEnd: { type: 'string', description: '可用结束' },
          },
          required: ['name', 'inviteCode', 'useTimeStart', 'useTimeEnd'],
        },
      },
    };
  }

  async execute(args: Record<string, unknown>, userId: string): Promise<ToolResult> {
    try {
      const dto: Record<string, unknown> = {};
        if (args.name !== undefined) dto.name = args.name as any;
        if (args.inviteCode !== undefined) dto.inviteCode = args.inviteCode as any;
        if (args.approvalMode !== undefined) dto.approvalMode = args.approvalMode as any;
        if (args.useTimeStart !== undefined) dto.useTimeStart = args.useTimeStart as any;
        if (args.useTimeEnd !== undefined) dto.useTimeEnd = args.useTimeEnd as any;
      const entity = await this.familiesService.create(dto, Number(userId));
      return { success: true, data: { id: entity.id, name: entity.name } };
    } catch (err) {
      return { success: false, error: (err as Error).message };
    }
  }
}
