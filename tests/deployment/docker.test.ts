import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { createApp } from '../../src/index.js';
import { createApiRouter } from '../../src/api/router.js';

describe('Docker & Deployment Configuration for RPi4 ARM64 (#48)', () => {
  const rootDir = resolve(process.cwd());

  it('Dockerfile exists and contains multistage node:22-alpine specifications', () => {
    const dockerfilePath = resolve(rootDir, 'Dockerfile');
    expect(existsSync(dockerfilePath)).toBe(true);

    const dockerfile = readFileSync(dockerfilePath, 'utf-8');

    // Stage 1: Builder
    expect(dockerfile).toMatch(/FROM node:22-alpine AS builder/i);
    expect(dockerfile).toContain('corepack enable');
    expect(dockerfile).toMatch(/pnpm build/);

    // Stage 2: Production
    expect(dockerfile).toMatch(/FROM node:22-alpine AS production/i);
    expect(dockerfile).toMatch(/NODE_OPTIONS=.*--max-old-space-size=384/);
    expect(dockerfile).toContain('EXPOSE 3000');
    expect(dockerfile).toContain('CMD ["node", "dist/index.js"]');
  });

  it('docker-compose.yml exists and enforces 480M memory limit, healthcheck, and persistence', () => {
    const composePath = resolve(rootDir, 'docker-compose.yml');
    expect(existsSync(composePath)).toBe(true);

    const composeContent = readFileSync(composePath, 'utf-8');

    // Check service name and port mapping
    expect(composeContent).toContain('wuxiagraph');
    expect(composeContent).toMatch(/["']3000:3000["']/);

    // Memory limit
    expect(composeContent).toMatch(/memory:\s*480M/i);

    // Healthcheck
    expect(composeContent).toContain('/health');
    expect(composeContent).toContain('wget');

    // Volume persistence
    expect(composeContent).toContain('volumes:');
  });

  it('GET /health returns 200 OK with status and timestamp from createApp()', async () => {
    const app = createApp();
    const res = await app.request('/health', { method: 'GET' });

    expect(res.status).toBe(200);
    const body = (await res.json()) as { status: string; timestamp: string };
    expect(body.status).toBe('ok');
    expect(typeof body.timestamp).toBe('string');
    expect(new Date(body.timestamp).getTime()).not.toBeNaN();
  });

  it('GET /health returns 200 OK when mounted inside createApiRouter', async () => {
    const mockContextService = {} as any;
    const mockDreamingService = {} as any;
    const mockGovRepo = {} as any;

    const router = createApiRouter({
      contextService: mockContextService,
      dreamingService: mockDreamingService,
      govRepo: mockGovRepo,
    });

    const res = await router.request('/health', { method: 'GET' });
    expect(res.status).toBe(200);
    const body = (await res.json()) as { status: string; timestamp: string };
    expect(body.status).toBe('ok');
    expect(typeof body.timestamp).toBe('string');
  });

  it('deploy-rpi4.md documentation exists and covers memory limits, docker compose and WAL', () => {
    const docPath = resolve(rootDir, 'docs/deploy-rpi4.md');
    expect(existsSync(docPath)).toBe(true);

    const docContent = readFileSync(docPath, 'utf-8');
    expect(docContent).toContain('480MB');
    expect(docContent).toContain('--max-old-space-size=384');
    expect(docContent).toContain('docker-compose.yml');
    expect(docContent).toContain('WAL');
    expect(docContent).toContain('/health');
  });
});
