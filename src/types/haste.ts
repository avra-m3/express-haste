import { ZodOpenApiOperationObject } from 'zod-openapi/lib-types/create/document';
import express, { Handler, NextFunction } from 'express';
import { Either } from 'fp-ts/Either';
import { util, ZodError, ZodObject, ZodRawShape, ZodSchema, ZodType } from 'zod';
import { BodyConfig, HasteEffect, ResponseConfig, SchemaWithConfig, StatusCode } from './index';
import { ParameterLocation } from 'zod-openapi/lib-types/openapi3-ts/dist/model/openapi31';
import { RequestHandler } from 'express-serve-static-core';
import Omit = util.Omit;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export interface HasteOperation<Effects = any> extends Handler {
  _hastens: boolean;
  _enhancer: HasteEnhancer;
  _effects: Effects;
  _validator: HasteValidator;
}

export type HasteEnhancer = (
  operation: ZodOpenApiOperationObject
) => Partial<ZodOpenApiOperationObject>;
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

export type RequirementConfig = {
  errorHandler?: (errors: ZodError, res: express.Response, next: NextFunction) => void;
};

export interface Requires<Effect extends HasteEffect> extends express.RequestHandler {
  _effects: Effect;
  _handle: RequestHandler;
  _config: RequirementConfig;
  _hastens: true;
  _enhancer: HasteEnhancer;
  _validator: HasteValidator;

  body<Body extends ZodSchema, Config extends BodyConfig>(
    schema: Body,
    config?: Config
  ): Requires<Omit<Effect, 'body'> & { body: SchemaWithConfig<Body, Config> }>;

  response<Status extends StatusCode, Response extends ZodType, RConfig extends ResponseConfig>(
    status: Status,
    schema: Response,
    config?: RConfig
  ): Requires<Omit<Effect, 'response'> & MergeTwoResponses<Effect, Status, Response>>;

  query<Param extends string, Query extends ZodType>(
    parameter: Param,
    schema: Query
  ): Requires<Omit<Effect, 'query'> & ExtendEffect<Effect, 'query', { [P in Param]: Query }>>;

  header<Key extends string, Value extends ZodType>(
    parameter: Key,
    schema: Value
  ): Requires<Omit<Effect, 'header'> & ExtendEffect<Effect, 'header', { [P in Key]: Value }>>;

  path<Key extends string, Value extends ZodType>(
    parameter: Key,
    schema: Value
  ): Requires<Omit<Effect, 'path'> & ExtendEffect<Effect, 'path', { [P in Key]: Value }>>;

  cookie<Key extends string, Value extends ZodType>(
    parameter: Key,
    schema: Value
  ): Requires<Omit<Effect, 'cookie'> & ExtendEffect<Effect, 'cookie', { [P in Key]: Value }>>;
}
