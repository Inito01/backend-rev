import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { initializeDatabase, sequelize } from '../../../src/config/database.js';

describe('initializeDatabase', () => {
  beforeEach(() => {
    jest.restoreAllMocks();
  });

  it('inicializa correctamente', async () => {
    jest.spyOn(sequelize, 'authenticate').mockResolvedValue();
    jest.spyOn(sequelize, 'sync').mockResolvedValue();
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    await initializeDatabase();
    expect(sequelize.authenticate).toHaveBeenCalled();
    expect(sequelize.sync).toHaveBeenCalled();
    consoleSpy.mockRestore();
  });

  it('lanza error si authenticate falla', async () => {
    jest
      .spyOn(sequelize, 'authenticate')
      .mockRejectedValue(new Error('auth fail'));
    await expect(initializeDatabase()).rejects.toThrow('auth fail');
  });
});
