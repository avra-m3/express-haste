import { HasteEffect, HasteEnhancer, HasteOperation, HasteValidator } from '../types';
import { Handler } from 'express';
import { fold } from 'fp-ts/Either';
import { pipe } from 'fp-ts/function';
import { zodToRfcError } from '../utils';

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
            res
              .status(400)
              .contentType('application/problem+validation+json')
              .json(zodToRfcError(e))
              .send();
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
