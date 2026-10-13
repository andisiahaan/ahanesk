import { Test, TestingModule } from '@nestjs/testing';
import { NewsService } from './news.service';
import { NewsRepository } from './news.repository';
import { NotFoundException } from '@nestjs/common';

describe('NewsService', () => {
  let service: NewsService;

  const mockRepo = {
    list: jest.fn(),
    findBySlug: jest.fn(),
    findById: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NewsService,
        { provide: NewsRepository, useValue: mockRepo },
      ],
    }).compile();

    service = module.get<NewsService>(NewsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getBySlug', () => {
    it('should throw NotFoundException if not found', async () => {
      mockRepo.findBySlug.mockResolvedValue(null);
      await expect(service.getBySlug('test')).rejects.toThrow(NotFoundException);
    });
  });
});
