import { ZodOpenApiOperationObject } from 'zod-openapi/lib-types/create/document';
import express, { Handler, NextFunction } from 'express';
import { Either } from 'fp-ts/Either';
import { util, ZodError, ZodObject, ZodRawShape, ZodSchema, ZodType } from 'zod';
import {
  AuthConfig,
  BodyConfig,
  HasteEffect,
  ResponseConfig,
  SchemaWithConfig,
  StatusCode,
} from './index';
import { ParameterLocation } from 'zod-openapi/lib-types/openapi3-ts/dist/model/openapi31';
import { RequestHandler } from 'express-serve-static-core';
import { SecuritySchemeObject } from 'zod-openapi/lib-types/openapi3-ts/dist/model/openapi30';
import { ZodOpenApiComponentsObject } from 'zod-openapi';
import Omit = util.Omit;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export interface HasteOperation<Effects = any> extends Handler {
  _hastens: boolean;
  _enhancer: HastePathEnhancer;
  _effects: Effects;
  _validator: HasteValidator;
}

export type Enhancer<T> = (operation: T) => Partial<T>;
export type HastePathEnhancer = Enhancer<ZodOpenApiOperationObject>;
export type HasteComponentEnhancer = Enhancer<ZodOpenApiComponentsObject>;
export type HasteValidator = <H extends HasteOperation>(
  this: H,
  req: express.Request
) => Either<ZodError, unknown>;

export type MergeTwoResponses<
  Effect extends HasteEffect,
  Status extends StatusCode,
  Response extends ZodType,
> = {
  response: Effect['response'] extends [...infer Existing extends NonNullable<Effect['response']>]
    ? [...Existing, { status: Status; schema: Response }]
    : [
        {
          status: Status;
          schema: Response;
        },
      ];
};

export type ExtendEffect<
  Effect extends HasteEffect,
  Where extends ParameterLocation,
  Value extends { [k in string]: ZodType },
> = {
  [W in Where]: Effect[Where] extends ZodObject<infer Shape extends ZodRawShape>
    ? ZodObject<Shape & Value>
    : ZodObject<Value>;
};

export type HasteCustomErrorHandler = (
  errors: ZodError,
  res: express.Response,
  next: NextFunction
) => void;
export type RequirementConfig = {
  errorHandler?: HasteCustomErrorHandler;
};

export interface Requires<Effect extends HasteEffect> extends express.RequestHandler {
  /**
   * Add a validation against the `request.body` field, this field must match the given schema or the errorHandler will
   * be called.
   * @param schema {ZodType} Any zod schema, json is the default assumed incoming value.
   * @param config {BodyConfig} Customise the behaviour of the body validator including changing the contentType.
   */
  body<Body extends ZodSchema, Config extends BodyConfig>(
    schema: Body,
    config?: Config
  ): Requires<Omit<Effect, 'body'> & { body: SchemaWithConfig<Body, Config> }>;

  /**
   * Add a validation against the `request.query` field, this field must contain and match the expected value or the errorHandler will
   * be called.
   * @param parameter {string} The key of this query parameter.
   * @param schema {ZodType} The schema this key should match, incoming query parameters should only ever be z.string() or z.string().array(),
   * you can use transforms to extend these to another type ie transform a string to a number etc.
   */
  query<Param extends string, Query extends ZodType>(
    parameter: Param,
    schema: Query
  ): Requires<Omit<Effect, 'query'> & ExtendEffect<Effect, 'query', { [P in Param]: Query }>>;

  /**
   * Add validation against the `request.params` field, this field must contain and match the expected value or the errorHandler will
   * be called.
   * @param key {string} The key of this path field as defined in the path given to express.
   * @param schema {ZodType} The schema this key should match, incoming paths will only ever be z.string() although
   * typing allows you to pass any schema.
   */
  path<Key extends string, Value extends ZodType>(
    key: Key,
    schema: Value
  ): Requires<Omit<Effect, 'path'> & ExtendEffect<Effect, 'path', { [P in Key]: Value }>>;

  /**
   * Add validation against the `request.headers` `field, this field must contain and match the expected value or the errorHandler will
   * be called.
   * @param key {string} The header field name, non-standard header fields should be prefixed by x- as per convention.
   * @param schema {ZodType} The schema the header value should match, incoming headers will only ever be z.string() although
   * typing allows you to pass any schema.
   */
  header<Key extends string, Value extends ZodType>(
    key: Key,
    schema: Value
  ): Requires<Omit<Effect, 'header'> & ExtendEffect<Effect, 'header', { [P in Key]: Value }>>;

  /**
   * Add validation against the `request.cookies` `field, this field must contain and match the expected value or the errorHandler will
   * be called.
   * @requires cookie-parser cookie-parser must set up to parse cookie fields.
   * @param key {string} The cookie field name, non-standard header fields should be prefixed by x- as per convention.
   * @param schema {ZodType} The schema the header value should match, incoming headers will only ever be z.string() although
   * typing allows you to pass any schema.
   */
  cookie<Key extends string, Value extends ZodType>(
    key: Key,
    schema: Value
  ): Requires<Omit<Effect, 'cookie'> & ExtendEffect<Effect, 'cookie', { [P in Key]: Value }>>;

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
  ): Requires<Omit<Effect, 'response'> & MergeTwoResponses<Effect, Status, Response>>;

  /**
   *
   * @param name {string} A name for the authentication scheme in the api spec.
   * @param scheme {SecuritySchemeObject} The OAIS security scheme to apply to this request.
   * @param config {AuthConfig} If no handler is defined, no validation will occur for this auth pattern.
   */
  auth<Name extends string, Scheme extends SecuritySchemeObject, Config extends AuthConfig>(
    name: Name,
    scheme: Scheme,
    config?: Config
  ): Requires<Omit<Effect, 'auth'> & { auth: { [N in Name]: { scheme: Scheme; config: Config } } }>;

  readonly _hastens: true;
  _effects: Effect;
  _handle: RequestHandler;
  _config: RequirementConfig;
  _enhancer: HastePathEnhancer;
  _components: HasteComponentEnhancer;
  _validator: HasteValidator;
}
