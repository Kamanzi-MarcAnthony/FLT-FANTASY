import 'dotenv/config';
import { seedSuperAdmin } from './db/index.js';
import { createApp } from './app.js';

seedSuperAdmin();
const port = process.env.PORT || 3000;
createApp().listen(port, () => console.log(`API listening on http://localhost:${port}`));
