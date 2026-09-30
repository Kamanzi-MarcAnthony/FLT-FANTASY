import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { seedSuperAdmin } from '../src/db/index.js';
import { calculatePoints } from '../src/services/points.js';
import { generateMatchdays } from '../src/services/schedule.js';

const app = createApp();
const league = { name: 'Sat League', location: 'Kampala', startDate: '2026-10-01', endDate: '2026-10-31', recurring: true, matchday: 6,
  kickoffTime: '15:00', matchdayEndTime: '17:00', maxTransfers: 2, transferDeadlineHours: 24, timezone: 'Africa/Kampala', scoring: ['GOALS', 'ASSISTS'] };

describe('scoring', () => {
  it('ST, 2 goals + 1 assist = 14', () => expect(calculatePoints('ST', { goals: 2, assists: 1 }, ['GOALS', 'ASSISTS', 'CLEANSHEETS'])).toBe(14));
  it('GK clean sheet = 4; disabled options score 0', () => {
    expect(calculatePoints('GK', { cleanSheet: true }, ['CLEANSHEETS'])).toBe(4);
    expect(calculatePoints('DEF', { goals: 1 }, ['ASSISTS'])).toBe(0);
  });
});

describe('schedule', () => {
  it('weekly Saturdays in October, deadline 24h before kickoff (Kampala = UTC+3)', () => {
    const d = generateMatchdays({ startDate: '2026-10-01', endDate: '2026-10-31', recurring: true, weekday: 6, kickoff: '15:00', end: '17:00', tz: 'Africa/Kampala', deadlineHours: 24 });
    expect(d).toHaveLength(5);
    expect(d[0].starts_at).toBe('2026-10-03T12:00:00.000Z');
    expect(d[0].transfer_deadline_at).toBe('2026-10-02T12:00:00.000Z');
  });
});

describe('API flow', () => {
  const agent = request.agent(app);
  beforeAll(() => seedSuperAdmin());

  it('blocks anonymous access', async () => expect((await request(app).get('/api/leagues')).status).toBe(401));
  it('rejects bad login', async () => expect((await agent.post('/api/auth/login').send({ email: 'super@test.com', password: 'x' })).status).toBe(401));
  it('logs in, validates, creates league + schedule, adds a player', async () => {
    expect((await agent.post('/api/auth/login').send({ email: 'super@test.com', password: 'pass1234' })).status).toBe(200);
    const bad = await agent.post('/api/leagues').send({ ...league, maxTransfers: 9 });
    expect(bad.status).toBe(400); expect(bad.body.error.fields.maxTransfers).toBe('Max 7');
    const ok = await agent.post('/api/leagues').send(league);
    expect(ok.status).toBe(201);
    const id = ok.body.league.id;
    expect((await agent.post('/api/leagues').send(league)).status).toBe(409);
    expect((await agent.get(`/api/leagues/${id}/tracker`)).body.matchdays).toHaveLength(5);
    const p = await agent.post(`/api/leagues/${id}/players`).field('name', 'Sam Okello').field('position', 'MID').field('ovr', '80');
    expect(p.status).toBe(201);
    expect((await agent.post(`/api/leagues/${id}/players`).field('name', 'X').field('position', 'MID').field('ovr', '120')).status).toBe(400);
    expect((await agent.get(`/api/leagues/${id}/players`)).body.players).toHaveLength(1);
  });
  it('super admin can add an admin; new admin cannot', async () => {
    expect((await agent.post('/api/admins').send({ name: 'Ann', email: 'ann@test.com', password: 'password1' })).status).toBe(201);
    const ann = request.agent(app);
    await ann.post('/api/auth/login').send({ email: 'ann@test.com', password: 'password1' });
    expect((await ann.get('/api/admins')).status).toBe(403);
  });
});
