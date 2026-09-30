import { Router } from 'express';
import { z } from 'zod';
import multer from 'multer';
import path from 'node:path';
import fs from 'node:fs';
import crypto from 'node:crypto';
import db, { tx } from '../db/index.js';
import { AppError, badRequest, conflict, forbidden, notFound } from '../errors.js';
import { requireAdmin } from '../middleware/auth.js';
import { generateMatchdays } from '../services/schedule.js';
import { POINTS } from '../services/points.js';

const router = Router();
router.use(requireAdmin);

const HHMM = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Use HH:MM');
const DATE = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Pick a date');
const leagueSchema = z.object({
  name: z.string().trim().min(3, 'At least 3 characters').max(60, 'Max 60 characters'),
  location: z.string().trim().min(1, 'Location is required').max(100),
  startDate: DATE,
  endDate: DATE.optional().or(z.literal('')),
  recurring: z.boolean(),
  matchday: z.number().int().min(0).max(6),
  kickoffTime: HHMM,
  matchdayEndTime: HHMM,
  maxTransfers: z.number({ invalid_type_error: 'Enter a number' }).int('Whole number').min(0, 'Min 0').max(7, 'Max 7'),
  transferDeadlineHours: z.union([z.literal(6), z.literal(8), z.literal(24)], { errorMap: () => ({ message: 'Choose 6, 8 or 24 hrs' }) }),
  timezone: z.string().refine((tz) => { try { Intl.DateTimeFormat(undefined, { timeZone: tz }); return true; } catch { return false; } }, 'Unknown timezone'),
  scoring: z.array(z.enum(['GOALS', 'ASSISTS', 'CLEANSHEETS'])).min(1, 'Select at least one option'),
}).superRefine((v, ctx) => {
  const add = (path, message) => ctx.addIssue({ code: 'custom', path: [path], message });
  if (v.matchdayEndTime <= v.kickoffTime) add('matchdayEndTime', 'Must be after kickoff');
  if (v.recurring && !v.endDate) add('endDate', 'End date is required for a weekly league');
  if (v.endDate && v.endDate <= v.startDate) add('endDate', 'Must be after start date');
});

const out = (r) => ({
  id: r.id, name: r.name, location: r.location, startDate: r.start_date, endDate: r.end_date, recurring: r.recurrence === 'weekly',
  timezone: r.timezone, matchday: r.matchday_weekday, kickoffTime: r.kickoff_time, matchdayEndTime: r.matchday_end_time,
  maxTransfers: r.max_transfers, transferDeadlineHours: r.transfer_deadline_hours, scoring: JSON.parse(r.scoring), playerCount: r.player_count,
});
const SELECT = 'SELECT l.*, (SELECT COUNT(*) FROM players p WHERE p.league_id=l.id) AS player_count FROM leagues l';

function leagueFor(req) { // 404 if missing, 403 if it belongs to another admin (super admin sees all)
  const l = db.prepare(`${SELECT} WHERE l.id=?`).get(Number(req.params.id));
  if (!l) throw notFound('League not found');
  if (l.admin_id !== req.admin.id && req.admin.role !== 'super_admin') throw forbidden('This is not your league');
  return l;
}

router.get('/', (req, res) => {
  const rows = req.admin.role === 'super_admin' ? db.prepare(`${SELECT} ORDER BY l.id DESC`).all() : db.prepare(`${SELECT} WHERE l.admin_id=? ORDER BY l.id DESC`).all(req.admin.id);
  res.json({ leagues: rows.map(out) });
});

