import { AnyZodObject, z, ZodSchema, ZodType } from 'zod';
import { HasteBadRequestSchema, HasteOptionSchema } from '../schemas';
import { ParamsDictionary, RequestHandler } from 'express-serve-static-core';
import { ParsedQs } from 'qs';
import { HasteOperation } from './haste';

export type StatusCode = `${ 1 | 2 | 3 | 4 | 5 }${ string }`;
export type HasteResponseEffect = { status: StatusCode; schema: ZodSchema };

export type HasteEffect = {
    body?: ZodSchema;
    response?: HasteResponseEffect[];
    path?: AnyZodObject;
    query?: AnyZodObject;
    header?: AnyZodObject;
    cookie?: AnyZodObject;
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
    ? E extends { response: infer R }
        ? RecurseInfer<R>
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

export type HasteRequestHandler<O> = O extends HasteOperation<infer E>
    ? RequestHandler<
        E extends { path: infer P } ? HasteParamsFor<P> : ParamsDictionary,
        E extends { response: Array<{ schema: infer S extends ZodType }> } ? z.infer<S> : any,
        E extends { body: infer B extends ZodType } ? z.infer<B> : any,
        E extends { query: infer Q } ? HasteQueryFor<Q> : ParsedQs
    >
    : RequestHandler;

export type HasteOptionType = (typeof HasteOptionSchema)['_input'];

export type HasteBadRequestType = z.infer<typeof HasteBadRequestSchema>;

export * from "./haste"
export * from "./utilities"