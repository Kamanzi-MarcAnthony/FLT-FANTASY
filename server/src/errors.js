// One error shape for the whole API:
// { error: { code, message, fields? } }
export class AppError extends Error {
  constructor(status, code, message, fields) {
    super(message);
    this.status = status;
    this.code = code;
    this.fields = fields;
  }
}
export const badRequest = (message, fields) => new AppError(400, 'VALIDATION_ERROR', message, fields);
export const unauthorized = (message = 'Please log in') => new AppError(401, 'UNAUTHORIZED', message);
export const forbidden = (message = 'Not allowed') => new AppError(403, 'FORBIDDEN', message);
export const notFound = (message = 'Not found') => new AppError(404, 'NOT_FOUND', message);
export const conflict = (message, fields) => new AppError(409, 'CONFLICT', message, fields);
