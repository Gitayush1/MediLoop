import request from 'supertest';
import { app } from '../app';
import { prisma } from '../lib/prisma';

const API = '/api/v1';

beforeAll(async () => {
  // Clean test data
  await prisma.user.deleteMany({ where: { email: { contains: '@test.mediloop' } } });
});

afterAll(async () => {
  await prisma.user.deleteMany({ where: { email: { contains: '@test.mediloop' } } });
  await prisma.$disconnect();
});

describe('POST /auth/register', () => {
  it('should register a new user successfully', async () => {
    const res = await request(app)
      .post(`${API}/auth/register`)
      .send({
        email: 'test1@test.mediloop',
        password: 'Test@12345',
        firstName: 'Test',
        lastName: 'User',
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user.email).toBe('test1@test.mediloop');
    expect(res.body.data.tokens.accessToken).toBeDefined();
    expect(res.body.data.tokens.refreshToken).toBeDefined();
    // Should NOT expose password hash
    expect(res.body.data.user.passwordHash).toBeUndefined();
  });

  it('should reject duplicate email', async () => {
    await request(app)
      .post(`${API}/auth/register`)
      .send({
        email: 'dup@test.mediloop',
        password: 'Test@12345',
        firstName: 'Dup',
      });

    const res = await request(app)
      .post(`${API}/auth/register`)
      .send({
        email: 'dup@test.mediloop',
        password: 'Test@12345',
        firstName: 'Dup',
      });

    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('USER_ALREADY_EXISTS');
  });

  it('should reject weak password', async () => {
    const res = await request(app)
      .post(`${API}/auth/register`)
      .send({
        email: 'weak@test.mediloop',
        password: 'password',
        firstName: 'Weak',
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('should reject invalid email', async () => {
    const res = await request(app)
      .post(`${API}/auth/register`)
      .send({
        email: 'not-an-email',
        password: 'Test@12345',
        firstName: 'Invalid',
      });

    expect(res.status).toBe(400);
  });
});

describe('POST /auth/login', () => {
  const email = 'login@test.mediloop';
  const password = 'Test@12345';

  beforeAll(async () => {
    await request(app)
      .post(`${API}/auth/register`)
      .send({ email, password, firstName: 'Login', lastName: 'Test' });
  });

  it('should login successfully with valid credentials', async () => {
    const res = await request(app)
      .post(`${API}/auth/login`)
      .send({ email, password });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.tokens.accessToken).toBeDefined();
  });

  it('should reject invalid password', async () => {
    const res = await request(app)
      .post(`${API}/auth/login`)
      .send({ email, password: 'WrongPass@1' });

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('INVALID_CREDENTIALS');
  });

  it('should reject non-existent user', async () => {
    const res = await request(app)
      .post(`${API}/auth/login`)
      .send({ email: 'nonexistent@test.mediloop', password: 'Test@12345' });

    expect(res.status).toBe(401);
  });
});

describe('POST /auth/refresh', () => {
  it('should return new token pair with valid refresh token', async () => {
    const registerRes = await request(app)
      .post(`${API}/auth/register`)
      .send({ email: 'refresh@test.mediloop', password: 'Test@12345', firstName: 'Refresh' });

    const { refreshToken } = registerRes.body.data.tokens as { refreshToken: string };

    const res = await request(app)
      .post(`${API}/auth/refresh`)
      .send({ refreshToken });

    expect(res.status).toBe(200);
    expect(res.body.data.accessToken).toBeDefined();
    expect(res.body.data.refreshToken).toBeDefined();
    // Should be different token (rotated)
    expect(res.body.data.refreshToken).not.toBe(refreshToken);
  });

  it('should reject invalid refresh token', async () => {
    const res = await request(app)
      .post(`${API}/auth/refresh`)
      .send({ refreshToken: 'totally.invalid.token' });

    expect(res.status).toBe(401);
  });
});

describe('GET /users/me', () => {
  let accessToken: string;

  beforeAll(async () => {
    const res = await request(app)
      .post(`${API}/auth/register`)
      .send({ email: 'profile@test.mediloop', password: 'Test@12345', firstName: 'Profile' });
    accessToken = res.body.data.tokens.accessToken as string;
  });

  it('should return user profile when authenticated', async () => {
    const res = await request(app)
      .get(`${API}/users/me`)
      .set('Authorization', `Bearer ${accessToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.email).toBe('profile@test.mediloop');
  });

  it('should return 401 without token', async () => {
    const res = await request(app).get(`${API}/users/me`);
    expect(res.status).toBe(401);
  });

  it('should return 401 with invalid token', async () => {
    const res = await request(app)
      .get(`${API}/users/me`)
      .set('Authorization', 'Bearer invalid.token.here');
    expect(res.status).toBe(401);
  });
});
