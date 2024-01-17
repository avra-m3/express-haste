import { HasteOperation } from './index';

export type MergeEvery<T> = T extends [HasteOperation<infer E>, ...infer Rest]
  ? DoMerge<E, MergeEvery<Rest>>
  : T extends [HasteOperation<infer E>]
    ? E
    : Record<string, never>;

// This used to be a lot cleaner, but it was slow and for some reason didn't
// work when I published the package /table-flip
type DoMerge<A, B> =
  // Path
  (A extends { path: infer PA }
    ? B extends { path: infer PB }
      ? { path: PA & PB }
      : {
          path: PA;
        }
    : B extends { path: infer PB }
      ? { path: PB }
      : Record<string, never>) &
    // Query
    (A extends { query: infer PA }
      ? B extends { query: infer PB }
        ? { query: PA & PB }
        : {
            query: PA;
          }
      : B extends { query: infer PB }
        ? { query: PB }
        : Record<string, never>) &
    // Header
    (A extends { header: infer PA }
      ? B extends { header: infer PB }
        ? { header: PA & PB }
        : {
            header: PA;
          }
      : B extends { header: infer PB }
        ? { header: PB }
        : Record<string, never>) &
    // Cookie
    (A extends { cookie: infer PA }
      ? B extends { cookie: infer PB }
        ? { cookie: PA & PB }
        : {
            cookie: PA;
          }
      : B extends { cookie: infer PB }
        ? { cookie: PB }
        : Record<string, never>) &
    // Response
    (A extends { response: infer PA extends [...object[]] }
      ? B extends { response: infer PB extends [...object[]] }
        ? {
            response: [...PA, ...PB];
          }
        : A
      : B extends { response: Array<object> }
        ? B
        : Record<string, never>) &
    (A extends { body: object } ? A : B extends { body: object } ? B : Record<string, never>);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type UnionToIntersection<U> = (U extends any ? (x: U) => void : never) extends (
  x: infer I
) => void
  ? I
  : never;

export type ParseInt<T> = T extends `${infer N extends number}` ? N : never;
export type RequiresProp<T, K extends keyof T> = Omit<T, K> & Required<Pick<T, K>>;
