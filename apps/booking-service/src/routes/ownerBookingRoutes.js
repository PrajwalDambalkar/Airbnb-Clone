import { Router } from 'express';

const router = Router();

router.get('/', async (req, res) => {
  res.json([]);
});

router.post('/', async (req, res) => {
  res.status(501).json({ message: 'Not implemented in this environment.' });
});

export default router;
