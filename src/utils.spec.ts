import { z, ZodError, ZodIssue } from "zod";
import { isObject, mergeDeep, parseSafe, zodToRfcError } from "./utils";
import * as E from "fp-ts/lib/Either";

const consoleWarnMock = jest.spyOn(console, "warn");
describe("utils.ts", () => {
  describe("parseSafe", () => {
    it("should return Right of valid string when successful", () => {
      const schema = z.string();
      const input = "hello world";
      const result = parseSafe(schema)(input);
      expect(E.isRight(result)).toBe(true);
      expect(result).toEqual(E.right(input));
    });

    it("should return Left of ZodError when fails", () => {
      const schema = z.string();
      const input = 123;
      const result = parseSafe(schema)(input);
      expect(E.isLeft(result)).toBe(true);
      expect(result).toEqual(E.left(new ZodError([{
        code: "invalid_type",
        expected: "string",
        received: "number",
        path: [],
        message: "Expected string, received number"
      }])));
    });
  });

  describe("zodToRfcError", () => {
    beforeEach(() => jest.resetAllMocks());
    // test description
    it("transforms ZodIssue errors to HasteBadRequest errors", () => {
      const mockZodIssue: ZodIssue = {
        code: "invalid_type",
        expected: "string",
        received: "number",
        path: [],
        message: "Expected string, received number"
      };
      const mockZodError = {
        issues: [mockZodIssue]
      } as ZodError;
      const expected = {
        type: "about:blank",
        title: "Bad request",
        detail: "Request failed to validate",
        issues: [{
          type: 'https://zod.dev/error_handling?id=zodissuecode',
          code: "invalid_type",
          path: [],
          message: "Expected string, received number"
        }]
      };

      // test assertion
      expect(zodToRfcError(mockZodError)).toEqual(expected);
    });
    it("Notifies the user in the event an invalid zodIssue is encountered", () => {
      consoleWarnMock.mockImplementation();
      const mockZodIssue: ZodIssue = {
        code: "invalid_type",
        expected: "string",
        received: "number",
        path: [0],
        message: "Expected string, received number"
      };
      const mockZodError = {
        issues: [mockZodIssue]
      } as ZodError;
      const expected = {
        type: "about:blank",
        title: "Bad request",
        detail: "Request failed to validate",
        issues: [{
          type: 'about:blank',
          code: "custom",
          message: "No information available",
          path: []
        }]
      };
      // test assertion

      expect(zodToRfcError(mockZodError)).toEqual(expected);
      expect(consoleWarnMock).toBeCalled();
    });
  });

  describe("isObject", () => {
    it("Identifies an object correctly", () => {
      const testObject = { key: "value" };
      expect(isObject(testObject)).toBeTruthy();
    });

    it("Identifies a non-object correctly", () => {
      const testNonObject = "string";
      expect(isObject(testNonObject)).toBeFalsy();
    });

    it("Distinguishes between object and array", () => {
      const testArray = [1, 2, 3];
      expect(isObject(testArray)).toBeFalsy();
    });
    it("Distinguishes between null and object", () => {
      const testArray = null;
      expect(isObject(testArray)).toBeFalsy();
    });
    it("Distinguishes between undefined and object", () => {
      const testArray = undefined;
      expect(isObject(testArray)).toBeFalsy();
    });
  });


  describe("mergeDeep", () => {
    it("should merge two naive objects deeply", () => {
      const obj1 = { a: 1, b: { c: 2 } };
      const obj2 = { b: { d: 3 }, e: 4 };
      const result = mergeDeep(obj1, obj2);
      expect(result).toEqual({ a: 1, b: { c: 2, d: 3 }, e: 4 });
    });

    it("should merge deeply nested arrays, but not their children", () => {
      const obj1 = { a: 1, b: [{ c: 2 }] };
      const obj2 = { b: [{ d: 3 }, { c: 4 }], e: 4 };
      const result = mergeDeep(obj1, obj2);
      expect(result).toEqual({ a: 1, b: [{ c: 2 }, { d: 3 }, { c: 4 }], e: 4 });
    });

    it("should handle when only one value is provided", () => {
      const obj1 = { a: 1 };
      const result = mergeDeep(obj1);
      expect(result).toEqual(obj1);
    });
    it("should handle when three values are provided", () => {
      const obj1 = { a: 1, d: { c: 1 } };
      const obj2 = { b: 1, d: { b: 2 } };
      const obj3 = { c: 1, d: { a: 3 } };
      const result = mergeDeep(obj1, obj2, obj3);
      expect(result).toEqual({
        a: 1,
        b: 1,
        c: 1,
        d: {
          a: 3,
          b: 2,
          c: 1
        }
      });
    });
    it("should treat zod types as values, not objects", () => {
      const obj1 = { d: z.number() };
      const obj2 = { d: z.string() };
      const result = mergeDeep(obj1, obj2);
      expect(result).toEqual(obj2);
    });
  });

});
