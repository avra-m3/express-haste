import { TypeOf, ZodError, ZodSchema } from "zod";
import { constant, flow, identity, pipe } from "fp-ts/function";
import * as E from "fp-ts/Either"
import { Do, Either, right } from "fp-ts/Either"
import { HasteBadRequestType } from "./types";
import { ZodIssueSchema } from "./schemas";

E.getOrElse(identity)
export const parseSafe = <T extends ZodSchema>(schema: T): (v: T["_input"]) => Either<ZodError, TypeOf<T>> => flow(
    E.of<never, T["_input"]>,
    E.tryCatchK(
        E.map((b): TypeOf<T> => schema.parse(b)),
        flow(
            E.fromPredicate(
                (v): v is ZodError => v instanceof ZodError,
                () => new ZodError([])
            ),
            E.getOrElseW(identity),
        )
    ),
)

export const zodToRfcError = (error: ZodError): HasteBadRequestType => pipe(
    Do,
    E.bind('type', constant(right('about:blank'))),
    E.bind('title', constant(right('Bad request'))),
    E.bind('detail', constant(right('Request failed to validate'))),
    E.bind('issues', () => right(error.issues.map(issue => ZodIssueSchema.parse(issue)))),
    E.getOrElse(() => ({}) as HasteBadRequestType)
)

/**
 * Simple object check.
 * @param item
 * @returns {boolean}
 */
export function isObject(item: unknown): item is Record<string, unknown> {
    return !!(item && typeof item === 'object' && !Array.isArray(item));
}

/**
 * Deep merge two objects.
 * @param target
 * @param sources
 */
export function mergeDeep(target: Record<string, unknown> | object, ...sources: (Record<string, unknown> | object)[]) {
    if (!sources.length) return target;
    const source = sources.shift();

    if (isObject(target) && isObject(source)) {
        for (const key in source) {
            if (isObject(source[key]) && !(source[key] instanceof ZodSchema) && !(target[key] instanceof ZodSchema)) {
                if (!target[key]) Object.assign(target, { [key]: {} });
                mergeDeep(target[key] as Record<string, unknown>, source[key] as Record<string, unknown>);
            } else {
                Object.assign(target, { [key]: source[key] });
            }
        }
    }

    return mergeDeep(target, ...sources);
}