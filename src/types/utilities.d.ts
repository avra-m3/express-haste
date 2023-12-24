import { HasteOperation } from '../requires';
import { HasteEffect, HasteResponseEffect } from "./index";

export type ME<T> = T extends [HasteOperation<infer Effect1>, ...infer Rest]
  ? M2E<Effect1, ME<Rest>>
  : {};

export type M2E<A, B> = MR<A, B> &
  MB<A, B> &
  MAB<'path', A, B> &
  MAB<'query', A, B> &
  MAB<'header', A, B> &
  MAB<'cookie', A, B>;

type MB<A, B> = B extends { body: infer VB }
  ? {
      body: VB;
    }
  : A extends { body: infer VA }
    ? {
        body: VA;
      }
    : {};

type MR<A, B> = A extends { response: infer VA extends [HasteResponseEffect]  }
  ? B extends { response: infer VB extends [HasteResponseEffect]}
    ? {
        response: [...VA, ...VB];
      }
    : { response: VA }
  :  B extends { response: infer VB extends HasteResponseEffect[]}
    ? { response: VB }
    : {};

type MAB<K extends keyof HasteEffect, A, B> = A extends { [k in K]: infer VA }
  ? B extends { [k in K]: infer VB }
    ? {
        [k in K]: SpreadTwo<VA, VB>;
      }
    : { [k in K]: VA }
  : B extends { [k in K]: infer VB }
    ? { [k in K]: VB }
    : {};

type OptionalPropertyNames<T> = {
  [K in keyof T]-?: {} extends { [P in K]: T[K] } ? K : never;
}[keyof T];

type SpreadProperties<L, R, K extends keyof L & keyof R> = {
  [P in K]: L[P] | Exclude<R[P], undefined>;
};

type Id<T> = T extends infer U ? { [K in keyof U]: U[K] } : never;

export type SpreadTwo<L, R> = Id<
  Pick<L, Exclude<keyof L, keyof R>> &
    Pick<R, Exclude<keyof R, OptionalPropertyNames<R>>> &
    Pick<R, Exclude<OptionalPropertyNames<R>, keyof L>> &
    SpreadProperties<L, R, OptionalPropertyNames<R> & keyof L>
>;
