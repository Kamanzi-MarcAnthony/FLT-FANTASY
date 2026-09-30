import { ZodError } from 'zod';
import { AppError } from '../errors.js';

export function notFoundHandler(req, res, next) {
  next(new AppError(404, 'NOT_FOUND', `Route ${req.method} ${req.path} not found`));
}

// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, next) {
  if (err instanceof ZodError) {
    const fields = {};
    for (const issue of err.issues) fields[issue.path.join('.') || '_'] ??= issue.message;
    return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'Please fix the highlighted fields', fields } });
  }
  if (err instanceof AppError) {
    return res.status(err.status).json({ error: { code: err.code, message: err.message, fields: err.fields } });
  }
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ error: { code: 'BAD_JSON', message: 'Malformed JSON body' } });
  }
  console.error(err); // logged, never leaked to the client
  res.status(500).json({ error: { code: 'INTERNAL', message: 'Something went wrong' } });
}
