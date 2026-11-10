// SPDX-License-Identifier: Apache-2.0

import { QueryBadgeAwardsTool } from './query-badge_awards.tool';

describe('QueryBadgeAwardsTool', () => {
  const mockService = { findAll: jest.fn() };

  let tool: QueryBadgeAwardsTool;

  beforeEach(() => {
    jest.clearAllMocks();
    tool = new QueryBadgeAwardsTool(mockService as any);
  });

  it('should have correct name and description', () => {
    expect(tool.name).toBe('query_badge_awards');
    expect(tool.description.length).toBeGreaterThan(0);
  });

  it('should build a valid tool definition', () => {
    const def = tool.toToolDefinition();
    expect(def.type).toBe('function');
    expect(def.function.name).toBe('query_badge_awards');
    expect(def.function.parameters).toBeDefined();
  });

  it('should fetch own badge_awards scoped by userId and map fields', async () => {
    mockService.findAll.mockResolvedValue([{ id: 1, badgeId: 'sample' }]);

    const result = await tool.execute({}, '7');

    expect(mockService.findAll).toHaveBeenCalledWith(7);
    expect(result.success).toBe(true);
    expect((result.data as any[])[0]).toMatchObject({ id: 1, badgeId: 'sample' });
  });

  it('should return empty data when none found', async () => {
    mockService.findAll.mockResolvedValue([]);

    const result = await tool.execute({}, '7');

    expect(result.success).toBe(true);
    expect(result.data).toEqual([]);
  });

  it('should handle service errors gracefully', async () => {
    mockService.findAll.mockRejectedValue(new Error('db down'));

    const result = await tool.execute({}, '7');

    expect(result.success).toBe(false);
    expect(result.error).toBe('db down');
  });

  it('should declare no filter and ignore one if passed', async () => {
    const def = tool.toToolDefinition();
    expect(def.function.parameters).toEqual({ type: 'object', properties: {} });
    expect(tool.parameters).toEqual([]);

    mockService.findAll.mockResolvedValue([{ id: 1, badgeId: 'sample' }]);
    await tool.execute({ keyword: 'anything' }, '7');

    expect(mockService.findAll).toHaveBeenCalledWith(7);
  });
});
