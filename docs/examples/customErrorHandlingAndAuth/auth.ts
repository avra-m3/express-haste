import { requires } from '../../../src';
import * as jwt from 'jsonwebtoken';
import { z } from 'zod';
import { HasteRequestHandler } from 'express-haste';

export const requireAuth = requires()
  .auth('jwt', {
    type: 'apiKey',
    scheme: 'Bearer',
  })
  .response('401', z.object({ message: z.literal('Unauthorized') }));

const splitBearer = z.tuple([z.literal('Bearer'), z.string()]);
const tokenHeaderSchema = z
  .string()
  .transform((value) => splitBearer.parse(value.split(' ', 1))[1]);
/**
 * This is NOT intended to be a reference for implementing secure jwt validation.
 * This example is vastly oversimplified and inherently insecure,
 * for details on a proper jwt implementation see https://www.npmjs.com/package/jsonwebtoken
 */
export const authValidator: HasteRequestHandler<typeof requireAuth> = (req, res, next) => {
  try {
    const rawToken = req.headers['authorization'];
    const probablyToken = tokenHeaderSchema.parse(rawToken);
    // IMPORTANT: this is being verified with a symmetric key, do not use in a real application
    const token = jwt.verify(probablyToken, 'totally very secret');
    if (token) {
      req.app.set('user', token)
      next();
    }
  } catch (e) {
    res.status(401).json({
      message: 'Unauthorized',
    });
  }
};
