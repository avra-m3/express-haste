import { extractLayerPaths } from './extractors';
import { Layer } from 'express';

describe('extractLayerPaths', () => {
  const makeLayer = (handler: unknown, path: string, method: string) =>
    ({
      route: { path, methods: { [method]: true } },
      handle: handler,
    }) as unknown as Layer;

  it('should return an empty object when no routes', () => {
    expect(extractLayerPaths({} as Layer)).toEqual({});
  });
  it('should return an empty object when route is missing methods', () => {
    expect(
      extractLayerPaths({ route: { path: '/test', methods: undefined } } as unknown as Layer)
    ).toEqual({});
  });
  it('should return an empty object when route is missing methods', () => {
    expect(
      extractLayerPaths({ route: { path: undefined, methods: { get: true } } } as unknown as Layer)
    ).toEqual({});
  });

  it('should return the operations attached to the route handler', () => {
    const op = { _enhancer: jest.fn(), _hastens: true };
    op._enhancer.mockReturnValue({ test: 'value' });
    expect(
      extractLayerPaths({
        route: { path: '/test', methods: { get: true } },
        handle: op,
      } as unknown as Layer)
    ).toEqual({
      '/test': { get: [op] },
    });
  });
  it('should return operations for all methods attached to the route handler', () => {
    const op = { _enhancer: jest.fn(), _hastens: true };
    op._enhancer.mockReturnValue({ test: 'value' });
    expect(
      extractLayerPaths({
        route: { path: '/test', methods: { get: true, post: true, put: false } },
        handle: op,
      } as unknown as Layer)
    ).toEqual({
      '/test': { get: [op], post: [op] },
    });
  });
  it('should return operations attached to the route.stack[]', () => {
    const op1 = { _enhancer: jest.fn(), _hastens: true };
    const op2 = { _enhancer: jest.fn(), _hastens: true };
    const root = {
      route: {
        path: '/test',
        methods: { get: true },
        stack: [makeLayer(op1, '/test1', 'get'), makeLayer(op2, '/test2', 'get')],
      },
    };
    expect(extractLayerPaths(root as unknown as Layer)).toEqual({
      '/test': { get: [op1, op2] },
    });
  });
  it('should merge operations attached to the handler route.stack[]', () => {
    const op1 = { _enhancer: jest.fn(), _hastens: true };
    const op2 = { _enhancer: jest.fn(), _hastens: true };
    const op3 = { _enhancer: jest.fn(), _hastens: true };
    const root = {
      handle: op3,
      route: {
        path: '/test',
        methods: { get: true },
        stack: [makeLayer(op1, '/test1', 'get'), makeLayer(op2, '/test2', 'get')],
      },
    };
    expect(extractLayerPaths(root as unknown as Layer)).toEqual({
      '/test': { get: [op3, op1, op2] },
    });
  });
});
