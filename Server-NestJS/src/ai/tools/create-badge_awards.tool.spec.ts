// SPDX-License-Identifier: Apache-2.0

import { CreateBadgeAwardTool } from './create-badge_awards.tool';

describe('CreateBadgeAwardTool', () => {
  const mockService = { create: jest.fn() };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should have name and require confirmation + verified email', () => {
    const tool = new CreateBadgeAwardTool(mockService as any);
    expect(tool.name).toBe('create_badge_award');
    expect(tool.requiresConfirmation).toBe(true);
    expect(tool.permissions.requireVerifiedEmail).toBe(true);
  });

  it('should build a valid tool definition', () => {
    const tool = new CreateBadgeAwardTool(mockService as any);
    const def = tool.toToolDefinition();
    expect(def.function.name).toBe('create_badge_award');
    expect(def.function.parameters).toBeDefined();
  });

  it('should create and return id + first field', async () => {
    mockService.create.mockResolvedValue({ id: 7, badgeId: 'sample' });
    const tool = new CreateBadgeAwardTool(mockService as any);

    const result = await tool.execute({ badgeId: 'sample' }, '1');

    expect(mockService.create).toHaveBeenCalledWith(expect.objectContaining({ badgeId: 'sample' }), 1);
    expect(result).toEqual({ success: true, data: { id: 7, badgeId: 'sample' } });
  });

  it('should return error when service throws', async () => {
    mockService.create.mockRejectedValue(new Error('boom'));
    const tool = new CreateBadgeAwardTool(mockService as any);

    const result = await tool.execute({}, '1');

    expect(result.success).toBe(false);
    expect(result.error).toBe('boom');
  });
});
