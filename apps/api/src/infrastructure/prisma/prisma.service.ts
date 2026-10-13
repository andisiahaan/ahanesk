import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';

function parseDbUrl(): URL {
  const raw = process.env.DATABASE_URL;
  if (!raw) throw new Error('[PrismaService] DATABASE_URL is not defined in environment');
  return new URL(raw);
}

function buildAdapter(url: URL): PrismaMariaDb {
  return new PrismaMariaDb({
    host: url.hostname,
    port: parseInt(url.port || '3306', 10),
    user: url.username,
    password: url.password,
    database: url.pathname.slice(1),
    allowPublicKeyRetrieval: true,
  });
}

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor() {
    super({ adapter: buildAdapter(parseDbUrl()) } as ConstructorParameters<typeof PrismaClient>[0]);
  }

  async onModuleInit(): Promise<void> {
    await this.$connect();
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
  }
}

