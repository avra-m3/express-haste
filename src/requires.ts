import { ZodSchema } from "zod";
import { HasteOperation, HasteRequiresOperation, RequireLocations } from "./types";
import { Handler } from "express";
import { pipe } from "fp-ts/function";
import { parseSafe, zodToRfcError } from "./utils";
import { fold } from "fp-ts/lib/Either";

export function requires(schema: ZodSchema): HasteRequiresOperation {
    return Object.assign(
        ((req, res, next) => pipe(
            req.body,
            parseSafe(schema),
            fold(
                (e) => {
                    res.json(zodToRfcError(e)).status(400).send()
                },
                () => {
                    next();
                }
            )
        )) as Handler,
        {
            hastens: true,
            enhancer: getEnhancers(schema)["default"],
            in(v: RequireLocations) {
                this.enhancer = getEnhancers(schema)[v]
                return this as HasteRequiresOperation;
            },
        }
    )
}

const getEnhancers = (schema: ZodSchema): Record<RequireLocations, HasteOperation["enhancer"]> => ({
    default: (o) => ({
        parameters: [...(o?.parameters || []), schema]
    }),
    body: () => ({
        requestBody: {
            content: {
                'application/json': {
                    schema: schema,
                }
            }
        }
    }),
})