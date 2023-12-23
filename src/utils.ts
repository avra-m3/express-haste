import { TypeOf, ZodError, ZodIssue, ZodSchema } from 'zod';
import { constant, flow, identity, pipe } from 'fp-ts/function';
import * as E from 'fp-ts/Either';
import { Do, Either, right } from 'fp-ts/Either';
import { HasteBadRequestType } from './types';
import { ZodIssueSchema } from './schemas';

E.getOrElse(identity);
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

export const zodToRfcError = (error: { issues: ZodIssue[] }): HasteBadRequestType =>
  pipe(
    Do,
    E.bind('type', constant(right('about:blank'))),
    E.bind('title', constant(right('Bad request'))),
    E.bind('detail', constant(right('Request failed to validate'))),
    E.bind('issues', () => right(error.issues.map((issue) => ZodIssueSchema.parse(issue)))),
    E.getOrElse(() => ({}) as HasteBadRequestType)
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
export function mergeDeep<A, B extends Array<any>>(
  target: A,
  ...sources: B
): B extends Array<infer C> ? C & A : A {
  if (!sources.length) {
    return target as A & B[0];
  }
  const source = sources.shift();
  

  if (isObject(target) && isObject(source)) {
    for (const key in source) {
      let targetKey = target[key];
      let sourceKey = source[key];
      
      if (isObject(sourceKey) && !isZodType(sourceKey) && !isZodType(targetKey)) {
        if (!targetKey) {
          Object.assign(target, { [key]: {} });
          targetKey = target[key]
        }
        mergeDeep(targetKey as Record<string, unknown>, sourceKey as Record<string, unknown>);
      } else {
        if(Array.isArray(targetKey) && Array.isArray(sourceKey)){
          Object.assign(target, {[key]: [...targetKey, ...sourceKey]})
        }else{
          Object.assign(target, { [key]: sourceKey });
        }
      }
    }
  }

  return mergeDeep(target, ...sources);
}

export const isZodType = (v: unknown): v is ZodSchema => isObject(v) && '_def' in v;
