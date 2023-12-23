import { Handler, Request } from 'express';
import { ZodOpenApiOperationObject } from 'zod-openapi/lib-types/create/document';
import { z, ZodSchema } from 'zod';
import { HasteBadRequestSchema, HasteOptionSchema } from './schemas';
import { RequestHandler } from 'express-serve-static-core';

type SingleHasteOperation<
  S extends ZodSchema = any,
  L extends HasteLocation = any,
  K extends string = any,
> = {
  _requires: S;
  _where: L;
  _key: K;
};

export interface HasteOperation<
  Effects extends {
    body?: ZodSchema;
    path?: { [PK in string]: ZodSchema };
    query?: { [QK in string]: ZodSchema };
    header?: { [HK in string]: ZodSchema };
    cookie?: { [CK in string]: ZodSchema };
  } = any,
> extends Handler {
  _hastens: boolean;
  _enhancer: (operation: ZodOpenApiOperationObject) => Partial<ZodOpenApiOperationObject>;
  _effects: Effects;
}

export type HasteParamsFor<O extends HasteOperation> = O['_effects']['path'] extends undefined
  ? Request['params']
  : {
      [Key in O['_effects']['path'] as `${Key}`]: z.infer<O['_effects']['path'][Key]>;
    } & Request['params'];

export declare abstract class HasteCOperation<
  Schema extends ZodSchema,
  Location extends HasteOperation,
> {
  readonly _requires: Schema;
  readonly _where: Location;

  _enhancer(operation: ZodOpenApiOperationObject): ZodOpenApiOperationObject;
}

export type HasteLocation = 'body' | 'cookie' | 'header' | 'query' | 'path';

export type HasteOptionType = (typeof HasteOptionSchema)['_input'];

export type HasteBadRequestType = z.infer<typeof HasteBadRequestSchema>;
