import process from 'node:process';
import { serve } from '@hono/node-server';
import { Hono } from 'hono';

export const app = new Hono();

app.get('/health', (c) => {
  return c.json({ status: 'ok', timestamp: new Date().toISOString() });
});

if (process.env.NODE_ENV !== 'test' && !process.env.VITEST) {
  const port = Number(process.env.PORT) || 3000;
  serve({
    fetch: app.fetch,
    port
  }, (info) => {
    console.log(`Server running at http://localhost:${info.port}`);
  });
}

export default app;
