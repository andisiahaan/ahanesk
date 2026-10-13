import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { AppService } from './app.service';

import { ConfigService } from '@nestjs/config';

describe('AppController', () => {
  let appController: AppController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [
        AppService,
        { provide: ConfigService, useValue: { get: jest.fn(() => false) } }
      ],
    }).compile();

    appController = app.get<AppController>(AppController);
  });

  describe('root', () => {
    it('should return health status object', () => {
      expect(appController.getHealth()).toEqual({
        name: 'ahanesk-backend',
        status: 'running',
        version: '1.0.0',
        features: {
          googleAuth: false,
          recaptcha: false,
        },
      });
    });
  });
});
