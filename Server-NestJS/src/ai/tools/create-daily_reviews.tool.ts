// SPDX-License-Identifier: Apache-2.0

/**
 * 创建每日评价工具 — create_daily_review（写操作，需人工确认）
 *
 * EASY-2 自动生成：requiresConfirmation + requireVerifiedEmail（HS-2/HS-6）；
 * 幂等与撤销由 AiToolEffectsService 处理（resultType: daily_review）。
 */

import { AiTool, ToolDefinition, ToolParameter, ToolResult } from '../interfaces/tool.interface';

interface DailyReviewsServiceLike {
  create(dto: any, userId: number): Promise<any>;
}

export class CreateDailyReviewTool implements AiTool {
  readonly name = 'create_daily_review';
  readonly riskLevel = 'R3';
  readonly requiresConfirmation = true;
  readonly permissions = { requireVerifiedEmail: true };
  readonly description = '创建每日评价（评价日期、评价内容、评分）。这是写操作，系统会弹出确认框，用户确认后才真正创建。';
  readonly parameters: ToolParameter[] = [
    { name: 'reviewDate', type: 'string', description: '评价日期', required: true },
    { name: 'content', type: 'string', description: '评价内容', required: true },
    { name: 'rating', type: 'number', description: '评分', required: false },
  ];

  constructor(private readonly daily_reviewsService: DailyReviewsServiceLike) {}

  toToolDefinition(): ToolDefinition {
    return {
      type: 'function',
      function: {
        name: this.name,
        description: this.description,
        parameters: {
          type: 'object',
          properties: {
            reviewDate: { type: 'string', description: '评价日期' },
            content: { type: 'string', description: '评价内容' },
            rating: { type: 'number', description: '评分' },
          },
          required: ['reviewDate', 'content'],
        },
      },
    };
  }

  async execute(args: Record<string, unknown>, userId: string): Promise<ToolResult> {
    try {
      const dto: Record<string, unknown> = {};
        if (args.reviewDate !== undefined) dto.reviewDate = args.reviewDate as any;
        if (args.content !== undefined) dto.content = args.content as any;
        if (args.rating !== undefined) dto.rating = args.rating as any;
      const entity = await this.daily_reviewsService.create(dto, Number(userId));
      return { success: true, data: { id: entity.id, reviewDate: entity.reviewDate } };
    } catch (err) {
      return { success: false, error: (err as Error).message };
    }
  }
}
