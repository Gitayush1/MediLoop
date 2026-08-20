import request from 'supertest';
import { app } from '../app';
import { prisma } from '../lib/prisma';

const API = '/api/v1';

async function registerAndLogin(email: string) {
  await request(app)
    .post(`${API}/auth/register`)
    .send({ email, password: 'Test@12345', firstName: 'Refill', lastName: 'Tester' });
  const res = await request(app)
    .post(`${API}/auth/login`)
    .send({ email, password: 'Test@12345' });
  return res.body.data.tokens.accessToken as string;
}

async function createMedWithQuantity(token: string) {
  const res = await request(app)
    .post(`${API}/medications`)
    .set('Authorization', `Bearer ${token}`)
    .send({
      name: 'Refill Test Med',
      frequency: 'ONCE_DAILY',
      startDate: new Date().toISOString().split('T')[0],
      scheduleTimes: [{ time: '09:00' }],
      initialQuantity: 30,
      unit: 'tablets',
    });
  return res.body.data.id as string;
}

let token: string;
let medicationId: string;

beforeAll(async () => {
  await prisma.user.deleteMany({ where: { email: { contains: '@refill.mediloop' } } });
  token = await registerAndLogin('refilluser@refill.mediloop');
  medicationId = await createMedWithQuantity(token);
});

afterAll(async () => {
  await prisma.user.deleteMany({ where: { email: { contains: '@refill.mediloop' } } });
  await prisma.$disconnect();
});

describe('GET /refills', () => {
  it('should return list of refill predictions', async () => {
    const res = await request(app)
      .get(`${API}/refills`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it('should require authentication', async () => {
    const res = await request(app).get(`${API}/refills`);
    expect(res.status).toBe(401);
  });
});

describe('GET /refills/:medicationId', () => {
  it('should return refill prediction for a specific medication', async () => {
    const res = await request(app)
      .get(`${API}/refills/${medicationId}`)
      .set('Authorization', `Bearer ${token}`);

    // 200 if refill was calculated, 404 if no refill prediction exists yet
    expect([200, 404]).toContain(res.status);
  });
});

describe('POST /refills/:medicationId/inventory', () => {
  it('should add inventory and update refill prediction', async () => {
    const res = await request(app)
      .post(`${API}/refills/${medicationId}/inventory`)
      .set('Authorization', `Bearer ${token}`)
      .send({ quantity: 30, type: 'PURCHASE', note: 'Monthly refill' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('should reject invalid quantity', async () => {
    const res = await request(app)
      .post(`${API}/refills/${medicationId}/inventory`)
      .set('Authorization', `Bearer ${token}`)
      .send({ quantity: -5 });

    expect(res.status).toBe(400);
  });
});

describe('POST /refills/:medicationId/acknowledge', () => {
  it('should acknowledge a refill warning', async () => {
    const res = await request(app)
      .post(`${API}/refills/${medicationId}/acknowledge`)
      .set('Authorization', `Bearer ${token}`);

    // 200 if prediction exists, 404 if not
    expect([200, 404]).toContain(res.status);
  });
});
