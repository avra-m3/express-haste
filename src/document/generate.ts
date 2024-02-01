import {
  ZodOpenApiPathItemObject,
  ZodOpenApiPathsObject,
} from 'zod-openapi/lib-types/create/document';
import { constant, flow, pipe } from 'fp-ts/function';
import { array, option, record, tuple } from 'fp-ts';
import { mergeDeep } from '../utils';
import { AllPathsKey, HasteRequirementMap } from './types';
import { ZodOpenApiComponentsObject } from 'zod-openapi';
import { not } from 'fp-ts/Predicate';

export const generatePathsFromOperations = (
  spec: ZodOpenApiPathsObject,
  operations: HasteRequirementMap
) =>
  pipe(
    operations,
    record.filterMapWithIndex((path, v) =>
      pipe(
        v,
        record.mapWithIndex((method, values) =>
          pipe(
            values,
            array.reduce({}, (result, requirements) =>
              pipe(
                requirements._enhancer(
                  spec?.[path]?.[method as keyof ZodOpenApiPathItemObject] || {}
                ),
                (enhancement) =>
                  mergeDeep(result, spec?.[path]?.[method as 'get'] || {}, enhancement)
              )
            )
          )
        ),
        option.fromPredicate(not(record.isEmpty))
      )
    ),
    (paths) =>
      pipe(
        paths,
        (p) => popAndMergeOnOtherKeys(AllPathsKey)(p),
        record.map((methods) => popAndMergeOnOtherKeys('use')(methods))
      )
  );

const popAndMergeOnOtherKeys =
  (key: string) =>
  <V>(value: Record<string, V>): Record<string, V> =>
    pipe(
      value,
      record.pop(key),
      option.fold(constant(value), (result) =>
        pipe(
          result,
          tuple.snd,
          record.map((v) => mergeDeep(v, tuple.fst(result)) as V)
        )
      )
    );

export const generateComponentsFromOperations = (
  components: ZodOpenApiComponentsObject,
  operations: HasteRequirementMap
) =>
  pipe(
    operations,
    getRecordValues,
    array.map(getRecordValues),
    array.flatten,
    array.map(array.map((operation) => operation._components(components))),
    array.flatten,
    array.reduce(components, mergeDeep)
  );

const getRecordValues = flow(record.toArray, array.map(tuple.snd));
