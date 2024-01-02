import { Express } from 'express-serve-static-core';
import { createDocument, ZodOpenApiResponseObject } from 'zod-openapi';
import { constant, pipe } from 'fp-ts/function';
import {
  ZodOpenApiOperationObject,
  ZodOpenApiPathsObject,
} from 'zod-openapi/lib-types/create/document';
import express, { Layer, Router } from 'express';
import { match } from 'fp-ts/boolean';
import * as O from 'fp-ts/Option';
import { HasteBadRequestSchema, HasteOptionSchema } from './schemas';
import { HasteOperation, HasteOptionType } from './types';
import { mergeDeep } from './utils';
import { record } from 'fp-ts';

const AllPathsKey = '!all';

export const document = (app: Express, options: HasteOptionType) => {
  const router: Router = app._router;
  const { info, openApiVersion } = HasteOptionSchema.parse(options);
  const specification = {
    openapi: openApiVersion,
    info,
    paths: {} as ZodOpenApiPathsObject,
  };
  specification.paths = router.stack.reduce(
    (newPaths, layer) => addRouteToDocument(newPaths, layer),
    specification.paths
  );
  delete specification.paths[AllPathsKey];
  return createDocument(specification);
};

export const addRouteToDocument = (paths: ZodOpenApiPathsObject, layer: Layer) => {
  const { path, methods } = layer.route || {
    path: AllPathsKey,
    methods: { use: true } as Record<string, boolean>,
  };

  if (!path || !methods) {
    return paths;
  }

  return Object.assign({}, paths, {
    [path]: pipe(
      methods,
      record.filterMap((value) =>
        pipe(
          value,
          match(constant(O.none), () =>
            O.some({
              responses: {
                400: BadRequest,
              },
            })
          ),
          O.map((op) => mergeDeep(op, paths?.[AllPathsKey]?.['use' as 'get'] || {})),
          O.map((op) => mergeDeep(op, paths?.[path]?.['use' as 'get'] || {})),
          O.map((op) => improveOperationFromLayer(layer, op))
        )
      ),
      (result) => mergeDeep({}, paths[path] || {}, result)
    ),
  });
};

const improveOperationFromLayer = (layer: Layer, operation: ZodOpenApiOperationObject) => {
  if (layer.route) {
    layer.route.stack.forEach(
      (subOperation: Layer) => (operation = improveOperationFromLayer(subOperation, operation))
    );
  }
  if (isHasteOperation(layer.handle)) {
    return mergeDeep({}, operation, layer.handle._enhancer(operation));
  }
  return Object.assign({}, operation);
};

export const isHasteOperation = (value: express.Handler): value is HasteOperation =>
  !!value && '_hastens' in value && value._hastens === true;

export const BadRequest: ZodOpenApiResponseObject = Object.freeze({
  description: '400 BAD REQUEST',
  content: {
    'application/problem+validation+json': {
      schema: HasteBadRequestSchema,
    },
  },
  ref: '400-bad-request',
});
