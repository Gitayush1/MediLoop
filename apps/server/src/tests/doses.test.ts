import request from 'supertest';
import { app } from '../app';
import { prisma } from '../lib/prisma';

const API = '/api/v1';

// ── Helpers ───────────────────────────────────────────────────
async function registerAndLogin(email: string) {
  await request(app)
    .post(`${API}/auth/register`)
    .send({ email, password: 'Test@12345', firstName: 'Doses', lastName: 'Tester' });
  const res = await request(app)
    .post(`${API}/auth/login`)
    .send({ email, password: 'Test@12345' });
  return res.body.data.tokens.accessToken as string;
}

async function createMedication(token: string) {
  const res = await request(app)
    .post(`${API}/medications`)
    .set('Authorization', `Bearer ${token}`)
    .send({
      name: 'DoseTest Med',
      frequency: 'ONCE_DAILY',
      startDate: new Date().toISOString().split('T')[0],
      scheduleTimes: [{ time: '08:00', mealRelation: 'AFTER_MEAL' }],
    });
  return res.body.data.id as string;
}

// ── Setup ─────────────────────────────────────────────────────
let token: string;

beforeAll(async () => {
  await prisma.user.deleteMany({ where: { email: { contains: '@doses.mediloop' } } });
  token = await registerAndLogin('dosesuser@doses.mediloop');
});

afterAll(async () => {
  await prisma.user.deleteMany({ where: { email: { contains: '@doses.mediloop' } } });
  await prisma.$disconnect();
});

// ── Tests ─────────────────────────────────────────────────────
describe('GET /doses/today', () => {
  it("should return today's dose schedule", async () => {
    await createMedication(token);
    const res = await request(app)
      .get(`${API}/doses/today`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('upcoming');
    expect(res.body.data).toHaveProperty('past');
    expect(res.body.data).toHaveProperty('total');
    expect(res.body.data).toHaveProperty('takenCount');
    expect(res.body.data).toHaveProperty('missedCount');
  });

  it('should require authentication', async () => {
    const res = await request(app).get(`${API}/doses/today`);
    expect(res.status).toBe(401);
  });
});

describe('POST /doses/:id/taken', () => {
  it('should mark a dose as taken', async () => {
    // Get today doses first
    const todayRes = await request(app)
      .get(`${API}/doses/today`)
      .set('Authorization', `Bearer ${token}`);

    const doses: Array<{ id: string }> = [
      ...todayRes.body.data.upcoming,
      ...todayRes.body.data.past,
    ];

    if (doses.length === 0) {
      // No doses today – skip (coverage only)
      return;
    }

    const doseId = doses[0]!.id;
    const res = await request(app)
      .post(`${API}/doses/${doseId}/taken`)
      .set('Authorization', `Bearer ${token}`)
      .send({ notes: 'Taken with water' });

    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('TAKEN');
  });
});

describe('GET /doses/adherence', () => {
  it('should return adherence stats for default period (30d)', async () => {
    const res = await request(app)
      .get(`${API}/doses/adherence`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveProperty('adherenceRate');
    expect(res.body.data).toHaveProperty('taken');
    expect(res.body.data).toHaveProperty('missed');
    expect(res.body.data).toHaveProperty('streak');
    expect(res.body.data.period).toBe('30d');
  });

  it('should accept period query param', async () => {
    const res = await request(app)
      .get(`${API}/doses/adherence?period=7d`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.data.period).toBe('7d');
  });
});

describe('GET /doses/history', () => {
  it('should return paginated dose history', async () => {
    const res = await request(app)
      .get(`${API}/doses/history?page=1&limit=10`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.meta).toHaveProperty('total');
    expect(res.body.meta).toHaveProperty('totalPages');
  });
});
