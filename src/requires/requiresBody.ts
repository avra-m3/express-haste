import { ZodSchema } from "zod";
import { HasteRequiresOperation } from "../types";
import { Handler } from "express";
import { pipe } from "fp-ts/function";
import { parseSafe, zodToRfcError } from "../utils";
import { fold } from "fp-ts/Either";
import { changeHandler } from "./index";

export const bodyRequires = (schema: ZodSchema): HasteRequiresOperation => Object.assign(
    bodyHandler(schema),
    {
        _hastens: true,
        _enhancer: bodyEnhancer(schema),
        in: changeHandler(schema)
    }
)

    const bodyHandler = (schema: ZodSchema): Handler => async (req, res, next) => pipe(
        req.body,
        parseSafe(schema),
        fold(
            (e) => {
                res.status(400).json(zodToRfcError(e)).send()
            },
            (v) => {
                req.body = v
                next();
            }
        )
    )
const bodyEnhancer = (schema: ZodSchema) => () => ({
    requestBody: {
        content: {
            'application/json': {
                schema,
            }
        }
    }
})