import { Test, TestingModule } from '@nestjs/testing';
import { HelpService } from './help.service';
import { HelpRepository } from './help.repository';
import { NotFoundException } from '@nestjs/common';

describe('HelpService', () => {
  let service: HelpService;

  const mockRepo = {
    findAllCategories: jest.fn(),
    findArticleBySlug: jest.fn(),
    findAllArticles: jest.fn(),
    voteHelpful: jest.fn(),
    findArticleById: jest.fn(),
    createCategory: jest.fn(),
    updateCategory: jest.fn(),
    deleteCategory: jest.fn(),
    createArticle: jest.fn(),
    updateArticle: jest.fn(),
    deleteArticle: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        HelpService,
        { provide: HelpRepository, useValue: mockRepo },
      ],
    }).compile();

    service = module.get<HelpService>(HelpService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getPublicArticleBySlug', () => {
    it('should throw NotFoundException if not found', async () => {
      mockRepo.findArticleBySlug.mockResolvedValue(null);
      await expect(service.getPublicArticleBySlug('test')).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException if not published', async () => {
      mockRepo.findArticleBySlug.mockResolvedValue({ is_published: false });
      await expect(service.getPublicArticleBySlug('test')).rejects.toThrow(NotFoundException);
    });
  });
});