router.post('/', (req, res) => {
  const v = leagueSchema.parse(req.body);
  const endDate = v.endDate || new Date(Date.parse(`${v.startDate}T00:00:00Z`) + 6 * 864e5).toISOString().slice(0, 10);
  const days = generateMatchdays({ startDate: v.startDate, endDate, recurring: v.recurring, weekday: v.matchday, kickoff: v.kickoffTime, end: v.matchdayEndTime, tz: v.timezone, deadlineHours: v.transferDeadlineHours });
  if (!days.length) throw badRequest('No matchday falls in that date range', { matchday: 'No matchday between start and end date' });
  try {
    const id = tx(() => {
      const r = db.prepare(`INSERT INTO leagues(admin_id,name,location,start_date,end_date,recurrence,timezone,matchday_weekday,kickoff_time,matchday_end_time,max_transfers,transfer_deadline_hours,scoring)
        VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?)`).run(req.admin.id, v.name, v.location, v.startDate, endDate, v.recurring ? 'weekly' : 'none', v.timezone, v.matchday, v.kickoffTime, v.matchdayEndTime, v.maxTransfers, v.transferDeadlineHours, JSON.stringify(v.scoring));
      const ins = db.prepare('INSERT INTO matchdays(league_id,number,matchweek_start_at,transfer_deadline_at,starts_at,ends_at) VALUES(?,?,?,?,?,?)');
      for (const d of days) ins.run(r.lastInsertRowid, d.number, d.matchweek_start_at, d.transfer_deadline_at, d.starts_at, d.ends_at);
      return Number(r.lastInsertRowid);
    });
    res.status(201).json({ league: out(db.prepare(`${SELECT} WHERE l.id=?`).get(id)) });
  } catch (e) {
    if (String(e.message).includes('UNIQUE')) throw conflict('You already have a league with that name', { name: 'Name already used' });
    throw e;
  }
});

router.get('/:id', (req, res) => res.json({ league: out(leagueFor(req)), points: POINTS }));

router.get('/:id/tracker', (req, res) => {
  const l = leagueFor(req);
  res.json({ serverTime: new Date().toISOString(), matchdays: db.prepare('SELECT number,matchweek_start_at,transfer_deadline_at,starts_at,ends_at FROM matchdays WHERE league_id=? ORDER BY number').all(l.id) });
});

// ---- players ----
const uploads = path.resolve('uploads');
fs.mkdirSync(uploads, { recursive: true });
const upload = multer({
  storage: multer.diskStorage({ destination: uploads, filename: (r, f, cb) => cb(null, crypto.randomUUID() + path.extname(f.originalname).toLowerCase()) }),
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: (r, f, cb) => (['image/jpeg', 'image/png', 'image/webp'].includes(f.mimetype) ? cb(null, true) : cb(new AppError(415, 'UNSUPPORTED_TYPE', 'Photo must be jpg, png or webp', { photo: 'jpg, png or webp only' }))),
});
const playerSchema = z.object({
  name: z.string().trim().min(2, 'At least 2 characters').max(50),
  position: z.enum(['GK', 'DEF', 'MID', 'ST'], { errorMap: () => ({ message: 'Choose a position' }) }),
  ovr: z.coerce.number({ invalid_type_error: 'Enter a number' }).int('Whole number').min(1, 'Min 1').max(99, 'Max 99'),
});
const playerOut = (p) => ({ id: p.id, name: p.name, photoUrl: p.photo_url, position: p.position, ovr: p.ovr });

router.get('/:id/players', (req, res) => res.json({ players: db.prepare('SELECT * FROM players WHERE league_id=? ORDER BY ovr DESC, name').all(leagueFor(req).id).map(playerOut) }));

router.post('/:id/players', (req, res, next) => { try { leagueFor(req); next(); } catch (e) { next(e); } }, upload.single('photo'), (req, res) => {
  const parsed = playerSchema.safeParse(req.body);
  if (!parsed.success) { if (req.file) fs.unlink(req.file.path, () => {}); throw parsed.error; }
  const { name, position, ovr } = parsed.data, photo = req.file ? `/uploads/${req.file.filename}` : null;
  const r = db.prepare('INSERT INTO players(league_id,name,photo_url,position,ovr) VALUES(?,?,?,?,?)').run(Number(req.params.id), name, photo, position, ovr);
  res.status(201).json({ player: playerOut({ id: Number(r.lastInsertRowid), name, photo_url: photo, position, ovr }) });
});
export default router;
