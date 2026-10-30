import path from 'path';
import request from 'supertest';
import { createApp } from '../src/app';
import { openDb } from '../src/db';
import { migrate } from '../src/migrate';
import { seed } from '../src/seed';

async function makeApp() {
  const db = await openDb(null);
  migrate(db, path.join(__dirname, '..', 'migrations'));
  seed(db, '2026-11-02');
  return createApp(db);
}

describe('leave requests API', () => {
  it('lists employees', async () => {
    const res = await request(await makeApp()).get('/api/employees');
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(8);
  });

  it('returns a page of leave requests', async () => {
    const res = await request(await makeApp()).get('/api/leaves').query({ page: 1 });
    expect(res.status).toBe(200);
    expect(res.body.items).toHaveLength(10);
    expect(res.body.total).toBe(45);
    expect(res.body.totalPages).toBe(5);
  });

  it('creates a pending leave request', async () => {
    const res = await request(await makeApp())
      .post('/api/leaves')
      .send({ employeeId: 1, type: 'CASUAL', startDate: '2027-01-10', endDate: '2027-01-12', reason: 'Trip' });
    expect(res.status).toBe(201);
    expect(res.body.status).toBe('PENDING');
    expect(res.body.employeeName).toBe('Priya Nair');
  });

  it('refuses to approve twice (409)', async () => {
    const app = await makeApp();
    const created = await request(app)
      .post('/api/leaves')
      .send({ employeeId: 2, type: 'SICK', startDate: '2027-02-01', endDate: '2027-02-01' });
    expect((await request(app).post(`/api/leaves/${created.body.id}/approve`)).status).toBe(200);
    expect((await request(app).post(`/api/leaves/${created.body.id}/approve`)).status).toBe(409);
  });
});
