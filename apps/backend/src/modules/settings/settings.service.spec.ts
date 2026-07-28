import { Test, TestingModule } from '@nestjs/testing';
import { SettingsService } from './settings.service';
import { SettingsRepository } from './settings.repository';
import { CacheService } from '../../infrastructure/cache/cache.service';
import { NotFoundException } from '@nestjs/common';

describe('SettingsService', () => {
  let service: SettingsService;

  const mockRepo = {
    findByKey: jest.fn(),
    upsert: jest.fn(),
  };

  const mockCache = {
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SettingsService,
        { provide: SettingsRepository, useValue: mockRepo },
        { provide: CacheService, useValue: mockCache },
      ],
    }).compile();

    service = module.get<SettingsService>(SettingsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getByKey', () => {
    it('should return from cache if exists', async () => {
      mockCache.get.mockResolvedValue({ key: 'test', settings: {} });
      const result = await service.getByKey('test');
      expect(result).toEqual({ key: 'test', settings: {} });
      expect(mockRepo.findByKey).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException if not in cache or db', async () => {
      mockCache.get.mockResolvedValue(null);
      mockRepo.findByKey.mockResolvedValue(null);
      await expect(service.getByKey('test')).rejects.toThrow(NotFoundException);
    });
  });
});
