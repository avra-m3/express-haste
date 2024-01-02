import { addRouteToDocument, BadRequest, document, isHasteOperation } from './document';
import { z } from 'zod';
import { body, header, query, response } from './requires';
import { HasteOperation } from './types';
import express from 'express';

describe('document', () => {
  describe('isHasteOperation', () => {
    it('should return true when is a haste operation', () => {
      expect(isHasteOperation(query('key', z.string()))).toBe(true);
    });

    it('should return false for normal functions', () => {
      expect(isHasteOperation(() => {})).toBe(false);
    });
  });

  describe('addRouteToDocument', () => {
    beforeEach(() => jest.resetAllMocks());

    const makeLayer = (handler: HasteOperation) => ({
      route: {
        path: '/test',
        methods: { get: true },
        stack: [
          {
            handle: {
              ...handler,
            },
          },
        ],
      },
    });

    it('should call enhancer on a query operation and add a query', () => {
      const op = query('key', z.string());
      const mockEnhancer = jest.spyOn(op, '_enhancer');
      const simpleLayer = makeLayer(op);
      const spec = {};
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect(addRouteToDocument(spec, simpleLayer as any)).toEqual({
        '/test': {
          get: {
            requestParams: {
              query: expect.objectContaining({
                shape: op._effects.query,
              }),
            },
            responses: {
              400: BadRequest,
            },
          },
        },
      });
      expect(mockEnhancer).toHaveBeenCalledTimes(1);
      expect(mockEnhancer).toHaveBeenNthCalledWith(1, {
        responses: {
          400: BadRequest,
        },
      });
    });

    it('should call enhancer on a body operation and add a request body', () => {
      const op = body(z.string(), {
        contentType: 'text/plain',
      });
      const mockEnhancer = jest.spyOn(op, '_enhancer');
      const simpleLayer = makeLayer(op);
      const spec = {};
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect(addRouteToDocument(spec, simpleLayer as any)).toEqual({
        '/test': {
          get: {
            requestBody: { content: { 'text/plain': { schema: op._effects.body } } },
            responses: {
              400: BadRequest,
            },
          },
        },
      });
      expect(mockEnhancer).toHaveBeenCalledTimes(1);
      expect(mockEnhancer).toHaveBeenNthCalledWith(1, {
        responses: {
          400: BadRequest,
        },
      });
    });

    it('should call enhancer on a response operation and add a response', () => {
      const op = response('500', z.literal('You cannot do that'), { contentType: 'text/plain' });
      const mockEnhancer = jest.spyOn(op, '_enhancer');
      const simpleLayer = makeLayer(op);
      const spec = {};
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect(addRouteToDocument(spec, simpleLayer as any)).toEqual({
        '/test': {
          get: {
            responses: {
              400: BadRequest,
              500: {
                content: {
                  'text/plain': {
                    schema: op._effects.response[0].schema,
                  },
                },
              },
            },
          },
        },
      });
      expect(mockEnhancer).toHaveBeenCalledTimes(1);
      expect(mockEnhancer).toHaveBeenNthCalledWith(1, {
        responses: {
          400: BadRequest,
        },
      });
    });
    it('should handle nested layers', () => {
      const op1 = response('401', z.literal("can't touch this"), { contentType: 'text/plain' });
      const op2 = response('401', z.object({ message: z.literal("can't touch this") }), {
        contentType: 'application/problem+json',
      });
      const mockEnhancer1 = jest.spyOn(op1, '_enhancer');
      const mockEnhancer2 = jest.spyOn(op2, '_enhancer');

      const spec = {};

      expect(
        addRouteToDocument(spec, {
          route: {
            path: '/root',
            methods: { get: true },
            stack: [makeLayer(op1), makeLayer(op2)],
          },
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } as any)
      ).toEqual({
        '/root': {
          get: {
            responses: {
              400: BadRequest,
              401: {
                content: {
                  'text/plain': {
                    schema: op1._effects.response[0].schema,
                  },
                  'application/problem+json': {
                    schema: op2._effects.response[0].schema,
                  },
                },
              },
            },
          },
        },
      });
      expect(mockEnhancer1).toHaveBeenCalledTimes(1);
      expect(mockEnhancer2).toHaveBeenCalledTimes(1);
      expect(mockEnhancer1).toHaveBeenNthCalledWith(1, {
        responses: {
          400: BadRequest,
        },
      });
    });
  });

  describe('document', () => {
    const expectedBadRequest = {
      '400-bad-request': {
        description: '400 BAD REQUEST',
        content: {
          'application/problem+validation+json': {
            schema: {
              type: 'object',
              properties: {
                type: {
                  type: 'string',
                  default: 'about:blank',
                  description: 'A URI reference [RFC3986] that identifies the problem type.',
                  example: 'about:blank',
                },
                title: {
                  type: 'string',
                  description: 'A short, human-readable summary of the problem type.',
                  example: 'Bad Request.',
                },
                detail: {
                  type: 'string',
                  description:
                    'A human-readable explanation specific to this occurrence of the problem.',
                  example: 'The request did not match the required Schema.',
                },
                status: {
                  type: 'number',
                  description: 'The HTTP status of this request',
                  example: 400,
                },
                instance: { type: 'string' },
                issues: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      type: {
                        type: 'string',
                        default: 'https://zod.dev/error_handling?id=zodissuecode',
                        description: 'A URI reference [RFC3986] that identifies the problem type.',
                      },
                      code: {
                        type: 'string',
                        description: 'A zod issue code, indicating what went wrong.',
                      },
                      path: {
                        type: 'array',
                        items: { type: 'string' },
                        description: 'A path/array pointing to the location of the problem.',
                        examples: [
                          ['body', 'key of body'],
                          ['query', 'key of query'],
                          ['header', 'key of header'],
                          ['cookie', 'key of cookie'],
                          ['path', 'key of path'],
                        ],
                      },
                      message: {
                        type: 'string',
                        description:
                          'A human-readable description pointing to the source of the problem',
                      },
                    },
                    required: ['type', 'message'],
                  },
                },
              },
              required: ['type', 'title', 'detail', 'issues'],
            },
          },
        },
      },
    };
    const expectedOut = {
      openapi: '3.0.0',
      info: { title: 'test', version: '0.0.1' },
      paths: {
        '/test': {
          get: {
            parameters: [{ in: 'header', name: 'key', schema: { type: 'string' }, required: true }],
            requestBody: {
              content: {
                'application/somecustomformat+json': {
                  schema: {
                    type: 'object',
                    additionalProperties: { type: 'boolean' },
                  },
                },
              },
            },
            responses: {
              400: { $ref: '#/components/responses/400-bad-request' },
            },
          },
        },
      },
      components: {
        responses: {
          ...expectedBadRequest,
        },
      },
    };

    it('should create the correct schema for when use() is called', () => {
      const app = express();
      app.use(header('key', z.string()));
      app.get(
        '/test',
        body(z.record(z.boolean()), { contentType: 'application/somecustomformat+json' })
      );

      expect(
        document(app, {
          openApiVersion: '3.0.0',
          info: { title: 'test', version: '0.0.1' },
        })
      ).toEqual(expectedOut);
    });
  });
});
