import { requires } from './requires';
import { z, ZodObject } from 'zod';
import { enhanceAll } from './enhancers';
import {
  ZodOpenApiOperationObject,
  ZodOpenApiParameters,
} from 'zod-openapi/lib-types/create/document';

describe('enhancers', () => {
  describe('body', () => {
    const bodySchema = z.literal('example');
    it('should return an empty object when no effect', () => {
      const body = requires();
      expect(enhanceAll(body._effects, {} as ZodOpenApiOperationObject)).toEqual({});
    });
    it('should return the correct schema for requires().body()', () => {
      const body = requires().body(bodySchema);
      expect(enhanceAll(body._effects, {} as ZodOpenApiOperationObject)).toEqual({
        requestBody: {
          content: {
            'application/json': {
              schema: bodySchema,
            },
          },
        },
      });
    });
    it('should return the correct schema for requires().body() when a custom contentType is provided', () => {
      const body = requires().body(bodySchema, { contentType: 'test/example' });
      expect(enhanceAll(body._effects, {} as ZodOpenApiOperationObject)).toEqual({
        requestBody: {
          content: {
            'test/example': {
              schema: bodySchema,
            },
          },
        },
      });
    });
    it('should return the last schema when many body are provided', () => {
      const body = requires()
        .body(z.number(), { contentType: 'wrong/body' })
        .body(bodySchema, { contentType: 'test/example' });
      expect(enhanceAll(body._effects, {} as ZodOpenApiOperationObject)).toEqual({
        requestBody: {
          content: {
            'test/example': {
              schema: bodySchema,
            },
          },
        },
      });
    });
  });
  describe('responses', () => {
    const responseSchema = z.literal('example');
    it('should return an empty object when no effect', () => {
      const response = requires();
      expect(enhanceAll(response._effects, {} as ZodOpenApiOperationObject)).toEqual({});
    });
    it('should return the correct schema for requires().response()', () => {
      const response = requires().response('200', responseSchema);
      expect(enhanceAll(response._effects, {} as ZodOpenApiOperationObject)).toEqual({
        responses: {
          [200]: {
            description: undefined,
            content: {
              'application/json': {
                schema: responseSchema,
              },
            },
          },
        },
      });
    });
    it('should return the correct schema for requires().response() when a custom contentType is provided', () => {
      const body = requires().response('202', responseSchema, { contentType: 'test/example' });
      expect(enhanceAll(body._effects, {} as ZodOpenApiOperationObject)).toEqual({
        responses: {
          [202]: {
            description: undefined,
            content: {
              'test/example': {
                schema: responseSchema,
              },
            },
          },
        },
      });
    });
    it('should be able to add a description to the response requires()', () => {
      const body = requires().response('400', responseSchema, { description: 'some example' });
      expect(enhanceAll(body._effects, {} as ZodOpenApiOperationObject)).toEqual({
        responses: {
          [400]: {
            description: 'some example',
            content: {
              'application/json': {
                schema: responseSchema,
              },
            },
          },
        },
      });
    });
    it('should be able to add to existing responses in the spec', () => {
      const body = requires().response('400', responseSchema, { description: 'some example' });
      expect(
        enhanceAll(body._effects, {
          responses: {
            [100]: {
              description: 'continue',
              content: {
                'application/json': {
                  schema: responseSchema,
                },
              },
            },
            [400]: {
              description: 'An error',
              content: {
                'application/problem+json': {
                  schema: responseSchema,
                },
              },
            },
          },
        } as ZodOpenApiOperationObject)
      ).toEqual({
        responses: {
          [100]: {
            description: 'continue',
            content: {
              'application/json': {
                schema: responseSchema,
              },
            },
          },
          [400]: {
            description: 'some example',
            content: {
              'application/json': {
                schema: responseSchema,
              },
              'application/problem+json': {
                schema: responseSchema,
              },
            },
          },
        },
      });
    });
    it('should be able to provide many responses in one requires', () => {
      const body = requires()
        .response('400', responseSchema, { description: 'some example' })
        .response('400', responseSchema, {
          description: 'overrides 400 error description',
          contentType: 'application/problem+json',
        })
        .response('100', responseSchema, { description: 'continue' });
      expect(enhanceAll(body._effects, {} as ZodOpenApiOperationObject)).toEqual({
        responses: {
          [100]: {
            description: 'continue',
            content: {
              'application/json': {
                schema: responseSchema,
              },
            },
          },
          [400]: {
            description: 'overrides 400 error description',
            content: {
              'application/json': {
                schema: responseSchema,
              },
              'application/problem+json': {
                schema: responseSchema,
              },
            },
          },
        },
      });
    });
  });
  describe.each(['query', 'header', 'cookie', 'path'] as const)('%s', (elem) => {
    const exampleSchema = z.literal('example');
    const exampleSchema2 = z.literal('new');
    it('should return an empty object when no effect', () => {
      const req = requires();
      expect(enhanceAll(req._effects, {} as ZodOpenApiOperationObject)).toEqual({});
    });
    it(`should return the correct schema for requires().${elem}()`, () => {
      const value = requires()[elem]('test', exampleSchema);
      const spec = enhanceAll(value._effects, {} as ZodOpenApiOperationObject);
      expect(spec).toEqual({
        requestParams: {
          [elem]: expect.any(ZodObject),
        },
      });
      expect(spec?.requestParams?.[elem]?.shape).toEqual({
        test: exampleSchema,
      });
    });
    it(`should preserve existing schemas for ${elem}`, () => {
      const value = requires()[elem]('test', exampleSchema);
      const spec = enhanceAll(value._effects, {
        requestParams: {
          [elem]: z.object({
            example: exampleSchema2,
          }),
        } as ZodOpenApiParameters,
      } as ZodOpenApiOperationObject);
      expect(spec).toEqual({
        requestParams: {
          [elem]: expect.any(ZodObject),
        },
      });
      expect(spec?.requestParams?.[elem]?.shape).toEqual({
        test: exampleSchema,
        example: exampleSchema2,
      });
    });
    it(`should return the correct schema for many requires().${elem}()`, () => {
      const number = z.number();
      const boolean = z.boolean();
      const value = requires()
        [elem]('test', exampleSchema)
        [elem]('test2', number)
        [elem]('another', boolean);
      const spec = enhanceAll(value._effects, {} as ZodOpenApiOperationObject);
      expect(spec).toEqual({
        requestParams: {
          [elem]: expect.any(ZodObject),
        },
      });
      expect(spec?.requestParams?.[elem]?.shape).toEqual({
        test: exampleSchema,
        test2: number,
        another: boolean,
      });
    });
  });
});
