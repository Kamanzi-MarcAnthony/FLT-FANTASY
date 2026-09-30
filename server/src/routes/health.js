import { Router } from 'express';
const router = Router();
// serverTime is also what the Matchday Tracker will sync against (milestone 4)
router.get('/', (req, res) => res.json({ status: 'ok', serverTime: new Date().toISOString() }));
export default router;
