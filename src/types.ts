import { Handler } from "express";
import { ZodOpenApiOperationObject } from "zod-openapi/lib-types/create/document";
import { z } from "zod";
import { HasteBadRequestSchema, HasteOptionSchema } from "./schemas";

export interface HasteOperation extends Handler {
    hastens: boolean,
    enhancer: (operation: ZodOpenApiOperationObject) => Partial<ZodOpenApiOperationObject>
}

export interface HasteRequiresOperation extends HasteOperation {
    in: (where: RequireLocations) => HasteRequiresOperation
}

export type RequireLocations = 'body' | 'default';

export type HasteOptionType = (typeof HasteOptionSchema['_input'])

export type HasteBadRequestType = z.infer<typeof HasteBadRequestSchema>