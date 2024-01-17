import { InfoObject } from 'zod-openapi/lib-types/openapi3-ts/dist/model/openapi31';
import {
  ComponentsObject,
  SecuritySchemeObject,
} from 'zod-openapi/lib-types/openapi3-ts/dist/model/openapi30';
import { createDocument, ZodOpenApiObject } from 'zod-openapi';
import { HasteEffect, Requires } from '../types';

export interface HasteDocument {
  /**
   * Add information to the open api spec including title, version and more.
   * @param info {InfoObject} The information to include.
   */
  info: (info: InfoObject) => HasteDocument;
  /**
   * Apply a security scheme to all requests in this document, to apply to a single request, see requires().auth()
   * @param scheme
   */
  auth: (name: string, scheme: SecuritySchemeObject) => HasteDocument;
  /**
   * A catch-all allowing you to manually define components, this is an escape hatch and is not recommended.
   * @param component {ComponentsObject}
   */
  component: (component: ComponentsObject) => HasteDocument;
  /**
   * Create and return the final json OpenApi specification object.
   */
  spec: () => ReturnType<typeof createDocument>;

  _spec: ZodOpenApiObject;
}

export const AllPathsKey = '!all';
export type HasteRequirementMap = { [p: string]: Record<string, Requires<HasteEffect>[]> };
