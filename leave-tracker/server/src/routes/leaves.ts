import { Router } from 'express';
import { Db } from '../db';
import { asyncHandler, ValidationError } from '../lib/errors';
import { searchDelay } from '../lib/searchDelay';
import { countByStatus } from '../repos/leaves';
import { createLeave, decideLeave, getLeave, getLeavePage } from '../services/leaves';
import { isLeaveStatus, LeaveStatus } from '../types';

function parsePositiveInt(value: unknown, fallback: number): number | null {
  if (value === undefined || value === '') return fallback;
  const n = Number(value);
  return Number.isInteger(n) && n > 0 ? n : null;
}

function parseId(value: string): number {
  const id = parsePositiveInt(value, NaN);
  if (id === null || Number.isNaN(id)) throw new ValidationError('Invalid leave id');
  return id;
}

export function leavesRouter(db: Db): Router {
  const router = Router();

  router.get(
    '/',
    asyncHandler(async (req, res) => {
      const q = typeof req.query.q === 'string' ? req.query.q.trim() : '';
      const status = typeof req.query.status === 'string' && req.query.status !== '' ? req.query.status : undefined;
      if (status && !isLeaveStatus(status)) throw new ValidationError('Invalid status');

      const page = parsePositiveInt(req.query.page, 1);
      if (page === null) throw new ValidationError('Invalid page');
      const limit = parsePositiveInt(req.query.limit, 10);
      if (limit === null || limit > 50) throw new ValidationError('Invalid limit');

      await searchDelay(q);
      res.json(await getLeavePage(db, { q, status: status as LeaveStatus | undefined, page, limit }));
    }),
  );

  router.get(
    '/summary',
    asyncHandler(async (_req, res) => {
      res.json(await countByStatus(db));
    }),
  );

  router.get(
    '/:id',
    asyncHandler(async (req, res) => {
      res.json(await getLeave(db, parseId(req.params.id)));
    }),
  );

  router.post(
    '/',
    asyncHandler(async (req, res) => {
      const leave = await createLeave(db, req.body);
      res.status(201).json(leave);
    }),
  );

  router.post(
    '/:id/approve',
    asyncHandler(async (req, res) => {
      res.json(await decideLeave(db, parseId(req.params.id), 'APPROVED'));
    }),
  );

  router.post(
    '/:id/reject',
    asyncHandler(async (req, res) => {
      res.json(await decideLeave(db, parseId(req.params.id), 'REJECTED'));
    }),
  );

  return router;
}
