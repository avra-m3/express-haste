import { HasteEffect } from '../types';
import { ZodOpenApiOperationObject } from 'zod-openapi/lib-types/create/document';
import express, { Handler } from 'express';
import { Either, fold } from 'fp-ts/Either';
import { ZodError } from 'zod';
import { pipe } from 'fp-ts/function';
import { zodToRfcError } from '../utils';

export interface HasteOperation<Effects extends HasteEffect> extends Handler {
  _hastens: boolean;
  _enhancer: HasteEnhancer;
  _effects: Effects;
  _validator: HasteValidator;
}

export const createHasteOperation = <E extends HasteEffect>(
  effects: E,
  validator: HasteValidator,
  enhancer: HasteEnhancer
): HasteOperation<E> => {
  const Operation: Omit<HasteOperation<E>, '()'> = {
    _hastens: true,
    _enhancer: enhancer,
    _validator: validator,
    _effects: effects,
  };

  return Object.assign(
    (<Handler>function (this: HasteOperation<E>, req, res, next) {
      pipe(
        req,
        this._validator,
        fold(
          (e) => {
            res.status(400).json(zodToRfcError(e)).send();
          },
          () => {
            next();
          }
        )
      );
    }).bind(Operation),
    Operation
  );
};

export type HasteEnhancer = (
  operation: ZodOpenApiOperationObject
) => Partial<ZodOpenApiOperationObject>;
export type HasteValidator = <H extends HasteOperation<any>>(
  this: H,
  req: express.Request
) => Either<ZodError, unknown>;
