import { Router } from 'express';
import { Db } from '../db';
import { asyncHandler } from '../lib/errors';
import { listEmployees } from '../repos/employees';

export function employeesRouter(db: Db): Router {
  const router = Router();

  router.get(
    '/',
    asyncHandler(async (_req, res) => {
      res.json(await listEmployees(db));
    }),
  );

  return router;
}
