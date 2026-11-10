// SPDX-License-Identifier: Apache-2.0

import { CreateAchievementTool } from './create-achievements.tool';

describe('CreateAchievementTool', () => {
  const mockService = { create: jest.fn() };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should have name and risk level + verified email', () => {
    const tool = new CreateAchievementTool(mockService as any);
    expect(tool.name).toBe('create_achievement');
    expect(tool.riskLevel).toBe('R2');
    expect(tool.permissions.requireVerifiedEmail).toBe(true);
  });

  it('should build a valid tool definition', () => {
    const tool = new CreateAchievementTool(mockService as any);
    const def = tool.toToolDefinition();
    expect(def.function.name).toBe('create_achievement');
    expect(def.function.parameters).toBeDefined();
  });

  it('should create and return id + first field', async () => {
    mockService.create.mockResolvedValue({ id: 7, totalPoints: 'sample' });
    const tool = new CreateAchievementTool(mockService as any);

    const result = await tool.execute({ totalPoints: 'sample' }, '1');

    expect(mockService.create).toHaveBeenCalledWith(expect.objectContaining({ totalPoints: 'sample' }), 1);
    expect(result).toEqual({ success: true, data: { id: 7, totalPoints: 'sample' } });
  });

  it('should return error when service throws', async () => {
    mockService.create.mockRejectedValue(new Error('boom'));
    const tool = new CreateAchievementTool(mockService as any);

    const result = await tool.execute({}, '1');

    expect(result.success).toBe(false);
    expect(result.error).toBe('boom');
  });
});
