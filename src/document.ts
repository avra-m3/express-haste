import { Express } from "express-serve-static-core";
import { createDocument, ZodOpenApiResponseObject } from "zod-openapi";
import { constant, pipe } from "fp-ts/function";
import { ZodOpenApiOperationObject, ZodOpenApiPathsObject } from "zod-openapi/lib-types/create/document";
import { Layer, Router } from "express";
import { filterMapWithIndex } from "fp-ts/Record";
import { match } from "fp-ts/boolean";
import * as O from "fp-ts/Option";
import { HasteOptionSchema, RFCResponseSchema, ZodIssueSchema } from "./schemas";
import { HasteOperation, HasteOptionType } from "./types";


export const document = (app: Express, options: HasteOptionType) => {
    const router: Router = app._router;
    const { appTitle, appVersion, openApiVersion } = HasteOptionSchema.parse(options);
    const documentation = {
        openapi: openApiVersion,
        info: {
            title: appTitle,
            version: appVersion,
        },

        paths: {}
    }
    router.stack.forEach((layer) => {
        addRouteToDocument(spec.paths as ZodOpenApiPathsObject, layer)
    })
    const spec = createDocument(documentation)
    app.get('/doc')
}

const addRouteToDocument = (paths: ZodOpenApiPathsObject, layer: Layer) => {
    const { path = "!all", methods } = layer.route
    paths[path] = pipe(methods, filterMapWithIndex(
        (method, value) => pipe(
            value,
            match(constant(O.none), () => O.some(getBaseOperation(method))),
            O.map(op => improveOperationFromLayer(layer, op))
        ),
    ))
}

const improveOperationFromLayer = (layer: Layer, operation: ZodOpenApiOperationObject) => {
    if (layer.route) {
        layer.route.stack.forEach(subOperation => improveOperationFromLayer(subOperation, operation))
    }
    if (isHasteOperation(layer.handle)) {
        Object.assign({}, operation, layer.handle.enhancer(operation))
    }
    return operation;
}

const isHasteOperation = (value: Function): value is HasteOperation => 'hastens' in value && value.hastens === true

const methodsWithoutBody = ['get', 'head', 'options']
const getBaseOperation = (method: string): ZodOpenApiOperationObject => {
    const operation = {
        responses: {
            400: BadRequest
        }
    }
    if (methodsWithoutBody.includes(method)) {
        return operation
    }
    return {
        ...operation,
        requestBody: {
            content: {
                'application/json': {}
            }
        }
    } as ZodOpenApiOperationObject
}

const BadRequest: ZodOpenApiResponseObject = {
    description: '400 BAD REQUEST',
    content: {
        'application/json': {
            schema: RFCResponseSchema.extend({
                issues: ZodIssueSchema.array()
            }),
        },
    },
    ref: '400-bad-request',
}
