import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface HealthStatus {
  name: string;
  status: string;
  version: string;
  features: {
    googleAuth: boolean;
    recaptcha: boolean;
  };
}

@Injectable()
export class AppService {
  constructor(private readonly config: ConfigService) {}

  getHealth(): HealthStatus {
    return {
      name: 'ahanesk-backend',
      status: 'running',
      version: '1.0.0',
      features: {
        googleAuth: !!this.config.get<string>('app.google.clientId'),
        recaptcha:  !!this.config.get<string>('app.recaptcha.secretKey'),
      },
    };
  }
}
