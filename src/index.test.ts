import { describe, it, expect } from 'vitest';
import { app } from './index.js';

describe('App Smoke Test', () => {
  it('should return health check ok', async () => {
    const res = await app.request('/health');
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.status).toBe('ok');
    expect(body.timestamp).toBeDefined();
  });
});
