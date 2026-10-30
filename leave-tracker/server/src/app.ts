import cors from 'cors';
import express, { ErrorRequestHandler, Express } from 'express';
import { Db } from './db';
import { HttpError } from './lib/errors';
import { employeesRouter } from './routes/employees';
import { leavesRouter } from './routes/leaves';

export function createApp(db: Db, options: { corsOrigin?: string } = {}): Express {
  const app = express();

  app.use(cors(options.corsOrigin ? { origin: options.corsOrigin } : undefined));
  app.use(express.json());

  app.use('/api/employees', employeesRouter(db));
  app.use('/api/leaves', leavesRouter(db));

  app.use((req, res) => {
    res.status(404).json({ error: { message: `Route not found: ${req.method} ${req.path}` } });
  });

  const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
    if (err instanceof HttpError) {
      res.status(err.status).json({ error: { message: err.message } });
      return;
    }
    if (err && err.type === 'entity.parse.failed') {
      res.status(400).json({ error: { message: 'Request body is not valid JSON' } });
      return;
    }
    console.error(err);
    res.status(500).json({ error: { message: 'Something went wrong' } });
  };
  app.use(errorHandler);

  return app;
}
