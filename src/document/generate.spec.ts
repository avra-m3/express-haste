import { HasteEffect, Requires } from '../types';
import { generateComponentsFromOperations, generatePathsFromOperations } from './generate';
import { AllPathsKey } from './types';

describe('generate', () => {
  const fakeRequirement = (r: unknown) =>
    ({
      _components: jest.fn().mockReturnValue(r),
      _enhancer: jest.fn().mockReturnValue(r),
    }) as unknown as Requires<HasteEffect>;
  describe('generateComponentsFromOperations', () => {
    it('should return the result of _components', () => {
      const components = {};
      const map = { '/path': { post: [fakeRequirement({ test: 'value' })] } };
      expect(generateComponentsFromOperations(components, map)).toEqual({ test: 'value' });
      expect(map['/path'].post[0]._components).toBeCalledWith(components);
    });
    it('should return a merged result for many effects', () => {
      const components = {};
      const map = {
        '/patha': { post: [fakeRequirement({ test: { deep: ['value1'] } })] },
        '/pathb': {
          get: [fakeRequirement({ test: { deep: ['value2'] } })],
        },
      };
      expect(generateComponentsFromOperations(components, map)).toEqual({
        test: { deep: ['value1', 'value2'] },
      });
      expect(map['/patha'].post[0]._components).toBeCalledWith(components);
      expect(map['/pathb'].get[0]._components).toBeCalledWith(components);
    });
    it('should treat !all same as any other path', () => {
      const components = {};
      const map = {
        [AllPathsKey]: { post: [fakeRequirement({ test: { deep: ['value1'] } })] },
        '/pathb': {
          get: [fakeRequirement({ test: { deep: ['value2'] } })],
        },
      };
      expect(generateComponentsFromOperations(components, map)).toEqual({
        test: { deep: ['value1', 'value2'] },
      });
      expect(map[AllPathsKey].post[0]._components).toBeCalledWith(components);
      expect(map['/pathb'].get[0]._components).toBeCalledWith(components);
    });
    it('should treat use same as any other method', () => {
      const components = {};
      const map = {
        '/patha': { use: [fakeRequirement({ test: { deep: ['value1'] } })] },
        '/pathb': {
          get: [fakeRequirement({ test: { deep: ['value2'] } })],
        },
      };
      expect(generateComponentsFromOperations(components, map)).toEqual({
        test: { deep: ['value1', 'value2'] },
      });
      expect(map['/patha'].use[0]._components).toBeCalledWith(components);
      expect(map['/pathb'].get[0]._components).toBeCalledWith(components);
    });
    it('should correctly handle partial paths', () => {
      const components = {};
      const map = {
        '/patha': { post: [fakeRequirement({ test: { deep: ['value1'] } })] },
        '/pathb': {
          get: [fakeRequirement({ test: { deep: ['value2'] } })],
        },
        pathc: {},
      };
      expect(generateComponentsFromOperations(components, map)).toEqual({
        test: { deep: ['value1', 'value2'] },
      });
      expect(map['/patha'].post[0]._components).toBeCalledWith(components);
      expect(map['/pathb'].get[0]._components).toBeCalledWith(components);
    });
    it('should preserve original compoennt', () => {
      const components = { test: { deep: ['value0'] } };
      const map = {
        '/patha': { post: [fakeRequirement({ test: { deep: ['value1'] } })] },
        '/pathb': {
          get: [fakeRequirement({ test: { deep: ['value2'] } })],
        },
        pathc: {},
      };
      expect(generateComponentsFromOperations(components, map)).toEqual({
        test: { deep: ['value0', 'value1', 'value2'] },
      });
      expect(map['/patha'].post[0]._components).toBeCalledWith(components);
      expect(map['/pathb'].get[0]._components).toBeCalledWith(components);
    });
  });
  describe('generatePathsFromOperations', () => {
    it('should return the result of _enhancer', () => {
      const paths = {};
      const map = { '/path': { post: [fakeRequirement({ test: 'value' })] } };
      expect(generatePathsFromOperations(paths, map)).toEqual({
        '/path': { post: { test: 'value' } },
      });
      expect(map['/path'].post[0]._enhancer).toBeCalledWith(paths);
    });
    it('should return a merged result for many effects', () => {
      const pathObject = {};
      const map = {
        '/patha': { post: [fakeRequirement({ test: { deep: ['value1'] } })] },
        '/pathb': {
          get: [fakeRequirement({ test: { deep: ['value2'] } })],
        },
      };
      expect(generatePathsFromOperations(pathObject, map)).toEqual({
        '/patha': { post: { test: { deep: ['value1'] } } },
        '/pathb': { get: { test: { deep: ['value2'] } } },
      });
      expect(map['/patha'].post[0]._enhancer).toBeCalledWith(pathObject);
      expect(map['/pathb'].get[0]._enhancer).toBeCalledWith(pathObject);
    });
    it('should apply !all to all paths', () => {
      const pathObject = {};
      const map = {
        [AllPathsKey]: { get: [fakeRequirement({ test: { deep: ['value2'] } })] },
        '/pathb': {
          get: [fakeRequirement({ test: { deep: ['value1'] } })],
        },
      };
      expect(generatePathsFromOperations(pathObject, map)).toEqual({
        '/pathb': { get: { test: { deep: ['value1', 'value2'] } } },
      });
      expect(map[AllPathsKey].get[0]._enhancer).toBeCalledWith(pathObject);
      expect(map['/pathb'].get[0]._enhancer).toBeCalledWith(pathObject);
    });
    it('should apply use to all methods on the same path', () => {
      const pathConfig = {};
      const map = {
        '/patha': {
          use: [fakeRequirement({ test: { deep: ['value1'] } })],
          get: [fakeRequirement({ test: { deep: ['value2'] } })],
          post: [fakeRequirement({ another: 'key' })],
        },
      };
      expect(generatePathsFromOperations(pathConfig, map)).toEqual({
        '/patha': {
          get: {
            test: {
              deep: ['value2', 'value1'],
            },
          },
          post: {
            another: 'key',
            test: {
              deep: ['value1'],
            },
          },
        },
      });
      expect(map['/patha'].use[0]._enhancer).toBeCalledWith(pathConfig);
      expect(map['/patha'].get[0]._enhancer).toBeCalledWith(pathConfig);
      expect(map['/patha'].post[0]._enhancer).toBeCalledWith(pathConfig);
    });
    it('should correctly handle partial paths', () => {
      const components = {};
      const map = {
        '/patha': { post: [fakeRequirement({ test: { deep: ['value1'] } })] },
        '/pathb': {
          get: [fakeRequirement({ test: { deep: ['value2'] } })],
        },
        pathc: {},
      };
      expect(generatePathsFromOperations(components, map)).toEqual({
        '/patha': { post: { test: { deep: ['value1'] } } },
        '/pathb': { get: { test: { deep: ['value2'] } } },
      });
      expect(map['/patha'].post[0]._enhancer).toBeCalledWith(components);
      expect(map['/pathb'].get[0]._enhancer).toBeCalledWith(components);
    });
  });
});
