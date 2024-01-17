import { AnyZodObject, z, ZodSchema, ZodType } from 'zod';
import { HasteBadRequestSchema, HasteOptionSchema } from '../schemas';
import * as core from 'express-serve-static-core';
import { ParamsDictionary } from 'express-serve-static-core';
import { ParsedQs } from 'qs';
import { Requires } from './haste';
import express, { NextFunction } from 'express';
import { ParseInt } from './utilities';
import { SecuritySchemeObject } from 'zod-openapi/lib-types/openapi3-ts/dist/model/openapi30';

export type StatusCode = `${1 | 2 | 3 | 4 | 5}${string}`;

export type BodyConfig = { contentType?: string };
export type ResponseConfig = { contentType?: string; description?: string };
export type AuthConfig = {
  /**
   * A validator function that handles auth validation.
   * @param req The request to validate against.
   * @param method The security scheme to validate.
   * @returns {boolean | () => string} A literal true value when validation is successful, false or a string error when not successful
   */
  validator?: (req: express.Request, method: SecuritySchemeObject) => boolean | string;
  requireScopes?: string[];
};

export type SchemaWithConfig<Schema extends ZodType, Config extends { [k in string]: string }> = {
  schema: Schema;
  config?: Config;
};

export type HasteResponseEffect = SchemaWithConfig<ZodSchema, ResponseConfig> & {
  status: StatusCode;
};

export type HasteAuthEffect = {
  [name in string]: {
    scheme: SecuritySchemeObject;
    config: AuthConfig;
  };
};

export type HasteEffect = {
  response?: HasteResponseEffect[];
  auth?: HasteAuthEffect;
  body?: SchemaWithConfig<ZodSchema, BodyConfig>;
  path?: AnyZodObject;
  query?: AnyZodObject;
  header?: AnyZodObject;
  cookie?: AnyZodObject;
};

export type HasteRequest<O> = O extends Requires<infer E>
  ? express.Request<
      E extends { path: infer P extends ZodType } ? z.infer<P> : ParamsDictionary,
      E extends { response: Array<{ schema: infer S extends ZodType }> } ? z.infer<S> : unknown,
      E extends { body: { schema: infer B extends ZodType } } ? z.infer<B> : unknown,
      E extends { query: infer P extends ZodType } ? z.infer<P> & Omit<ParsedQs, keyof P> : ParsedQs
    >
  : express.Request;

export type HasteResponse<O> = O extends Requires<infer E>
  ? core.Response<
      E extends { response: Array<{ schema: infer S extends ZodType }> } ? z.infer<S> : unknown,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      any,
      E extends { response: Array<{ status: infer S }> } ? ParseInt<S> : number
    >
  : express.Response;

export type HasteRequestHandler<O> = (
  request: HasteRequest<O>,
  response: HasteResponse<O>,
  next: NextFunction
) => void;

export type HasteOptionType = (typeof HasteOptionSchema)['_input'];

export type HasteBadRequestType = z.infer<typeof HasteBadRequestSchema>;

export * from './haste';
export * from './utilities';
