import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import type { Server } from 'http';
import { AppModule } from '../../src/app.module.js';
import { HttpExceptionFilter } from '../../src/common/filters/http-exception.filter.js';

export type ProcessHttp = {
  app: INestApplication;
  server: Server;
  token: string;
  close: () => Promise<void>;
};

export async function createProcessApp(): Promise<{
  app: INestApplication;
  server: Server;
  close: () => Promise<void>;
}> {
  const moduleRef = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();

  const app = moduleRef.createNestApplication();
  app.setGlobalPrefix('api/v1');
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      transformOptions: { enableImplicitConversion: true },
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );
  app.useGlobalFilters(new HttpExceptionFilter());
  await app.init();

  return {
    app,
    server: app.getHttpServer() as Server,
    close: async () => {
      await app.close();
    },
  };
}

export async function loginRootAdmin(server: Server): Promise<string> {
  const email = (
    process.env.ROOT_ADMIN_EMAIL || 'mhkhizilthurainzaw@gmail.com'
  )
    .trim()
    .toLowerCase();
  const password = process.env.ROOT_ADMIN_PASSWORD || 'root123';

  const res = await request(server)
    .post('/api/v1/admin/dashboard/auth/login')
    .send({ email, password });

  if (res.status !== 200 || !res.body?.data?.tokens?.accessToken) {
    throw new Error(
      `Root login failed (${res.status}): ${JSON.stringify(res.body)}`,
    );
  }
  return res.body.data.tokens.accessToken as string;
}

export function authHeaders(token: string): { Authorization: string } {
  return { Authorization: `Bearer ${token}` };
}

export async function apiGet<T>(
  server: Server,
  token: string,
  path: string,
): Promise<{ status: number; body: { success: boolean; data?: T; message?: string } }> {
  const res = await request(server)
    .get(path)
    .set(authHeaders(token));
  return { status: res.status, body: res.body };
}

export async function apiPost<T>(
  server: Server,
  token: string,
  path: string,
  payload: unknown,
): Promise<{ status: number; body: { success: boolean; data?: T; message?: string; error?: string } }> {
  const res = await request(server)
    .post(path)
    .set(authHeaders(token))
    .send(payload);
  return { status: res.status, body: res.body };
}

export async function apiPatch<T>(
  server: Server,
  token: string,
  path: string,
  payload: unknown,
): Promise<{ status: number; body: { success: boolean; data?: T; message?: string } }> {
  const res = await request(server)
    .patch(path)
    .set(authHeaders(token))
    .send(payload);
  return { status: res.status, body: res.body };
}

export async function apiDelete<T = unknown>(
  server: Server,
  token: string,
  path: string,
): Promise<{ status: number; body: { success: boolean; data?: T; message?: string } }> {
  const res = await request(server)
    .delete(path)
    .set(authHeaders(token));
  return { status: res.status, body: res.body };
}
