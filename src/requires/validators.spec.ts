import { requires } from './requires';
import { z } from 'zod';
import { validateAll } from './validators';
import express from 'express';
import { either } from 'fp-ts';
import { identity } from 'fp-ts/function';
import { ParameterLocation } from 'zod-openapi/lib-types/openapi3-ts/dist/model/openapi31';
import { ParsedQs } from 'qs';

describe('validators', () => {
  const exampleLiteral = z.literal('test');
  const exampleBody = z.object({
    mode: exampleLiteral,
  });

  it('should return right when there are no requirements', () => {
    const result = validateAll(requires()._effects, {} as express.Request);
    expect(either.isRight(result)).toBeTruthy();
  });

  it('should always return right for response requirements', () => {
    const validator = requires().response('200', z.literal('example'));
    const result = validateAll(validator._effects, {} as express.Request);
    expect(either.isRight(result)).toBeTruthy();
  });

  describe('body', () => {
    it('should return Right when body matches requirements', () => {
      const validator = requires().body(exampleBody);

      const result = validateAll(validator._effects, { body: { mode: 'test' } } as express.Request);

      expect(either.isRight(result)).toBeTruthy();
    });
    it('should update body with any transforms', () => {
      const validator = requires().body(
        z.object({
          changesType: z.string().transform((v) => v === 'true'),
        })
      );

      const reqTrue = { body: { changesType: 'true' } } as express.Request;
      const reqFalse = { body: { changesType: 'false' } } as express.Request;

      const resultTrue = validateAll(validator._effects, reqTrue);

      expect(either.isRight(resultTrue)).toBeTruthy();
      expect(reqTrue.body).toEqual({ changesType: true });

      const resultFalse = validateAll(validator._effects, reqFalse);

      expect(either.isRight(resultFalse)).toBeTruthy();
      expect(reqFalse.body).toEqual({ changesType: false });
    });
    it('should Left with zodError when does not match requirements', () => {
      const validator = requires().body(exampleBody);

      const result = validateAll(validator._effects, {
        body: { mode: 'hello' },
      } as express.Request);

      expect(either.isLeft(result)).toBeTruthy();
      expect(either.getOrElseW(identity)(result)).toEqual({
        issues: [
          {
            code: 'invalid_literal',
            expected: 'test',
            message: 'Invalid literal value, expected "test"',
            path: ['body', 'mode'],
            received: 'hello',
          },
        ],
      });
    });
    it('should Left with all zodError when does not match multiple requirements', () => {
      const validator = requires().body(
        z.object({
          test: z.boolean(),
          mode: z.number(),
        })
      );

      const result = validateAll(validator._effects, {
        body: { mode: 'hello' },
      } as express.Request);

      expect(either.isLeft(result)).toBeTruthy();
      expect(either.getOrElseW(identity)(result)).toEqual({
        issues: [
          {
            code: 'invalid_type',
            expected: 'boolean',
            message: 'Required',
            path: ['body', 'test'],
            received: 'undefined',
          },
          {
            code: 'invalid_type',
            expected: 'number',
            message: 'Expected number, received string',
            path: ['body', 'mode'],
            received: 'string',
          },
        ],
      });
    });
  });

  describe.each(['query', 'header', 'cookie', 'path'] as const)('%s', (elem) => {
    const locationRequestMapping: Record<ParameterLocation, keyof express.Request> = {
      path: 'params',
      cookie: 'cookies',
      header: 'headers',
      query: 'query',
    };

    const exampleSchema = z.literal('example');
    const validator = requires()[elem]('test', exampleSchema);
    it(`should return Right when ${elem} matches requirements`, () => {
      const result = validateAll(validator._effects, {
        [locationRequestMapping[elem]]: { test: 'example' },
      } as unknown as express.Request);

      expect(either.isRight(result)).toBeTruthy();
    });
    it(`should return Left when ${elem} misses requirements`, () => {
      const result = validateAll(validator._effects, {
        [locationRequestMapping[elem]]: { test: 'not example' },
      } as unknown as express.Request);

      expect(either.isLeft(result)).toBeTruthy();
      expect(either.getOrElseW(identity)(result)).toEqual({
        issues: [
          {
            code: 'invalid_literal',
            expected: 'example',
            message: 'Invalid literal value, expected "example"',
            path: [locationRequestMapping[elem], 'test'],
            received: 'not example',
          },
        ],
      });
    });
    it(`should return Right when multiple ${elem}'s are required and all are provided`, () => {
      const validator = requires()[elem]('test1', exampleSchema)[elem]('test2', exampleSchema);
      const result = validateAll(validator._effects, {
        [locationRequestMapping[elem]]: {
          test1: 'example',
          test2: 'example',
        },
      } as unknown as express.Request);

      expect(either.isRight(result)).toBeTruthy();
    });
    it(`should return Left with all errors when ${elem} misses more than one requirements`, () => {
      const validator = requires()[elem]('test1', exampleSchema)[elem]('test2', exampleSchema);

      const result = validateAll(validator._effects, {
        [locationRequestMapping[elem]]: { test: 'not example' },
      } as unknown as express.Request);

      expect(either.isLeft(result)).toBeTruthy();
      expect(either.getOrElseW(identity)(result)).toEqual({
        issues: [
          {
            code: 'invalid_literal',
            expected: 'example',
            message: 'Invalid literal value, expected "example"',
            path: [locationRequestMapping[elem], 'test1'],
          },
          {
            code: 'invalid_literal',
            expected: 'example',
            message: 'Invalid literal value, expected "example"',
            path: [locationRequestMapping[elem], 'test2'],
          },
        ],
      });
    });
    if (['cookie', 'query'].includes(elem)) {
      it(`should update req.${elem} with the validation result`, () => {
        const validator = requires()[elem](
          'test',
          z.string().transform((v) => (v === 'example' ? 4 : 2))
        );

        const req = {
          [locationRequestMapping[elem]]: { test: 'example' },
        } as unknown as express.Request;
        const result = validateAll(validator._effects, req);

        expect(either.isRight(result)).toBeTruthy();
        expect(req[locationRequestMapping[elem]]).toEqual({
          test: 4,
        });
      });
    } else {
      it(`should not update req.${elem} with the validation result`, () => {
        const validator = requires()[elem](
          'test',
          z.string().transform((v) => (v === 'example' ? 4 : 2))
        );

        const req = {
          [locationRequestMapping[elem]]: { test: 'example' },
        } as unknown as express.Request;
        const result = validateAll(validator._effects, req);

        expect(either.isRight(result)).toBeTruthy();
        expect(req[locationRequestMapping[elem]]).toEqual({
          test: 'example',
        });
      });
    }
  });

  const validateMany = requires()
    .body(z.object({ test: z.literal(true) }))
    .query('example', z.string().array())
    .header('x-example', z.string())
    .cookie('cookie_example', z.string())
    .path('id', z.literal('v1'));

  it('should be able to validate all requirements and return right if matching', () => {
    const result = validateAll(validateMany._effects, {
      body: { test: true },
      query: { example: ['1', '2'] } as ParsedQs,
      params: { id: 'v1' } as unknown,
      cookies: { cookie_example: 'test' },
      headers: { 'x-example': 'some header value' } as unknown,
    } as express.Request);

    expect(either.isRight(result)).toBe(true);
  });
  it('should be able to validate all requirements and return left for all not matching', () => {
    const result = validateAll(validateMany._effects, {
      body: { test: 'true' },
      query: { example: '1' } as ParsedQs,
      params: { id: true } as unknown,
      cookies: { cookie_example: 1 },
      headers: { 'x-example': 'some header value' } as unknown,
    } as express.Request);

    expect(either.isLeft(result)).toBe(true);
    expect(either.getOrElseW(identity)(result)).toEqual({
      issues: [
        {
          code: 'invalid_literal',
          expected: true,
          message: 'Invalid literal value, expected true',
          path: ['body', 'test'],
          received: 'true',
        },
        {
          code: 'invalid_type',
          expected: 'array',
          message: 'Expected array, received string',
          path: ['query', 'example'],
          received: 'string',
        },
        {
          code: 'invalid_type',
          expected: 'string',
          message: 'Expected string, received number',
          path: ['cookies', 'cookie_example'],
          received: 'number',
        },
        {
          code: 'invalid_literal',
          expected: 'v1',
          message: 'Invalid literal value, expected "v1"',
          path: ['params', 'id'],
          received: true,
        },
      ],
    });
  });
});
