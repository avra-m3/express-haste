import {
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
import { enhanceAll } from './enhancers';
import { validateAll } from './validators';
import { fold } from 'fp-ts/Either';
import { zodToRfcError } from '../utils';
import express, { NextFunction } from 'express';

export function requires<
  Effect extends HasteEffect = Record<string, never>,
  Config extends RequirementConfig = RequirementConfig,
>(config?: Config, _effects?: Effect) {
  const requires = {
    /**
     * Add a validation against the `request.body` field, this field must match the given schema or the errorHandler will
     * be called.
     * @param schema {ZodType} Any zod schema, json is the default assumed incoming value.
     * @param config {BodyConfig} Customise the behaviour of the body validator including changing the contentType.
     */
    body<Body extends ZodType, Config extends BodyConfig>(schema: Body, config?: Config) {
      return enhanceRequirement(this, { body: { schema, config: config || ({} as Config) } });
    },

    /**
     * Add a validation against the `request.query` field, this field must contain and match the expected value or the errorHandler will
     * be called.
     * @param parameter {string} The key of this query parameter.
     * @param schema {ZodType} The schema this key should match, incoming query parameters should only ever be z.string() or z.string().array(),
     * you can use transforms to extend these to another type ie transform a string to a number etc.
     */
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

    /**
     * Add validation against the `request.params` field, this field must contain and match the expected value or the errorHandler will
     * be called.
     * @param key {string} The key of this path field as defined in the path given to express.
     * @param schema {ZodType} The schema this key should match, incoming paths will only ever be z.string() although
     * typing allows you to pass any schema.
     */
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

    /**
     * Add validation against the `request.headers` `field, this field must contain and match the expected value or the errorHandler will
     * be called.
     * @param key {string} The header field name, non-standard header fields should be prefixed by x- as per convention.
     * @param schema {ZodType} The schema the header value should match, incoming headers will only ever be z.string() although
     * typing allows you to pass any schema.
     */
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

    /**
     * Add validation against the `request.cookies` `field, this field must contain and match the expected value or the errorHandler will
     * be called.
     * @requires cookie-parser cookie-parser must set up to parse cookie fields.
     * @param key {string} The cookie field name, non-standard header fields should be prefixed by x- as per convention.
     * @param schema {ZodType} The schema the header value should match, incoming headers will only ever be z.string() although
     * typing allows you to pass any schema.
     */
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

    /**
     * This validator exists purely for request type enrichment and documentation purposes, no validation will occur for responses.
     * @param status {StatusCode} The status code this response is for, used in documentation and type enhancement.
     * @param schema {ZodType} The schema to validate, used for documentation and type enhancement.
     * @param config { ResponseConfig } Specify an alternate contentType, used only for documentation.
     */
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

    _effects: _effects || ({} as Effect),
    _config: config || {},
    _hastens: true,
    _enhancer(operation) {
      return enhanceAll(this._effects, operation);
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
