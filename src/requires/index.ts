import { ZodSchema } from "zod";
import { HasteRequiresOperation, RequireLocations } from "../types";
import { requiresParameter } from "./requiresParameter";
import { bodyRequires } from "./requiresBody";

export function requires(schema: ZodSchema): HasteRequiresOperation {
    return requiresParameter(schema)
}


export const changeHandler = (schema: ZodSchema) => (where: RequireLocations) => handleMapping[where](schema)

const handleMapping: Record<RequireLocations, (schema: ZodSchema) => HasteRequiresOperation> = {
    default: requiresParameter,
    parameter: requiresParameter,
    body: bodyRequires
}