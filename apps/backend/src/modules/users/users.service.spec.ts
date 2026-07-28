import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { UsersRepository } from './users.repository';
import { AuthRepository } from '../auth/auth.repository';
import { StorageService } from '../../infrastructure/storage/storage.service';
import { NotFoundException, ConflictException, BadRequestException, UnauthorizedException } from '@nestjs/common';
import * as argon2 from 'argon2';

// Mock argon2
jest.mock('argon2', () => ({
  hash: jest.fn().mockResolvedValue('hashed_password'),
  verify: jest.fn(),
}));

describe('UsersService', () => {
  let service: UsersService;

  const mockUsersRepo = {
    findAll: jest.fn(),
    findById: jest.fn(),
    findByEmail: jest.fn(),
    createUser: jest.fn(),
    updateUser: jest.fn(),
    deleteById: jest.fn(),
    findActiveSessions: jest.fn(),
    revokeSession: jest.fn(),
    revokeAllSessions: jest.fn(),
    findActivityByUser: jest.fn(),
  };

  const mockAuthRepo = {
    findUserById: jest.fn(),
    updateUser: jest.fn(),
  };

  const mockStorage = {
    upload: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: UsersRepository, useValue: mockUsersRepo },
        { provide: AuthRepository, useValue: mockAuthRepo },
        { provide: StorageService, useValue: mockStorage },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findById', () => {
    it('should throw NotFoundException if user is not found', async () => {
      mockUsersRepo.findById.mockResolvedValue(null);
      await expect(service.findById('123')).rejects.toThrow(NotFoundException);
    });

    it('should return user if found', async () => {
      const user = { id: '123', email: 'test@example.com' };
      mockUsersRepo.findById.mockResolvedValue(user);
      const result = await service.findById('123');
      expect(result).toEqual(user);
    });
  });

  describe('create', () => {
    it('should throw ConflictException if email exists', async () => {
      mockUsersRepo.findByEmail.mockResolvedValue({ id: '123' });
      await expect(service.create({ email: 'test@example.com', name: 'Test', password: 'pw' })).rejects.toThrow(ConflictException);
    });

    it('should hash password and create user', async () => {
      mockUsersRepo.findByEmail.mockResolvedValue(null);
      mockUsersRepo.createUser.mockResolvedValue({ id: '123', email: 'test@example.com' });
      const result = await service.create({ email: 'test@example.com', name: 'Test', password: 'pw' });
      expect(result).toEqual({ id: '123', email: 'test@example.com' });
      expect(argon2.hash).toHaveBeenCalledWith('pw');
    });
  });

  describe('changePassword', () => {
    it('should throw BadRequestException if user has no password', async () => {
      mockAuthRepo.findUserById.mockResolvedValue({ id: '123', password: null });
      await expect(service.changePassword('123', { currentPassword: 'old', newPassword: 'new' })).rejects.toThrow(BadRequestException);
    });
  });
});
