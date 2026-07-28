import { Test, TestingModule } from '@nestjs/testing';
import { PagesService } from './pages.service';
import { PagesRepository } from './pages.repository';
import { NotFoundException } from '@nestjs/common';

describe('PagesService', () => {
  let service: PagesService;

  const mockRepo = {
    findAll: jest.fn(),
    findBySlug: jest.fn(),
    findById: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    deleteById: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PagesService,
        { provide: PagesRepository, useValue: mockRepo },
      ],
    }).compile();

    service = module.get<PagesService>(PagesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findPublishedBySlug', () => {
    it('should throw NotFoundException if not found', async () => {
      mockRepo.findBySlug.mockResolvedValue(null);
      await expect(service.findPublishedBySlug('test')).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException if not published', async () => {
      mockRepo.findBySlug.mockResolvedValue({ is_published: false });
      await expect(service.findPublishedBySlug('test')).rejects.toThrow(NotFoundException);
    });
  });
});
