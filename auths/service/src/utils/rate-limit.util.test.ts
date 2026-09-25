import express, { type RequestHandler } from 'express';
import type { AddressInfo } from 'node:net';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { credentialLimiter, sendingLimiter } from './rate-limit.util';

let baseUrl: string;
let close: () => void;

beforeAll(async () => {
  const app = express();
  app.set('trust proxy', 1);
  const respondWithRequestedStatus: RequestHandler = (req, res) => {
    res.status(Number(req.query.status ?? 200)).end();
  };
  app.post('/credential', credentialLimiter, respondWithRequestedStatus);
  app.post('/sending', sendingLimiter, respondWithRequestedStatus);

  const server = app.listen(0);
  await new Promise((resolve) => server.once('listening', resolve));
  baseUrl = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
  close = () => server.close();
});

afterAll(() => close());

// Each test uses its own client IP, sent the way Caddy forwards it.
function post(path: string, clientIp: string, status = 200): Promise<Response> {
  return fetch(`${baseUrl}${path}?status=${status}`, {
    method: 'POST',
    headers: { 'X-Forwarded-For': clientIp },
  });
}

describe('credentialLimiter', () => {
  it('blocks a client after 10 failed attempts', async () => {
    for (let attempt = 0; attempt < 10; attempt++) {
      expect((await post('/credential', '203.0.113.1', 401)).status).toBe(401);
    }

    const blocked = await post('/credential', '203.0.113.1', 401);
    expect(blocked.status).toBe(429);
    expect(await blocked.json()).toEqual({ error: 'Too many attempts. Please try again later.' });
  });

  it('does not count successful attempts', async () => {
    for (let attempt = 0; attempt < 20; attempt++) {
      expect((await post('/credential', '203.0.113.2')).status).toBe(200);
    }
  });

  it('counts each client separately', async () => {
    for (let attempt = 0; attempt < 11; attempt++) {
      await post('/credential', '203.0.113.3', 401);
    }

    expect((await post('/credential', '203.0.113.4', 401)).status).toBe(401);
  });
});

describe('sendingLimiter', () => {
  it('blocks a client after 10 requests, successful or not', async () => {
    for (let attempt = 0; attempt < 10; attempt++) {
      expect((await post('/sending', '203.0.113.5')).status).toBe(200);
    }

    expect((await post('/sending', '203.0.113.5')).status).toBe(429);
  });
});
