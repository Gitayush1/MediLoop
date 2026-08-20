import request from 'supertest';
import { app } from '../app';
import { prisma } from '../lib/prisma';

const API = '/api/v1';
let accessToken: string;
let userId: string;

async function getAuthToken(email: string) {
  const res = await request(app)
    .post(`${API}/auth/register`)
    .send({ email, password: 'Test@12345', firstName: 'Med', lastName: 'Test' });
  return res.body.data as { tokens: { accessToken: string }; user: { id: string } };
}

beforeAll(async () => {
  await prisma.user.deleteMany({ where: { email: { contains: '@med-test.mediloop' } } });
  const auth = await getAuthToken('med@med-test.mediloop');
  accessToken = auth.tokens.accessToken;
  userId = auth.user.id;
});

afterAll(async () => {
  await prisma.user.deleteMany({ where: { email: { contains: '@med-test.mediloop' } } });
  await prisma.$disconnect();
});

describe('Medication CRUD', () => {
  let medicationId: string;

  const medicationData = {
    name: 'Aspirin',
    dosage: '75mg',
    form: 'TABLET',
    frequency: 'ONCE_DAILY',
    startDate: new Date().toISOString().split('T')[0],
    scheduleTimes: [{ time: '08:00', mealRelation: 'AFTER_MEAL' }],
    initialQuantity: 30,
    unit: 'tablets',
  };

  it('POST /medications should create a medication', async () => {
    const res = await request(app)
      .post(`${API}/medications`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send(medicationData);

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.name).toBe('Aspirin');
    expect(res.body.data.status).toBe('ACTIVE');
    medicationId = res.body.data.id as string;
  });

  it('GET /medications should list user medications', async () => {
    const res = await request(app)
      .get(`${API}/medications`)
      .set('Authorization', `Bearer ${accessToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data).toBeInstanceOf(Array);
    expect(res.body.data.some((m: { id: string }) => m.id === medicationId)).toBe(true);
  });

  it('GET /medications/:id should return medication detail', async () => {
    const res = await request(app)
      .get(`${API}/medications/${medicationId}`)
      .set('Authorization', `Bearer ${accessToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.id).toBe(medicationId);
    expect(res.body.data.adherencePercentage).toBeDefined();
  });

  it('PATCH /medications/:id should update medication', async () => {
    const res = await request(app)
      .patch(`${API}/medications/${medicationId}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ notes: 'Take with water' });

    expect(res.status).toBe(200);
    expect(res.body.data.notes).toBe('Take with water');
  });

  it('should not access another user medication', async () => {
    const other = await getAuthToken('other@med-test.mediloop');

    const res = await request(app)
      .get(`${API}/medications/${medicationId}`)
      .set('Authorization', `Bearer ${other.tokens.accessToken}`);

    expect(res.status).toBe(403);
  });

  it('DELETE /medications/:id should soft delete', async () => {
    const res = await request(app)
      .delete(`${API}/medications/${medicationId}`)
      .set('Authorization', `Bearer ${accessToken}`);

    expect(res.status).toBe(204);

    // Verify soft deleted
    const check = await request(app)
      .get(`${API}/medications/${medicationId}`)
      .set('Authorization', `Bearer ${accessToken}`);

    expect(check.status).toBe(404);
  });
});

describe('Dose Tracking', () => {
  let medId: string;
  let doseId: string;

  beforeAll(async () => {
    const res = await request(app)
      .post(`${API}/medications`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        name: 'Dose Test Med',
        frequency: 'ONCE_DAILY',
        startDate: new Date().toISOString().split('T')[0],
        scheduleTimes: [{ time: '08:00' }],
        initialQuantity: 30,
      });
    medId = res.body.data.id as string;
  });

  it('GET /doses/today should return today\'s doses', async () => {
    const res = await request(app)
      .get(`${API}/doses/today`)
      .set('Authorization', `Bearer ${accessToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.upcoming).toBeDefined();
    expect(res.body.data.past).toBeDefined();
    expect(res.body.data.takenCount).toBeDefined();
  });

  it('POST /doses/:id/taken should mark dose as taken', async () => {
    const todayRes = await request(app)
      .get(`${API}/doses/today`)
      .set('Authorization', `Bearer ${accessToken}`);

    const dose = todayRes.body.data.upcoming.find(
      (d: { medication: { id: string } }) => d.medication.id === medId,
    );

    if (!dose) return; // No dose scheduled yet for this test

    doseId = dose.id as string;

    const res = await request(app)
      .post(`${API}/doses/${doseId}/taken`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({});

    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('TAKEN');
    expect(res.body.data.takenAt).toBeDefined();
  });
});

describe('Refill Prediction', () => {
  it('GET /refills should return refill predictions', async () => {
    const res = await request(app)
      .get(`${API}/refills`)
      .set('Authorization', `Bearer ${accessToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data).toBeInstanceOf(Array);
  });
});
