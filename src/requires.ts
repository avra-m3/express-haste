import { ZodSchema } from "zod";
import { HasteRequiresOperation } from "./types";
import { Handler } from "express";
import { ZodOpenApiOperationObject } from "zod-openapi/lib-types/create/document";
import { flow, pipe } from "fp-ts/function";

export function requires(schema: ZodSchema): HasteRequiresOperation{
    const HasteRequires: HasteRequiresOperation = Object.assign(
        ((req, res, n) => pipe(
            req.body,


        )) as Handler,
        {
            hastens: true,
            enhancer: (o: ZodOpenApiOperationObject) => o,
            in: (v: string) => HasteRequires,
        }
    )
    return HasteRequires
}