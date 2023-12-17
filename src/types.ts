import { Handler } from "express";
import { ZodOpenApiOperationObject } from "zod-openapi/lib-types/create/document";
import { z } from "zod";
import { HasteOptionSchema } from "./schemas";

export interface HasteOperation extends Handler {
    hastens: boolean,
    enhancer: (operation: ZodOpenApiOperationObject) => ZodOpenApiOperationObject
}

export interface HasteRequiresOperation extends HasteOperation {
    in: (where: string) => HasteRequiresOperation
}

// I'm sure there is a better way to do this (like not using zod to validate the options) but meh, this is fine for MVP.
type optionalOptionKeys = 'openApiVersion' | 'docPath'

export type HasteOptionType =
    Omit<z.infer<typeof HasteOptionSchema>, optionalOptionKeys>
    & Pick<Partial<z.infer<typeof HasteOptionSchema>>, optionalOptionKeys>