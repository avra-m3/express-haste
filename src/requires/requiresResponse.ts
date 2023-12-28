import { ZodSchema, ZodType } from 'zod';
import { constant, pipe } from 'fp-ts/function';
import { createHasteOperation } from './operation';
import { ZodOpenApiOperationObject } from 'zod-openapi/lib-types/create/document';
import { either, option } from 'fp-ts';
import { ZodOpenApiResponseObject } from 'zod-openapi';
import { HasteOperation, StatusCode } from '../types';

type ResponseOptions = {
  description?: string;
};
export const requiresResponse = <Status extends StatusCode, Schema extends ZodType>(
  status: Status,
  schema: Schema,
  options?: ResponseOptions,
): HasteOperation<{ response: [{ status: Status; schema: Schema }] }> =>
  createHasteOperation(
    {
      response: [
        {
          status,
          schema,
        },
      ] as [{ status: Status; schema: Schema }],
    },
    constant(either.right(true)),
    responseEnhancer(status, schema, options),
  );

const responseEnhancer = <S extends `${ 1 | 2 | 3 | 4 | 5 }${ string }`>(
  status: S,
  schema: ZodSchema,
  options?: ResponseOptions,
) =>
  function responseEnhancer(
    operation: ZodOpenApiOperationObject,
  ): Partial<ZodOpenApiOperationObject> {
    return pipe(
      operation.responses,
      option.fromNullable,
      option.map((response) =>
        option.fromNullable(
          (response[status] as ZodOpenApiResponseObject)?.content?.['application/json']?.schema as
            | ZodType
            | undefined,
        ),
      ),
      option.flatten,
      option.getOrElseW(() => undefined),
      (oldSchema): Partial<ZodOpenApiOperationObject> => ({
        responses: {
          [status]: {
            description: options?.description,
            content: {
              'application/json': {
                schema: oldSchema ? oldSchema.or(schema) : schema,
              },
            },
          },
        } as Record<S, ZodOpenApiResponseObject>,
      }),
    );
  };
