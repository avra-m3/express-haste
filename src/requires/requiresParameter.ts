import { z, ZodSchema } from 'zod';
import { HasteOperation, HasteRequiresOperation } from '../types';
import { Handler, Request } from 'express';
import { changeHandler } from './index';
import { identity, pipe } from 'fp-ts/function';
import { parseSafe, zodToRfcError } from '../utils';
import { flatten, fold, fromNullable, getOrElseW, map } from 'fp-ts/Either';
import { ParameterLocation } from 'zod-openapi/lib-types/openapi3-ts/dist/model/openapi31';
import * as S from 'fp-ts-std/Struct';

export const requiresParameter = (schema: ZodSchema): HasteRequiresOperation =>
  Object.assign(parameterHandler(schema), {
    _hastens: true,
    _enhancer: parameterEnhancer(schema),
    in: changeHandler(schema),
  });

const RequiredOpenapiSchema = z.object({
    param: z.object({
        in: z.enum(['path', 'header', 'cookie', 'query'] as const),
        name: z.string()
    })
})
const parameterHandler = (schema: ZodSchema): Handler => {
    return function hasteParamHandler(req, res, next) {
        const { param } = pipe(schema?._def?.openapi, parseSafe(RequiredOpenapiSchema), getOrElseW((e) => {
            throw e
        }))
        return pipe(
            { [param.in]: { [param.name]: paramGetters[param.in](req, param.name) } },
            parseSafe(z.object({ [param.in]: z.object({ [param.name]: schema }) })),
            fold(
                (e) => {
                    res.status(400).json(zodToRfcError(e)).send()
                },
                (v) => {
                    req.body = v
                    next();
                }
            )
        )
    }
};

type ParamGetter = (req: Request, name: string) => unknown;

const getHeaderParam: ParamGetter = (req, name) => pipe(
    req.headers,
    S.get(name),
    fromNullable(undefined),
    getOrElseW(
        identity,
    )
)

const getQueryParam: ParamGetter = (req, name) => pipe(
    req.query,
    S.get(name),
    fromNullable(undefined),
    getOrElseW(
        identity,
    )
)
const getCookieParam: ParamGetter = (req, name) => pipe(
    req.cookies,
    fromNullable(undefined),
    map(S.get(name)),
    fromNullable(undefined),
    flatten,
    getOrElseW(
        identity,
    )
)

const getPathParam: ParamGetter = (req, name) => pipe(
    req.params,
    S.get(name),
    fromNullable(undefined),
    getOrElseW(
        identity,
    )
)


const paramGetters: Record<ParameterLocation, ParamGetter> = {
    path: getPathParam,
    cookie: getCookieParam,
    header: getHeaderParam,
    query: getQueryParam
}

const parameterEnhancer = (schema: ZodSchema): HasteOperation["_enhancer"] => (o) => ({
    parameters: [...(o?.parameters || []), schema]
})