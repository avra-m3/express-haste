import { Request } from 'express';
import { z, ZodSchema, ZodType } from 'zod';
import { HasteBadRequestSchema, HasteOptionSchema } from '../schemas';
import { RequestHandler } from 'express-serve-static-core';
import { HasteOperation } from '../requires';

export type HasteMappedEffect = 'path' | 'query' | 'header' | 'cookie' | 'responseHeader';

export type StatusCode = `${1 | 2 | 3 | 4 | 5}${string}`;
export type HasteResponseEffect = { status: StatusCode; schema: ZodSchema };

export type HasteEffect = {
  body?: ZodSchema;
  response?: HasteResponseEffect[];
} & {
  [E in HasteMappedEffect]?: { [K in string]: ZodSchema };
};

export type SingleHasteEffect<
  L extends HasteMappedEffect = any,
  K extends string = any,
  S extends ZodSchema = any,
> = Record<L, Record<K, S>>;

type RecurseInfer<T extends HasteResponseEffect[]> = T extends [
  infer I1 extends HasteResponseEffect,
  ...infer I2 extends HasteResponseEffect[],
]
  ? z.infer<I1['schema']> | RecurseInfer<I2>
  : T extends [infer I3 extends HasteResponseEffect]
    ? z.infer<I3['schema']>
    : never;

export type HasteResponseFor<O> = O extends HasteOperation<infer Op>
  ? Op['response'] extends Required<HasteEffect>['response']
    ? RecurseInfer<Op['response']>
    : any
  : any;

export type HasteParamsFor<O> = O extends HasteOperation<infer Op>
  ? Op['path'] extends Required<HasteEffect>['path']
    ? {
        [Key in keyof Op['path']]: z.infer<Op['path'][Key]>;
      } & Request['params']
    : Request['params']
  : Request['params'];

export type HasteQueryFor<O> = O extends HasteOperation<infer Op>
  ? Op['query'] extends Required<HasteEffect>['query']
    ? {
        [Key in keyof Op['query']]: z.infer<Op['query'][Key]>;
      } & Exclude<Request["query"], keyof Op['query']>
    : Request['query']
  : Request['query'];

export type HasteRequestHandler<O> = O extends HasteOperation<infer E>
  ? RequestHandler<
      HasteParamsFor<O>,
      HasteResponseFor<O>,
      E['body'] extends ZodType ? z.infer<E['body']> : any,
      HasteQueryFor<O>,
      any
    >
  : RequestHandler;

export type HasteOptionType = (typeof HasteOptionSchema)['_input'];

export type HasteBadRequestType = z.infer<typeof HasteBadRequestSchema>;
