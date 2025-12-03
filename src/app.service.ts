import { Injectable } from '@nestjs/common';
import { PrismaService } from './prisma/prisma.service';

export interface HealthStatus {
  status: 'ok' | 'error';
  service: string;
  timestamp: string;
  database: {
    status: 'connected' | 'disconnected' | 'error';
    message?: string;
  };
}

@Injectable()
export class AppService {
  constructor(private readonly prisma: PrismaService) {}

  async getHealth(): Promise<HealthStatus> {
    const health: HealthStatus = {
      status: 'ok',
      service: 'Micro-SaaS Backend',
      timestamp: new Date().toISOString(),
      database: {
        status: 'disconnected',
      },
    };

    try {
      await this.prisma.$queryRaw`SELECT 1`;
      health.database.status = 'connected';
    } catch (error) {
      health.status = 'error';
      health.database.status = 'error';
      health.database.message =
        error instanceof Error ? error.message : 'Unknown database error';
    }

    return health;
  }
}
