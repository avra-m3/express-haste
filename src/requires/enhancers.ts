import { HasteEffect, StatusCode } from '../types';
import { AnyZodObject, z, ZodType } from 'zod';
import { ZodOpenApiOperationObject } from 'zod-openapi/lib-types/create/document';
import { constant, pipe } from 'fp-ts/function';
import { array, option } from 'fp-ts';
import { ParameterLocation } from 'zod-openapi/lib-types/openapi3-ts/dist/model/openapi31';
import { ZodOpenApiResponseObject } from 'zod-openapi';
import { DEFAULT_CONTENT_TYPE } from '../constants';
import { isZodType, mergeDeep } from '../utils';

const bodyEnhancer: Enhancer = (effects: HasteEffect) =>
  pipe(
    effects.body,
    option.fromNullable,
    option.map((body) => ({
      requestBody: {
        content: {
          [body.config?.contentType || 'application/json']: {
            schema: body.schema,
          },
        },
      },
    })),
    option.getOrElse(constant({}))
  );

const parameterEnhancer =
  (location: ParameterLocation): Enhancer =>
  (effects, operation) =>
    pipe(
      ['query', 'path', 'header', 'cookie'] as ParameterLocation[],
      array.filterMap((key) =>
        pipe(
          effects[key],
          option.fromPredicate((v) => key === location && !!v),
          option.map((param) => ({
            [key]: mergeAndMap(param?.shape, operation.requestParams?.[key]),
          }))
        )
      ),
      array.reduce({}, (a, b) => ({ ...a, ...b })),
      (schema) => ({ requestParams: schema })
    );

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

const responseEnhancer: Enhancer = (effects, operation) =>
  pipe(
    effects.response,
    option.fromNullable,
    option.map(
      array.reduce(operation, (op, { status, config, schema }) =>
        pipe(
          getResponseFromOperation(status, config, op),
          option.fromNullable,
          option.map((existingSchema) => existingSchema.or(schema)),
          option.getOrElse(constant(schema)),
          (newSchema) => ({
            responses: {
              [status]: {
                description: config?.description,
                content: {
                  [config?.contentType || DEFAULT_CONTENT_TYPE]: {
                    schema: newSchema,
                  },
                },
              },
            },
          }),
          (spec) => mergeDeep(op, spec)
        )
      )
    ),
    option.getOrElse(constant({}))
  );

const getResponseFromOperation = (
  status: StatusCode,
  config: Record<string, string> | undefined,
  operation: ZodOpenApiOperationObject
) =>
  pipe(
    pipe(
      operation.responses?.[status],
      option.fromPredicate((v): v is ZodOpenApiResponseObject => !!v && 'content' in v),
      option.chain((statusConfig) =>
        option.fromNullable(statusConfig.content?.[config?.contentType || DEFAULT_CONTENT_TYPE])
      ),
      option.chain(({ schema }) => option.fromPredicate(isZodType)(schema)),
      option.getOrElseW(constant(undefined))
    )
  );

type Enhancer = (
  effects: HasteEffect,
  operation: ZodOpenApiOperationObject
) => Partial<ZodOpenApiOperationObject>;
export const enhancerMapping: Record<keyof HasteEffect, Enhancer> = {
  body: bodyEnhancer,
  response: responseEnhancer,
  query: parameterEnhancer('query'),
  path: parameterEnhancer('path'),
  header: parameterEnhancer('header'),
  cookie: parameterEnhancer('cookie'),
};

export const enhanceAll = (
  effect: HasteEffect,
  operation: ZodOpenApiOperationObject
): Partial<ZodOpenApiOperationObject> =>
  pipe(
    Object.keys(effect) as (keyof HasteEffect)[],
    array.reduce({}, (result, key) => mergeDeep(result, enhancerMapping[key](effect, operation)))
  );
