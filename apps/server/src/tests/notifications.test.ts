import request from 'supertest';
import { app } from '../app';
import { prisma } from '../lib/prisma';

const API = '/api/v1';

async function registerAndLogin(email: string) {
  await request(app)
    .post(`${API}/auth/register`)
    .send({ email, password: 'Test@12345', firstName: 'Notif', lastName: 'Tester' });
  const res = await request(app)
    .post(`${API}/auth/login`)
    .send({ email, password: 'Test@12345' });
  return res.body.data.tokens.accessToken as string;
}

let token: string;

beforeAll(async () => {
  await prisma.user.deleteMany({ where: { email: { contains: '@notif.mediloop' } } });
  token = await registerAndLogin('notifuser@notif.mediloop');
});

afterAll(async () => {
  await prisma.user.deleteMany({ where: { email: { contains: '@notif.mediloop' } } });
  await prisma.$disconnect();
});

describe('GET /notifications', () => {
  it('should return empty notifications list initially', async () => {
    const res = await request(app)
      .get(`${API}/notifications`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.meta.unreadCount).toBe(0);
  });

  it('should require authentication', async () => {
    const res = await request(app).get(`${API}/notifications`);
    expect(res.status).toBe(401);
  });
});

describe('GET /notifications/preferences', () => {
  it('should return default notification preferences', async () => {
    const res = await request(app)
      .get(`${API}/notifications/preferences`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.data.doseReminders).toBe(true);
    expect(res.body.data.missedDoseAlerts).toBe(true);
    expect(res.body.data.refillAlerts).toBe(true);
    expect(res.body.data.caregiverAlerts).toBe(true);
    expect(res.body.data.reminderMinutesBefore).toBe(15);
  });
});

describe('PATCH /notifications/preferences', () => {
  it('should update notification preferences', async () => {
    const res = await request(app)
      .patch(`${API}/notifications/preferences`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        doseReminders: false,
        reminderMinutesBefore: 30,
        quietHoursStart: '22:00',
        quietHoursEnd: '07:00',
      });

    expect(res.status).toBe(200);
    expect(res.body.data.doseReminders).toBe(false);
    expect(res.body.data.reminderMinutesBefore).toBe(30);
    expect(res.body.data.quietHoursStart).toBe('22:00');
  });
});

describe('POST /notifications/devices', () => {
  it('should register a device push token', async () => {
    const res = await request(app)
      .post(`${API}/notifications/devices`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        pushToken: 'ExponentPushToken[test-token-12345]',
        platform: 'ANDROID',
        deviceId: 'test-device-id-001',
      });

    expect(res.status).toBe(201);
    expect(res.body.data).toHaveProperty('id');
    expect(res.body.data.isActive).toBe(true);
  });

  it('should upsert on duplicate deviceId', async () => {
    await request(app)
      .post(`${API}/notifications/devices`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        pushToken: 'ExponentPushToken[updated-token-999]',
        platform: 'ANDROID',
        deviceId: 'test-device-id-001',
      });

    const res = await request(app)
      .post(`${API}/notifications/devices`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        pushToken: 'ExponentPushToken[updated-token-999]',
        platform: 'ANDROID',
        deviceId: 'test-device-id-001',
      });

    expect(res.status).toBe(201);
  });
});

describe('PATCH /notifications/read-all', () => {
  it('should mark all notifications as read', async () => {
    const res = await request(app)
      .patch(`${API}/notifications/read-all`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
  });
});
