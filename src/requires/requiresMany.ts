import { concatAll, Monoid } from 'fp-ts/Monoid';
import { HasteEffect, HasteOperation, MergeEvery } from '../types';
import { createHasteOperation } from './operation';
import { constant, flow, pipe } from 'fp-ts/function';
import { Applicative, map, separate } from 'fp-ts/Array';
import express from 'express';
import { array, either } from 'fp-ts';
import { ZodError } from 'zod';
import { ZodOpenApiOperationObject } from 'zod-openapi/lib-types/create/document';
import { mergeDeep } from '../utils';

export function requiresMany<E, ER, H extends [HasteOperation<E>, ...HasteOperation<ER>[]]>(
  ...operations: H
): HasteOperation<MergeEvery<H>> {
  return createHasteOperation(
    pipe(
      operations,
      map(({ _effects }) => _effects as HasteEffect),
      concatAll(HasteMergeMonoid),
      (v) => v as MergeEvery<H>
    ),
    validateMany(operations),
    enhanceMany(operations)
  );
}

const validateMany = (operations: HasteOperation[]) => (req: express.Request) =>
  pipe(
    operations,
    map((op) => op._validator(req)),
    separate,
    ({ left }) =>
      pipe(
        left,
        either.fromPredicate(array.isEmpty, constant(left)),
        either.map(constant(true)),
        either.mapLeft(
          flow(
            array.map(({ issues }) => issues),
            array.sequence(Applicative),
            array.flatten,
            (issues) => ({ issues }) as ZodError
          )
        )
      )
  );
const enhanceMany = (operations: HasteOperation[]) => (schema: ZodOpenApiOperationObject) =>
  pipe(
    operations.reduce((result, operation) => mergeDeep(result, operation._enhancer(result)), schema)
  );

const HasteMergeMonoid: Monoid<HasteEffect> = {
  concat: (a, b) => ({ ...a, ...b }),
  empty: {},
};
