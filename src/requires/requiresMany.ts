// @ts-ignore
import { concatAll, Monoid } from 'fp-ts/Monoid';
import { HasteEffect } from '../types';
import { createHasteOperation, HasteOperation } from './operation';
import { MergeEffects } from '../types/utilities';
import { constant, flow, pipe } from 'fp-ts/function';
import { Applicative, map, separate } from 'fp-ts/Array';
import express from 'express';
import { array, either } from 'fp-ts';
import { ZodError } from 'zod';
import { ZodOpenApiOperationObject } from 'zod-openapi/lib-types/create/document';
import { mergeDeep } from '../utils';

export function requiresMany<H extends HasteOperation<any>[]>(...operations: H) {
  return createHasteOperation(
    pipe(
      operations,
      map(({ _effects }) => _effects),
      concatAll(HasteMergeMonoid),
      (v) => v as MergeEffects<H>
    ),
    validateMany(operations),
    enhanceMany(operations)
  );
}

const validateMany = (operations: HasteOperation<any>[]) => (req: express.Request) =>
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
const enhanceMany = (operations: HasteOperation<any>[]) => (schema: ZodOpenApiOperationObject) =>
  pipe(
    operations.reduce((result, operation) => mergeDeep(result, operation._enhancer(result)), schema)
  );

const HasteMergeMonoid: Monoid<HasteEffect> = {
  concat: (a, b) => ({ ...a, ...b }),
  empty: {},
};
