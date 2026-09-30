import { Router } from 'express';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import db from '../db/index.js';
import { conflict } from '../errors.js';
import { requireAdmin, requireSuperAdmin } from '../middleware/auth.js';

const router = Router();
router.use(requireAdmin, requireSuperAdmin);

router.get('/', (req, res) => res.json({ admins: db.prepare('SELECT id,name,email,role,created_at AS createdAt FROM admins ORDER BY id').all() }));

router.post('/', (req, res) => {
  const v = z.object({
    name: z.string().trim().min(2, 'Enter a name').max(60),
    email: z.string().trim().email('Enter a valid email'),
    password: z.string().min(8, 'At least 8 characters'),
  }).parse(req.body);
  const email = v.email.toLowerCase();
  if (db.prepare('SELECT 1 FROM admins WHERE email=?').get(email)) throw conflict('That email is already registered', { email: 'Already registered' });
  const r = db.prepare("INSERT INTO admins(email,password_hash,name,role,created_by) VALUES(?,?,?,'admin',?)").run(email, bcrypt.hashSync(v.password, 10), v.name, req.admin.id);
  res.status(201).json({ admin: { id: Number(r.lastInsertRowid), name: v.name, email, role: 'admin' } }); // role is always 'admin'
});
export default router;
