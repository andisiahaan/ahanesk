import { Test, TestingModule } from '@nestjs/testing';
import { TicketsService } from './tickets.service';
import { TicketsRepository } from './tickets.repository';
import { StorageService } from '../../infrastructure/storage/storage.service';
import { NotificationService } from '../notifications/notification.service';
import { NotFoundException, ForbiddenException } from '@nestjs/common';

describe('TicketsService', () => {
  let service: TicketsService;

  const mockRepo = {
    listAll: jest.fn(),
    listForUser: jest.fn(),
    findById: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    createReply: jest.fn(),
    delete: jest.fn(),
  };

  const mockStorage = { upload: jest.fn() };
  const mockNotifications = { send: jest.fn(), sendToAdmins: jest.fn() };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TicketsService,
        { provide: TicketsRepository, useValue: mockRepo },
        { provide: StorageService, useValue: mockStorage },
        { provide: NotificationService, useValue: mockNotifications },
      ],
    }).compile();

    service = module.get<TicketsService>(TicketsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getById', () => {
    it('should throw NotFoundException if not found', async () => {
      mockRepo.findById.mockResolvedValue(null);
      await expect(service.getById('1', 'user')).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if user does not own ticket and is not admin', async () => {
      mockRepo.findById.mockResolvedValue({ id: '1', user_id: 'other' });
      await expect(service.getById('1', 'user', false)).rejects.toThrow(ForbiddenException);
    });
  });
});
