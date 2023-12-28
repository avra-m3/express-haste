import { AnyZodObject, z, ZodSchema, ZodType } from 'zod';
import express, { Request } from 'express';
import { identity, pipe } from 'fp-ts/function';
import { parseSafe } from '../utils';
import { flatten, fromNullable, getOrElseW, map } from 'fp-ts/Either';
import { ParameterLocation } from 'zod-openapi/lib-types/openapi3-ts/dist/model/openapi31';
import { createHasteOperation } from './operation';
import { ZodOpenApiOperationObject } from 'zod-openapi/lib-types/create/document';
import { either, option, record } from 'fp-ts';
import { HasteOperation } from '../types';

export const requiresParameter =
  <L extends ParameterLocation>(where: L) =>
  <S extends ZodSchema, K extends string>(key: K, schema: S) =>
    createHasteOperation(
      {
        [where]: {
          [key]: schema,
        },
      } as {
        [l in L]: {
          [k in K]: S;
        };
      },
      (req) =>
        pipe(
          { [where]: { [key]: paramGetters[where](req, key) } },
          parseSafe(z.object({ [where]: z.object({ [key]: schema }) })),
          either.map((s) => Object.assign(req[locationRequestMapping[where]] || {}, s[where]))
        ),
      parameterEnhancer
    );

type ParamGetter = (req: Request, name: string) => unknown;

const getHeaderParam: ParamGetter = (req, name) =>
  pipe(req.headers, (v) => v[name], fromNullable(undefined), getOrElseW(identity));

const getQueryParam: ParamGetter = (req, name) =>
  pipe(req.query, (v) => v[name], fromNullable(undefined), getOrElseW(identity));
const getCookieParam: ParamGetter = (req, name) =>
  pipe(
    req.cookies,
    fromNullable(undefined),
    map((v) => v[name]),
    fromNullable(undefined),
    flatten,
    getOrElseW(identity)
  );

const getPathParam: ParamGetter = (req, name) =>
  pipe(req.params, (v) => v[name], fromNullable(undefined), getOrElseW(identity));

const paramGetters: Record<ParameterLocation, ParamGetter> = {
  path: getPathParam,
  cookie: getCookieParam,
  header: getHeaderParam,
  query: getQueryParam,
};

const locationRequestMapping: Record<ParameterLocation, keyof express.Request> = {
  path: 'params',
  cookie: 'cookies',
  header: 'headers',
  query: 'query',
};

function parameterEnhancer(
  this: HasteOperation,
  operation: ZodOpenApiOperationObject
): Partial<ZodOpenApiOperationObject> {
  return {
    requestParams: pipe(
      {
        path: mergeAndMap(this._effects.path, operation.requestParams?.path),
        cookie: mergeAndMap(this._effects.cookie, operation.requestParams?.cookie),
        header: mergeAndMap(this._effects.header, operation.requestParams?.header),
        query: mergeAndMap(this._effects.query, operation.requestParams?.query),
      },
      record.filterMap(option.fromNullable)
    ),
  };
}

const mergeAndMap = (
  newValue: Record<string, ZodType> | undefined,
  oldValue: AnyZodObject | undefined
) =>
  pipe(
    newValue,
    option.fromNullable,
    option.map((newSchema) =>
      pipe(
        oldValue,
        option.fromNullable,
        option.getOrElse(() => z.object({})),
        (oldSchema) => oldSchema.extend(newSchema)
      )
    ),
    option.getOrElseW(() => undefined)
  );
