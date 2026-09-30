import jwt from 'jsonwebtoken';
import db from '../db/index.js';
import { unauthorized, forbidden } from '../errors.js';

export const secret = () => process.env.JWT_SECRET || 'dev-secret';
export function requireAdmin(req, res, next) {
  let admin;
  try { admin = db.prepare('SELECT id,name,email,role FROM admins WHERE id=?').get(jwt.verify(req.cookies.token || '', secret()).id); } catch { /* fallthrough */ }
  if (!admin) return next(unauthorized());
  req.admin = admin;
  next();
}
export const requireSuperAdmin = (req, res, next) => (req.admin.role === 'super_admin' ? next() : next(forbidden('Super Admin only')));
