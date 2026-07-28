import { Test, TestingModule } from '@nestjs/testing';
import { BlogService } from './blog.service';
import { BlogRepository } from './blog.repository';
import { StorageService } from '../../infrastructure/storage/storage.service';
import { NotFoundException } from '@nestjs/common';

describe('BlogService', () => {
  let service: BlogService;

  const mockRepo = {
    listPosts: jest.fn(),
    findBySlug: jest.fn(),
    listCategories: jest.fn(),
    listTags: jest.fn(),
    findById: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    createCategory: jest.fn(),
    updateCategory: jest.fn(),
    deleteCategory: jest.fn(),
    createTag: jest.fn(),
    updateTag: jest.fn(),
    deleteTag: jest.fn(),
  };

  const mockStorage = {
    upload: jest.fn(),
    delete: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BlogService,
        { provide: BlogRepository, useValue: mockRepo },
        { provide: StorageService, useValue: mockStorage },
      ],
    }).compile();

    service = module.get<BlogService>(BlogService);
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
