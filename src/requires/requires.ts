import {
  AuthConfig,
  BodyConfig,
  ExtendEffect,
  HasteEffect,
  MergeTwoResponses,
  RequirementConfig,
  Requires,
  ResponseConfig,
  StatusCode,
} from '../types';
import { constant, pipe } from 'fp-ts/function';
import { option } from 'fp-ts';
import { z, ZodError, ZodType } from 'zod';
import { enhanceAll, enhanceAllComponents } from './enhancers';
import { validateAll } from './validators';
import { fold } from 'fp-ts/Either';
import { zodToRfcError } from '../utils';
import express, { NextFunction } from 'express';
import { SecuritySchemeObject } from 'zod-openapi/lib-types/openapi3-ts/dist/model/openapi30';

export function requires<Effect extends HasteEffect, Config extends RequirementConfig>(
  config?: Config,
  _effects?: Effect
) {
  const requires = {
    body<Body extends ZodType, Config extends BodyConfig>(schema: Body, config?: Config) {
      return enhanceRequirement(this, { body: { schema, config: config || ({} as Config) } });
    },

    query<Key extends string, Value extends ZodType>(parameter: Key, schema: Value) {
      return pipe(
        this._effects.query,
        option.fromNullable,
        option.getOrElse(constant(z.object({}))),
        (effect) =>
          ({ query: effect.extend({ [parameter]: schema }) }) as ExtendEffect<
            Effect,
            'query',
            { [P in Key]: Value }
          >,
        (effect) => enhanceRequirement(this, effect)
      );
    },

    path<Key extends string, Value extends ZodType>(key: Key, schema: Value) {
      return pipe(
        this._effects.path,
        option.fromNullable,
        option.getOrElse(constant(z.object({}))),
        (effect) =>
          ({ path: effect.extend({ [key]: schema }) }) as ExtendEffect<
            Effect,
            'path',
            { [P in Key]: Value }
          >,
        (effect) => enhanceRequirement(this, effect)
      );
    },

    header<Key extends string, Value extends ZodType>(key: Key, schema: Value) {
      return pipe(
        this._effects.header,
        option.fromNullable,
        option.getOrElse(constant(z.object({}))),
        (effect) =>
          ({ header: effect.extend({ [key]: schema }) }) as ExtendEffect<
            Effect,
            'header',
            { [P in Key]: Value }
          >,
        (effect) => enhanceRequirement(this, effect)
      );
    },

    cookie<Key extends string, Value extends ZodType>(key: Key, schema: Value) {
      return pipe(
        this._effects.cookie,
        option.fromNullable,
        option.getOrElse(constant(z.object({}))),
        (effect) =>
          ({ cookie: effect.extend({ [key]: schema }) }) as ExtendEffect<
            Effect,
            'cookie',
            { [P in Key]: Value }
          >,
        (effect) => enhanceRequirement(this, effect)
      );
    },

    response<Status extends StatusCode, Response extends ZodType, RConfig extends ResponseConfig>(
      status: Status,
      schema: Response,
      config?: RConfig
    ) {
      return pipe(
        this._effects.response || [],
        (oldResponse) => [...oldResponse, { status, schema, config: config || ({} as RConfig) }],
        (newResponse) => ({
          response: newResponse,
        }),
        (newResponse) =>
          enhanceRequirement(this, newResponse) as Requires<
            Omit<Effect, 'response'> & MergeTwoResponses<Effect, Status, Response>
          >
      );
    },
    auth<Name extends string, Scheme extends SecuritySchemeObject, Config extends AuthConfig>(
      name: Name,
      scheme: Scheme,
      config?: Config
    ) {
      return enhanceRequirement(this, {
        auth: {
          ...this._effects.auth,
          [name]: {
            scheme,
            config: config || ({} as AuthConfig),
          },
        } as { [N in Name]: { scheme: Scheme; config: Config } },
      });
    },

    _effects: _effects || ({} as Effect),
    _config: config || {},
    _hastens: true,
    _enhancer(operation) {
      return enhanceAll(this._effects, operation);
    },
    _components() {
      return enhanceAllComponents(this._effects);
    },
    _validator(req) {
      return validateAll(this._effects, req);
    },
    _handle(req: express.Request, res: express.Response, next: NextFunction) {
      return pipe(
        req,
        (req) => this._validator(req),
        fold(
          (e) =>
            pipe(
              config?.errorHandler,
              option.fromNullable,
              option.fold(
                () => defaultErrorHandler(e, res),
                (handler) => handler(e, res, next)
              )
            ),
          () => {
            next();
          }
        )
      );
    },
    // @ts-expect-error We need this to duct tape our typing system together.
    '()': () => {},
  } satisfies Requires<Effect>;

  return Object.assign(requires._handle.bind(requires), requires);
}

const defaultErrorHandler = (e: ZodError, res: express.Response) => {
  res.status(400).contentType('application/problem+validation+json').json(zodToRfcError(e)).send();
};

const enhanceRequirement = <R extends Requires<HasteEffect>, E extends HasteEffect>(
  requires: R,
  newEffect: E
) => {
  Object.assign(requires._effects, {
    ...requires._effects,
    ...newEffect,
  });
  // Because of a quirk in how this() is handled we cannot return a new/rebound object here.
  return requires as unknown as Requires<Omit<R['_effects'], keyof E> & E>;
};
