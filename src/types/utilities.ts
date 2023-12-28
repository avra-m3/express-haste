import { HasteOperation } from './index';

export type MergeEvery<T> = T extends [HasteOperation<infer E>, ...infer Rest] ?
  DoMerge<E, MergeEvery<Rest>> : T extends [HasteOperation<infer E>] ? E : {};

// This used to be a lot cleaner, but it was slow and for some reason didn't
// work when I published the package /table-flip
type DoMerge<A, B> =
// Path
  (A extends { path: infer PA } ? B extends { path: infer PB } ? { path: PA & PB } : {
    path: PA
  } : B extends { path: infer PB } ? { path: PB } : {}) &
  // Query
  (A extends { query: infer PA } ? B extends { query: infer PB } ? { query: PA & PB } : {
    query: PA
  } : B extends { query: infer PB } ? { query: PB } : {}) &
  // Header
  (
    A extends { header: infer PA } ? B extends { header: infer PB } ? { header: PA & PB } : {
      header: PA
    } : B extends { header: infer PB } ? { header: PB } : {}
    ) &
  // Cookie
  (
    A extends { cookie: infer PA } ? B extends { cookie: infer PB } ? { cookie: PA & PB } : {
      cookie: PA
    } : B extends { cookie: infer PB } ? { cookie: PB } : {}) &
  // Response
  (
    A extends { response: infer PA  extends [...any] } ? B extends { response: infer PB extends [...any] } ? {
      response: [...PA, ...PB]
    } : A : B extends { response: any } ? B : {}) &
  (
    A extends { body: any } ? A : B extends { body: any } ? B : {})