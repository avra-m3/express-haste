import { constant, identity, pipe } from 'fp-ts/function';
import { array, option, record } from 'fp-ts';
import { HasteEffect, Requires, RequiresProp } from '../types';
import { mergeDeep } from '../utils';
import { AllPathsKey, HasteRequirementMap } from './types';
import express, { Layer } from 'express';
import { Option } from 'fp-ts/Option';
import { not } from 'fp-ts/Predicate';

const isHasteOperation = (value: express.Handler): value is Requires<HasteEffect> =>
  !!value && '_hastens' in value && value._hastens === true;

export const extractLayerPaths = (layer: Layer): HasteRequirementMap =>
  pipe(
    layer.route,
    getRouteOrNone,
    option.map(({ path, methods }) => ({
      [path]: pipe(interrogateLayerMethods(layer, path, methods), (layerResult) =>
        pipe(
          interrogateLayerChildren(layer, path, methods),
          option.fromPredicate(not(record.isEmpty)),
          option.map((v) => mergeDeep(option.getOrElse(constant({}))(layerResult), v)),
          option.orElse(() => layerResult)
        )
      ),
    })),
    option.map(record.filterMap(identity)),
    option.getOrElse(constant({}))
  );

const getRouteOrNone = (route: Layer['route']) =>
  pipe(
    route,
    option.fromPredicate((r): r is NonNullable<typeof r> => !!r && (!!r.methods || !!r.path)),
    option.orElse(
      constant(
        option.some({
          path: AllPathsKey,
          methods: { use: true } as Record<string, boolean>,
        })
      )
    ),
    option.chain(option.fromPredicate(routeIsValid))
  );

const routeIsValid = (
  route: Pick<NonNullable<Layer['route']>, 'path' | 'methods'>
): route is RequiresProp<typeof route, 'path' | 'methods'> => !!route.path && !!route.methods;

const interrogateLayerMethods = (
  layer: Layer,
  _path: string,
  methods: Record<string, boolean>
): Option<Record<string, Requires<HasteEffect>[]>> =>
  pipe(
    layer.handle,
    option.fromPredicate(isHasteOperation),
    option.map((operation) =>
      pipe(methods, record.filter(identity), record.map(constant([operation])))
    )
  );
const interrogateLayerChildren = (
  layer: Layer,
  path: string,
  methods: Record<string, boolean>
): HasteRequirementMap[string] =>
  pipe(
    layer,
    option.fromPredicate((layer): layer is RequiresProp<typeof layer, 'route'> => !!layer.route),
    option.map((layer) => layer.route.stack),
    option.chain(option.fromNullable),
    option.map(array.filterMap((subLayer) => interrogateLayerMethods(subLayer, path, methods))),
    option.fold(constant({}), array.reduce({}, mergeDeep))
  );
