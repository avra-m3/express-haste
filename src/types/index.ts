import { Request } from 'express';
import { z, ZodSchema, ZodType } from 'zod';
import { HasteBadRequestSchema, HasteOptionSchema } from '../schemas';
import { ParamsDictionary, RequestHandler } from 'express-serve-static-core';
import { HasteOperation } from '../requires';
import { ParsedQs } from 'qs';

export type StatusCode = `${1 | 2 | 3 | 4 | 5}${string}`;
export type HasteResponseEffect = { status: StatusCode; schema: ZodSchema };

export type HasteEffect = {
  body?: ZodSchema;
  response?: HasteResponseEffect[];
  path?: { [K in string]: ZodSchema };
  query?: { [K in string]: ZodSchema };
  header?: { [K in string]: ZodSchema };
  cookie?: { [K in string]: ZodSchema };
};

type RecurseInfer<T> = T extends [
  infer I1 extends HasteResponseEffect,
  ...infer I2 extends HasteResponseEffect[],
]
  ? z.infer<I1['schema']> | RecurseInfer<I2>
  : T extends [infer I3 extends HasteResponseEffect]
    ? z.infer<I3['schema']>
    : never;

export type HasteResponseFor<E> = E extends HasteEffect
  ? E['response'] extends NonNullable<E['response']>
    ? RecurseInfer<E['response']>
    : any
  : any;

export type HasteParamsFor<E> = E extends { [k in string]: ZodSchema }
  ? {
      [Key in keyof E]: z.infer<E[Key]>;
    }
  : ParamsDictionary;

export type HasteQueryFor<E> = E extends { [k in string]: ZodSchema }
  ? {
      [Key in keyof E]: z.infer<E[Key]>;
    } & ParsedQs
  : ParsedQs;

interface HasteRequest<E extends HasteEffect> {
  path: HasteParamsFor<E['path']>;
  response: HasteResponseFor<E>;
  body: E['body'] extends ZodType ? z.infer<E['body']> : any;
  query: HasteQueryFor<E['query']>;
}

export type HasteRequestHandler<O> = O extends HasteOperation<infer E>
  ? RequestHandler<
      HasteRequest<E>['path'],
      HasteRequest<E>['response'],
      HasteRequest<E>['body'],
      HasteRequest<E>['query'],
      any
    >
  : RequestHandler;

export type HasteOptionType = (typeof HasteOptionSchema)['_input'];

export type HasteBadRequestType = z.infer<typeof HasteBadRequestSchema>;
