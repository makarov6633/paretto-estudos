import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { sql } from 'drizzle-orm';

/**
 * Health Check Endpoint
 * Returns server status and basic diagnostics
 *
 * Usage: GET /api/health
 * Returns: { status, timestamp, database, version }
 */
export async function GET() {
  const timestamp = new Date().toISOString();

  try {
    // Check database connectivity
    const startTime = Date.now();
    await db.execute(sql`SELECT 1`);
    const dbLatency = Date.now() - startTime;

    return NextResponse.json({
      status: 'healthy',
      timestamp,
      database: {
        connected: true,
        latency: `${dbLatency}ms`
      },
      version: process.env.npm_package_version || '0.1.0',
      environment: process.env.NODE_ENV || 'development'
    });
  } catch (error) {
    console.error('Health check failed:', error);

    return NextResponse.json(
      {
        status: 'unhealthy',
        timestamp,
        database: {
          connected: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        },
        version: process.env.npm_package_version || '0.1.0',
        environment: process.env.NODE_ENV || 'development'
      },
      { status: 503 }
    );
  }
}
