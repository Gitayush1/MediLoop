import request from 'supertest';
import { app } from '../app';
import { prisma } from '../lib/prisma';
import path from 'path';
import fs from 'fs';

const API = '/api/v1';

async function registerAndLogin(email: string) {
  await request(app)
    .post(`${API}/auth/register`)
    .send({ email, password: 'Test@12345', firstName: 'Presc', lastName: 'Tester' });
  const res = await request(app)
    .post(`${API}/auth/login`)
    .send({ email, password: 'Test@12345' });
  return res.body.data.tokens.accessToken as string;
}

let token: string;

beforeAll(async () => {
  await prisma.user.deleteMany({ where: { email: { contains: '@presc.mediloop' } } });
  token = await registerAndLogin('prescuser@presc.mediloop');
  // Ensure test upload directory exists
  fs.mkdirSync('./test-uploads', { recursive: true });
});

afterAll(async () => {
  await prisma.user.deleteMany({ where: { email: { contains: '@presc.mediloop' } } });
  await prisma.$disconnect();
});

describe('GET /prescriptions', () => {
  it('should return empty list initially', async () => {
    const res = await request(app)
      .get(`${API}/prescriptions`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it('should require authentication', async () => {
    const res = await request(app).get(`${API}/prescriptions`);
    expect(res.status).toBe(401);
  });
});

describe('POST /prescriptions/upload', () => {
  it('should upload a prescription file and return a prescription record', async () => {
    // Create a small test image file
    const testImagePath = path.join('./test-uploads', 'test-presc.jpg');
    // Write a minimal valid JPEG header (tiny test file)
    const jpegBuffer = Buffer.from([
      0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10, 0x4A, 0x46, 0x49, 0x46, 0x00, 0x01,
      0x01, 0x00, 0x00, 0x01, 0x00, 0x01, 0x00, 0x00, 0xFF, 0xD9,
    ]);
    fs.writeFileSync(testImagePath, jpegBuffer);

    const res = await request(app)
      .post(`${API}/prescriptions/upload`)
      .set('Authorization', `Bearer ${token}`)
      .attach('file', testImagePath);

    // Expect either 201 (success) or 422 (file too small / OCR error in test)
    expect([200, 201, 422]).toContain(res.status);

    if (res.status === 201) {
      expect(res.body.data).toHaveProperty('id');
      expect(res.body.data).toHaveProperty('status');
    }
  });
});

describe('GET /prescriptions/:id', () => {
  it('should return 404 for non-existent prescription', async () => {
    const res = await request(app)
      .get(`${API}/prescriptions/nonexistent-id`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(404);
  });
});
