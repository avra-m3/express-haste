import { Request } from 'express';
import { z, ZodSchema, ZodType } from 'zod';
import { HasteBadRequestSchema, HasteOptionSchema } from '../schemas';
import { ParamsDictionary, RequestHandler } from "express-serve-static-core";
import { HasteOperation } from '../requires';
import { ParsedQs } from "qs";

export type StatusCode = `${1 | 2 | 3 | 4 | 5}${string}`;
export type HasteResponseEffect = { status: StatusCode; schema: ZodSchema };

export type HasteEffect = {
  body?: ZodSchema;
  response?: HasteResponseEffect[];
  path?: { [K in string]: ZodSchema };
  query?: { [K in string]: ZodSchema };
  header?: { [K in string]: ZodSchema };
  cookie?: { [K in string]: ZodSchema };
}

type RecurseInfer<T extends HasteResponseEffect[]> = T extends [
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

export type HasteParamsFor<E> = E extends HasteEffect
  ? E['path'] extends NonNullable<E['path']>
    ? {
        [Key in keyof E['path']]: z.infer<E['path'][Key]>;
      }
    : ParamsDictionary
  : ParamsDictionary;

export type HasteQueryFor<E> =E extends HasteEffect
  ? E['query'] extends NonNullable<E['query']>
    ? {
        [Key in keyof E['query']]: z.infer<E['query'][Key]>;
      } & Exclude<Request['query'], keyof E['query']>
    : ParsedQs
  : ParsedQs;

export type HasteRequestHandler<O> = O extends HasteOperation<infer E>
  ? RequestHandler<
      HasteParamsFor<E>,
      HasteResponseFor<E>,
      E['body'] extends ZodType ? z.infer<E['body']> : any,
      HasteQueryFor<E>,
      any
    >
  : RequestHandler;

export type HasteOptionType = (typeof HasteOptionSchema)['_input'];

export type HasteBadRequestType = z.infer<typeof HasteBadRequestSchema>;
