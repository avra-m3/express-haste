import { HasteEffect, HasteOperation } from '../types';
import { ZodOpenApiOperationObject } from 'zod-openapi/lib-types/create/document';
import express, { Handler } from 'express';

export const createHasteOperation = (
  effects: HasteEffect,
  enhancer: HasteEnhancer
): HasteOperation =>
  Object.assign(
    function hasteOperation(req, res, next) {
      if()
    } as Handler,
    {
      _hastens: true,
      _enhancer: enhancer,
      _effects: effects,
    }
  );

type HasteEnhancer = (operation: ZodOpenApiOperationObject) => Partial<ZodOpenApiOperationObject>;
