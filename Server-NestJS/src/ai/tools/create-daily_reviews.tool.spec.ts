// SPDX-License-Identifier: Apache-2.0

import { CreateDailyReviewTool } from './create-daily_reviews.tool';

describe('CreateDailyReviewTool', () => {
  const mockService = { create: jest.fn() };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should have name and require confirmation + verified email', () => {
    const tool = new CreateDailyReviewTool(mockService as any);
    expect(tool.name).toBe('create_daily_review');
    expect(tool.requiresConfirmation).toBe(true);
    expect(tool.permissions.requireVerifiedEmail).toBe(true);
  });

  it('should build a valid tool definition', () => {
    const tool = new CreateDailyReviewTool(mockService as any);
    const def = tool.toToolDefinition();
    expect(def.function.name).toBe('create_daily_review');
    expect(def.function.parameters).toBeDefined();
  });

  it('should create and return id + first field', async () => {
    mockService.create.mockResolvedValue({ id: 7, reviewDate: 'sample' });
    const tool = new CreateDailyReviewTool(mockService as any);

    const result = await tool.execute({ reviewDate: 'sample' }, '1');

    expect(mockService.create).toHaveBeenCalledWith(expect.objectContaining({ reviewDate: 'sample' }), 1);
    expect(result).toEqual({ success: true, data: { id: 7, reviewDate: 'sample' } });
  });

  it('should return error when service throws', async () => {
    mockService.create.mockRejectedValue(new Error('boom'));
    const tool = new CreateDailyReviewTool(mockService as any);

    const result = await tool.execute({}, '1');

    expect(result.success).toBe(false);
    expect(result.error).toBe('boom');
  });
});
