import { ZodOpenApiOperationObject } from 'zod-openapi/lib-types/create/document';
import express, { Handler } from 'express';
import { Either } from 'fp-ts/Either';
import { ZodError } from 'zod';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export interface HasteOperation<Effects = any> extends Handler {
  _hastens: boolean;
  _enhancer: HasteEnhancer;
  _effects: Effects;
  _validator: HasteValidator;
}

export type HasteEnhancer = (
  operation: ZodOpenApiOperationObject
) => Partial<ZodOpenApiOperationObject>;
export type HasteValidator = <H extends HasteOperation>(
  this: H,
  req: express.Request
) => Either<ZodError, unknown>;
