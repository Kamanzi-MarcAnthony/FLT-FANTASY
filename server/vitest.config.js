import { defineConfig } from 'vitest/config';
export default defineConfig({ test: { env: { DATABASE_PATH: ':memory:', JWT_SECRET: 'test', SUPER_ADMIN_EMAIL: 'super@test.com', SUPER_ADMIN_PASSWORD: 'pass1234' } } });
