import { Router } from 'express';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import db from '../db/index.js';
import { AppError } from '../errors.js';
import { requireAdmin, secret } from '../middleware/auth.js';

const router = Router();
const prod = process.env.NODE_ENV === 'production';
const cookie = { httpOnly: true, sameSite: prod ? 'none' : 'lax', secure: prod, maxAge: 7 * 864e5 };
const pub = ({ id, name, email, role }) => ({ id, name, email, role });

router.post('/login', (req, res) => {
  const { email, password } = z.object({ email: z.string().email('Enter a valid email'), password: z.string().min(1, 'Password is required') }).parse(req.body);
  const a = db.prepare('SELECT * FROM admins WHERE email=?').get(email.toLowerCase());
  if (!a || !bcrypt.compareSync(password, a.password_hash)) throw new AppError(401, 'INVALID_CREDENTIALS', 'Incorrect email or password');
  res.cookie('token', jwt.sign({ id: a.id }, secret(), { expiresIn: '7d' }), cookie).json({ user: pub(a) });
});
router.post('/logout', (req, res) => res.clearCookie('token', { ...cookie, maxAge: undefined }).json({ ok: true }));
router.get('/me', requireAdmin, (req, res) => res.json({ user: req.admin }));
export default router;
