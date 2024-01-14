import { HasteEffect } from '../types';
import { z, ZodError } from 'zod';
import { constant, flow, pipe } from 'fp-ts/function';
import { array, either, option } from 'fp-ts';
import { ParameterLocation } from 'zod-openapi/lib-types/openapi3-ts/dist/model/openapi31';
import { parseSafe } from '../utils';
import express from 'express';
import { Either } from 'fp-ts/Either';
import { Applicative, separate } from 'fp-ts/Array';

type Validator = (effects: HasteEffect, req: express.Request) => Either<ZodError, unknown>;

const bodyValidator: Validator = (effects, req) =>
  pipe(
    effects.body,
    option.fromNullable,
    option.map(({ schema }) =>
      pipe(
        { body: req.body },
        parseSafe(z.object({ body: schema })),
        either.map((result) => (req.body = result.body))
      )
    ),
    option.getOrElseW(constant(either.right(undefined)))
  );
const parameterValidator =
  (location: ParameterLocation): Validator =>
  (effects, req) =>
    pipe(
      effects[location],
      option.fromNullable,
      option.map((schema) =>
        pipe(
          { [locationRequestMapping[location]]: req[locationRequestMapping[location]] },
          parseSafe(z.object({ [locationRequestMapping[location]]: schema })),
          either.tap((result) =>
            pipe(
              location,
              option.fromPredicate((l): l is 'query' | 'cookie' => ['query', 'cookie'].includes(l)),
              option.map((key) =>
                Object.assign(
                  req[locationRequestMapping[key]],
                  result[locationRequestMapping[key] as keyof typeof result]
                )
              ),
              constant(either.right(undefined))
            )
          )
        )
      ),
      option.getOrElseW(constant(either.right(undefined)))
    );

const locationRequestMapping: Record<ParameterLocation, keyof express.Request> = {
  path: 'params',
  cookie: 'cookies',
  header: 'headers',
  query: 'query',
};
export const enhancerMapping: Record<keyof HasteEffect, Validator> = {
  body: bodyValidator,
  response: constant(either.right({})),
  query: parameterValidator('query'),
  path: parameterValidator('path'),
  header: parameterValidator('header'),
  cookie: parameterValidator('cookie'),
};

export const validateAll = (effect: HasteEffect, req: express.Request) =>
  pipe(
    Object.keys(effect) as (keyof HasteEffect)[],
    array.map((key) => enhancerMapping[key](effect, req)),
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
