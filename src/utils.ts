import { TypeOf, ZodError, ZodIssue, ZodSchema, ZodType } from 'zod';
import { constant, flow, identity, pipe } from 'fp-ts/function';
import * as E from 'fp-ts/Either';
import { Do, Either, right } from 'fp-ts/Either';
import { HasteBadRequestType, UnionToIntersection } from './types';
import { ZodIssueSchema } from './schemas';

export const parseSafe = <T extends ZodSchema>(
  schema: T
): ((v: T['_input'] | unknown) => Either<ZodError, TypeOf<T>>) =>
  flow(
    E.of<never, T['_input'] | unknown>,
    E.tryCatchK(
      E.map((b): TypeOf<T> => schema.parse(b)),
      flow(
        E.fromPredicate(
          (v): v is ZodError => v instanceof Error && 'issues' in v,
          (e) => new ZodError([{ message: `${e}`, path: [], code: 'custom' }])
        ),
        E.getOrElseW(identity)
      )
    ),
    E.flatten
  );

/**
 * Convert a ZodError object to an RFC 9457 compliant object
 * @param error {ZodError | {issues: ZodIssue[]}} A zod error or object containing a ZodIssue[].
 */
export const zodToRfcError = (error: { issues: ZodIssue[] }): HasteBadRequestType =>
  pipe(
    Do,
    E.bind('type', constant(right('about:blank'))),
    E.bind('title', constant(right('Bad request'))),
    E.bind('detail', constant(right('Request failed to validate'))),
    E.bind('issues', constant(decomposeZodIssues(error.issues))),
    E.getOrElse((e) => {
      console.warn(
        `parsed a zod issue failing type or property checks, please raise an issue in express-haste with the following error; ${e}`
      );
      return {
        type: 'about:blank',
        title: 'Bad request',
        detail: 'Request failed to validate',
        issues: [
          {
            type: 'about:blank',
            code: 'custom',
            path: [],
            message: 'No information available',
          },
        ],
      } as HasteBadRequestType;
    })
  );

const decomposeZodIssues = (issues: ZodIssue[]) =>
  pipe(
    issues.map((v) => ({ type: 'https://zod.dev/error_handling?id=zodissuecode', ...v })),
    parseSafe(ZodIssueSchema.array())
  );

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
export function mergeDeep<A, B extends Array<unknown>>(
  target: A,
  ...sources: B
): B extends Array<infer C> ? UnionToIntersection<C> & A : A {
  if (!sources.length) {
    return target as B extends Array<infer C> ? UnionToIntersection<C> & A : A;
  }
  const source = sources.shift();

  if (isObject(target) && isObject(source)) {
    for (const key in source) {
      let targetKey = target[key];
      const sourceKey = source[key];

      if (isObject(sourceKey) && !isZodType(sourceKey) && !isZodType(targetKey)) {
        if (!targetKey) {
          Object.assign(target, { [key]: {} });
          targetKey = target[key];
        }
        mergeDeep(targetKey as Record<string, unknown>, sourceKey as Record<string, unknown>);
      } else {
        if (Array.isArray(targetKey) && Array.isArray(sourceKey)) {
          Object.assign(target, { [key]: [...targetKey, ...sourceKey] });
        } else {
          Object.assign(target, { [key]: sourceKey });
        }
      }
    }
  }

  return mergeDeep(target, ...sources);
}

export const isZodType = (v: unknown): v is ZodType => isObject(v) && '_def' in v;
