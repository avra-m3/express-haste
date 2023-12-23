import { HasteOperation } from '../requires';
import { HasteEffect } from './index';

export type MergeEffects<T> = T extends [HasteOperation<infer Effect1>, ...infer Rest]
    ? MergeTwoEffect<Effect1, MergeEffects<Rest>>
    : {};

export type MergeTwoEffect<A extends HasteEffect, B extends HasteEffect> = MergeResponse<A, B> &
  MergeABKey<'path', A, B> &
  MergeABKey<'query', A, B> &
  MergeABKey<'header', A, B> &
  MergeABKey<'cookie', A, B> & MergeBody<A, B>;

type MergeBody<A extends HasteEffect, B extends HasteEffect> = A['body'] extends Required<
  A['body']
>
  ? B['body'] extends Required<B['body']>
    ? {
        body: B["body"];
      }
    : { response: A["body"] }
  : B['body'] extends NonNullable<infer PB>
    ? { response: B['body'] }
    : {};
type MergeResponse<A extends HasteEffect, B extends HasteEffect> = A['response'] extends Required<
  A['response']
>
  ? B['response'] extends Required<B['response']>
    ? {
        response: [...A['response'], ...B['response']];
      }
    : { response: A['response'] }
  : B['response'] extends NonNullable<infer PB>
    ? { response: B['response'] }
    : {};

type MergeABKey<
  K extends keyof HasteEffect,
  A extends HasteEffect,
  B extends HasteEffect,
> = A[K] extends NonNullable<infer PA>
  ? B[K] extends NonNullable<infer PB>
    ? {
        [k in K]: SpreadTwo<PA, PB>;
      }
    : { [k in K]: PA }
  : B[K] extends NonNullable<infer PB>
    ? { [k in K]: PB }
    : {};

type OptionalPropertyNames<T> = {
  [K in keyof T]-?: {} extends { [P in K]: T[K] } ? K : never;
}[keyof T];

type SpreadProperties<L, R, K extends keyof L & keyof R> = {
  [P in K]: L[P] | Exclude<R[P], undefined>;
};

type Id<T> = T extends infer U ? { [K in keyof U]: U[K] } : never;

type SpreadTwo<L, R> = Id<
  Pick<L, Exclude<keyof L, keyof R>> &
    Pick<R, Exclude<keyof R, OptionalPropertyNames<R>>> &
    Pick<R, Exclude<OptionalPropertyNames<R>, keyof L>> &
    SpreadProperties<L, R, OptionalPropertyNames<R> & keyof L>
>;
