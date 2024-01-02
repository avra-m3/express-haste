import { z, ZodSchema } from 'zod';
import express from 'express';
import { pipe } from 'fp-ts/function';
import { parseSafe } from '../utils';
import { createHasteOperation } from './operation';

type BodyOptions = {
  contentType: string;
};
export const requiresBody = <S extends ZodSchema>(schema: S, options?: BodyOptions) =>
  createHasteOperation(
    {
      body: schema,
    },
    bodyValidator(schema),
    bodyEnhancer(schema, options)
  );
const bodyEnhancer = (schema: ZodSchema, options?: BodyOptions) => () => ({
  requestBody: {
    content: {
      [options?.contentType || 'application/json']: {
        schema,
      },
    },
  },
});
const bodyValidator = (schema: ZodSchema) => (req: express.Request) =>
  pipe({ body: req.body }, parseSafe(z.object({ body: schema })));
