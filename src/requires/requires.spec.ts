import { requires } from './requires';
import { validateAll } from './validators';
import { either } from 'fp-ts';
import express from 'express';
import { z, ZodBoolean, ZodNumber, ZodObject, ZodString } from 'zod';
import { enhanceAll } from './enhancers';
import { ZodOpenApiOperationObject } from 'zod-openapi/lib-types/create/document';

jest.mock('./validators');
jest.mock('./enhancers');
describe('requires', () => {
  afterAll(() => jest.resetAllMocks());
  it('should be callable and have expected functions', () => {
    const r = requires();
    expect(r).toEqual(expect.any(Function));
    expect(r._validator).toEqual(expect.any(Function));
    expect(r._enhancer).toEqual(expect.any(Function));
    expect(r._hastens).toBe(true);
  });

  const dummyZodError = {
    issues: [
      {
        code: 'invalid_literal',
        expected: 'example',
        message: 'Invalid literal value, expected "example"',
        path: ['body', 'test1'],
      },
    ],
  };

  describe('middleware function', () => {
    it('should call validateAll when the class is used as a middleware', () => {
      const requirements = requires().body(z.string());
      const validateAllReturn = either.right({});
      const request = {} as express.Request;
      const response = {} as express.Response;
      const next = jest.fn();

      (validateAll as jest.Mock).mockReturnValue(validateAllReturn);
      expect(requirements(request, response, next)).toEqual(undefined);
      expect(validateAll).toHaveBeenCalledWith(requirements._effects, request);
      expect(next).toHaveBeenCalled();
    });
    it('should return an error response when the class is used as a middleware and validation returns a left', () => {
      const requirements = requires().body(z.string());
      const validateAllReturn = either.left(dummyZodError);
      const request = {} as express.Request;
      const response = {
        status: jest.fn(),
        contentType: jest.fn(),
        json: jest.fn(),
        send: jest.fn(),
      } as unknown as express.Response;
      Object.values(response).forEach((v: jest.Mock) => v.mockReturnValue(response));
      const next = jest.fn();

      (validateAll as jest.Mock).mockReturnValue(validateAllReturn);
      expect(requirements(request, response, next)).toEqual(undefined);
      expect(validateAll).toHaveBeenCalledWith(requirements._effects, request);
      expect(next).not.toHaveBeenCalled();
      expect(response.status).toHaveBeenCalledWith(400);
      expect(response.contentType).toHaveBeenCalledWith('application/problem+validation+json');
      expect(response.json).toHaveBeenCalledWith({
        detail: 'Request failed to validate',
        issues: [
          {
            code: 'invalid_literal',
            message: 'Invalid literal value, expected "example"',
            path: ['body', 'test1'],
            type: 'https://zod.dev/error_handling?id=zodissuecode',
          },
        ],
        title: 'Bad request',
        type: 'about:blank',
      });
      expect(response.send).toHaveBeenCalled();
    });
    it('should return a custom error response when a custom errorHandler is provided', () => {
      const errorHandler = jest.fn();
      const requirements = requires({ errorHandler }).body(z.string());
      const validateAllReturn = either.left(dummyZodError);
      const request = {} as express.Request;
      const response = {
        status: jest.fn(),
        contentType: jest.fn(),
        json: jest.fn(),
        send: jest.fn(),
      } as unknown as express.Response;
      Object.values(response).forEach((v: jest.Mock) => v.mockReturnValue(response));
      const next = jest.fn();

      (validateAll as jest.Mock).mockReturnValue(validateAllReturn);
      expect(requirements(request, response, next)).toEqual(undefined);
      expect(validateAll).toHaveBeenCalledWith(requirements._effects, request);
      expect(next).not.toHaveBeenCalled();
      expect(errorHandler).toHaveBeenCalledWith(dummyZodError, response, next);
      expect(response.status).not.toHaveBeenCalled();
      expect(response.contentType).not.toHaveBeenCalled();
      expect(response.json).not.toHaveBeenCalled();
      expect(response.send).not.toHaveBeenCalled();
    });
  });

  describe('builders', () => {
    const spec = requires();
    it('should correctly add a body effect', () => {
      expect(spec.body(z.string())).toHaveProperty(
        '_effects',
        expect.objectContaining({
          body: { config: {}, schema: expect.any(ZodString) },
        })
      );
    });
    it('should override existing body effect', () => {
      expect(spec.body(z.object({ test: z.boolean() }))).toHaveProperty(
        '_effects',
        expect.objectContaining({
          body: { config: {}, schema: expect.any(ZodObject) },
        })
      );
    });

    it('should correctly add a response effect', () => {
      const result = spec.response('500', z.string());
      expect(result).toHaveProperty(
        '_effects',
        expect.objectContaining({
          response: expect.arrayContaining([
            { status: '500', config: {}, schema: expect.any(ZodString) },
          ]),
        })
      );
    });
    it('should add a second response effect', () => {
      const result = spec.response('200', z.string(), { contentType: 'any/any' });
      expect(result).toHaveProperty(
        '_effects',
        expect.objectContaining({
          response: expect.arrayContaining([
            { status: '500', config: {}, schema: expect.any(ZodString) },
            { status: '200', config: { contentType: 'any/any' }, schema: expect.any(ZodString) },
          ]),
        })
      );
      expect(result._effects).toHaveProperty('body');
    });
    it('should correctly add a query effect', () => {
      const result = spec.query('test', z.number());
      expect(result).toHaveProperty(
        '_effects',
        expect.objectContaining({
          query: expect.objectContaining({ shape: { test: expect.any(ZodNumber) } }),
        })
      );
      expect(result._effects).toHaveProperty('body', expect.any(Object));
      expect(result._effects).toHaveProperty('response', expect.any(Array));
    });
    it('should correctly add a path effect', () => {
      const result = spec.path('example', z.boolean());
      expect(result).toHaveProperty(
        '_effects',
        expect.objectContaining({
          path: expect.objectContaining({ shape: { example: expect.any(ZodBoolean) } }),
        })
      );
      expect(result._effects).toHaveProperty('body', expect.any(Object));
      expect(result._effects).toHaveProperty('response', expect.any(Array));
      expect(result._effects).toHaveProperty('query', expect.any(ZodObject));
    });
    it('should correctly add a header effect', () => {
      const result = spec.header('x-example', z.string());
      expect(result).toHaveProperty(
        '_effects',
        expect.objectContaining({
          header: expect.objectContaining({ shape: { 'x-example': expect.any(ZodString) } }),
        })
      );
      expect(result._effects).toHaveProperty('body', expect.any(Object));
      expect(result._effects).toHaveProperty('response', expect.any(Array));
      expect(result._effects).toHaveProperty('query', expect.any(ZodObject));
      expect(result._effects).toHaveProperty('path', expect.any(ZodObject));
    });
    it('should correctly add a cookie effect', () => {
      const result = spec.cookie('some_cookie', z.string());
      expect(result).toHaveProperty(
        '_effects',
        expect.objectContaining({
          cookie: expect.objectContaining({ shape: { some_cookie: expect.any(ZodString) } }),
        })
      );
      expect(result._effects).toHaveProperty('body', expect.any(Object));
      expect(result._effects).toHaveProperty('response', expect.any(Array));
      expect(result._effects).toHaveProperty('query', expect.any(ZodObject));
      expect(result._effects).toHaveProperty('path', expect.any(ZodObject));
      expect(result._effects).toHaveProperty('header', expect.any(ZodObject));
    });
  });

  it('should call validateAll when _validator is called', () => {
    const requirements = requires().body(z.string());
    const validateAllReturn = either.right(undefined);
    const request = {} as express.Request;
    (validateAll as jest.Mock).mockReturnValue(validateAllReturn);
    expect(requirements._validator(request)).toEqual(validateAllReturn);
    expect(validateAll).toHaveBeenCalledWith(requirements._effects, request);
  });

  it('should call enhanceAll when _enhancer is called', () => {
    const requirements = requires().body(z.string());
    const returnValue = { some: 'spec object' };
    const operation = {} as ZodOpenApiOperationObject;
    (enhanceAll as jest.Mock).mockReturnValue(returnValue);
    expect(requirements._enhancer(operation)).toEqual(returnValue);
    expect(enhanceAll).toHaveBeenCalledWith(requirements._effects, operation);
  });
});
