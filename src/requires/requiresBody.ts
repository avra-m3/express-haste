import { z, ZodSchema } from 'zod';
import express from 'express';
import { pipe } from 'fp-ts/function';
import { parseSafe } from '../utils';
import { createHasteOperation } from './operation';

export const requiresBody = <S extends ZodSchema>(schema: S) =>
  createHasteOperation(
    {
      body: schema,
    },
    bodyValidator(schema),
    bodyEnhancer(schema),
  );
const bodyEnhancer = (schema: ZodSchema) => () => ({
  requestBody: {
    content: {
      'application/json': {
        schema,
      },
    },
  },
});
const bodyValidator = (schema: ZodSchema) => (req: express.Request) => pipe(
  { body: req.body },
  parseSafe(z.object({ body: schema })),
);