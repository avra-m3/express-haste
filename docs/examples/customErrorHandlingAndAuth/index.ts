import express, { json, Router } from 'express';
import { HasteRequestHandler } from 'express-haste';
import cookieParser from 'cookie-parser';
import { HasteCustomErrorHandler, requires } from '../../../src';
import { z } from 'zod';
import { authValidator, requireAuth } from './auth';

const app: express.Express = express();

app.use(json());
app.use(cookieParser());
/**
 * In this example we have 2 routes
 * /public -> returns {message: "hello world"}
 * /user -> accepts a jwt and returns the user object
 * /docs -> view the documentation (no authentication)
 */

const docRouter = Router();
app.use('/docs', docRouter);

const customErrorFunction: HasteCustomErrorHandler = (e, res) =>
  res.send({
    message: e.issues.map((i) => i.message).join(' and '),
  });

const r = () => requires({ errorHandler: customErrorFunction });

// Get one pet is exempt from needing a header for demo reasons.
app.get('/public', r().response('200', z.object({ message: z.string() })), (_req, res) =>
  res.json({
    message: 'hello world',
  })
);

// Require an authorization header for requests not public
app.use(requireAuth, authValidator);

app.get('/user', r().response('200', z.object({}).passthrough().describe('Anything in the JWT')));
app.post('/user');

const updateRequirements = requires({ errorHandler: customErrorFunction })
  .body(z.object({ email: z.string() }).describe('Update the email of this user'))
  .response('202', z.object({ message: z.literal('Accepted') }));
const updateUser: HasteRequestHandler<typeof updateRequirements> = (_req, res) => res.status(202);

export default app;
