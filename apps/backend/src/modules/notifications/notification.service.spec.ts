import { Test, TestingModule } from '@nestjs/testing';
import { NotificationService } from './notification.service';
import { NotificationRepository } from './notification.repository';
import { ConfigService } from '@nestjs/config';

// Mock getQueueToken
const getQueueToken = (name: string) => `BullQueue_${name}`;

describe('NotificationService', () => {
  let service: NotificationService;

  const mockRepo = {
    create: jest.fn(),
    findUserForNotification: jest.fn(),
    getAllAdminUsers: jest.fn(),
    findForUser: jest.fn(),
    getUnreadCount: jest.fn(),
    markRead: jest.fn(),
    markAllRead: jest.fn(),
    findAllAdmin: jest.fn(),
    getUserPreferences: jest.fn(),
    saveUserPreferences: jest.fn(),
    upsertPushSubscription: jest.fn(),
    deletePushSubscription: jest.fn(),
    getPushSubscriptions: jest.fn(),
    deletePushSubscriptionById: jest.fn(),
  };

  const mockQueue = { add: jest.fn() };
  const mockConfig = { get: jest.fn() };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationService,
        { provide: NotificationRepository, useValue: mockRepo },
        { provide: ConfigService, useValue: mockConfig },
        { provide: getQueueToken('notification-email'), useValue: mockQueue },
        { provide: getQueueToken('notification-push'), useValue: mockQueue },
      ],
    }).compile();

    service = module.get<NotificationService>(NotificationService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getPreferences', () => {
    it('should return default preferences if none exist', async () => {
      mockRepo.getUserPreferences.mockResolvedValue({ types: null, channels: null });
      const result = await service.getPreferences('1');
      expect(result).toEqual({ types: {}, channels: {} });
    });
  });
});
