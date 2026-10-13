import { Test, TestingModule } from '@nestjs/testing';
import { PatService } from './pat.service';
import { PatRepository } from './pat.repository';
import { NotFoundException } from '@nestjs/common';

describe('PatService', () => {
  let service: PatService;

  const mockRepo = {
    findAllByUser: jest.fn(),
    findAll: jest.fn(),
    create: jest.fn(),
    revoke: jest.fn(),
    findByHash: jest.fn(),
    touchLastUsed: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PatService,
        { provide: PatRepository, useValue: mockRepo },
      ],
    }).compile();

    service = module.get<PatService>(PatService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('revoke', () => {
    it('should throw NotFoundException if token does not belong to user and user is not admin', async () => {
      mockRepo.findAllByUser.mockResolvedValue([]);
      await expect(service.revoke('1', 'user')).rejects.toThrow(NotFoundException);
    });

    it('should allow admin to revoke any token', async () => {
      mockRepo.findAllByUser.mockResolvedValue([]);
      await service.revoke('1', 'admin', true);
      expect(mockRepo.revoke).toHaveBeenCalledWith('1');
    });
  });
});
