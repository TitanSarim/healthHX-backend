import { Injectable } from '@nestjs/common';
import { PrismaService } from './prisma/prisma.service';

@Injectable()
export class AppService {
  constructor(private readonly prisma: PrismaService) {}

  getHello(): string {
    return 'Hello World!';
  }

  async getHealth() {
    const startTime = Date.now();
    let dbStatus = 'disconnected';
    let dbError = null;

    try {
      // Test database connection with a simple query
      await this.prisma.$queryRaw`SELECT 1`;
      dbStatus = 'connected';
    } catch (error) {
      dbStatus = 'error';
      dbError = error.message;
      console.error('Database health check failed:', error);
    }

    const responseTime = Date.now() - startTime;

    return {
      status: dbStatus === 'connected' ? 'ok' : 'error',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      database: {
        status: dbStatus,
        error: dbError,
        responseTime: `${responseTime}ms`,
      },
      environment: process.env.NODE_ENV || 'development',
      version: '1.0.0',
    };
  }
}
