import { Express } from 'express-serve-static-core';
import { mergeDeep } from '../utils';
import { createDocument, ZodOpenApiComponentsObject } from 'zod-openapi';
import { HasteDocument, HasteRequirementMap } from './types';
import { pipe } from 'fp-ts/function';
import express, { Router } from 'express';
import { array } from 'fp-ts';
import { ZodOpenApiPathsObject } from 'zod-openapi/lib-types/create/document';
import { extractLayerPaths } from './extractors';
import { generateComponentsFromOperations, generatePathsFromOperations } from './generate';

export { HasteDocument } from './types';
export const document = (
  app: Express,
  openApiVersion: '3.1.0' | '3.0.0' | '3.0.1' | '3.0.2' | '3.0.3' = '3.1.0'
) => {
  const requirements = getStackRequirements(app);
  return {
    info(info) {
      Object.assign(this._spec.info, info);
      return this;
    },
    auth(name, scheme) {
      this.component({
        securitySchemes: {
          [name]: scheme,
        },
      });
      if (this._spec.security) {
        this._spec.security.push({ [name]: [] });
      }
      return this;
    },

    component(component) {
      mergeDeep(this._spec.components, component);
      return this;
    },
    spec() {
      return createDocument(this._spec);
    },
    _spec: {
      openapi: openApiVersion,
      info: {
        title: 'Example Title',
        version: '0.0.0',
      },
      security: [],
      paths: generatePathsFromOperations({} as ZodOpenApiPathsObject, requirements),
      components: generateComponentsFromOperations({} as ZodOpenApiComponentsObject, requirements),
    },
  } satisfies HasteDocument;
};

const getStackRequirements = (app: express.Application) =>
  pipe(
    (app._router as Router).stack,
    array.map(extractLayerPaths),
    array.reduce({} as HasteRequirementMap, mergeDeep)
  );
