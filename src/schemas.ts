import { z } from 'zod';
import { extendZodWithOpenApi } from 'zod-openapi';

extendZodWithOpenApi(z);

const openApiVersions = ['3.0.0', '3.0.1', '3.0.2', '3.0.3', '3.1.0'] as const;

const ZodApiInfo = z.object({
  title: z.string(),
  description: z.string().optional(),
  termsOfService: z.string().optional(),
  version: z.string(),
  contact: z
    .object({
      name: z.string(),
      url: z.string(),
      email: z.string(),
    })
    .passthrough()
    .optional(),
  license: z
    .object({
      name: z.string(),
      url: z.string(),
    })
    .passthrough()
    .optional(),
});

export const HasteOptionSchema = z.object({
  openApiVersion: z.enum(openApiVersions).default(openApiVersions[openApiVersions.length - 1]),
  info: ZodApiInfo,
});

export const ZodIssueSchema = z.object({
  type: z.string().optional().default('https://zod.dev/error_handling?id=zodissuecode').openapi({
    description: 'A URI reference [RFC3986] that identifies the problem type.',
  }),
  code: z.string().optional().openapi({
    description: 'A zod issue code, indicating what went wrong.',
  }),
  path: z
    .string()
    .array()
    .optional()
    .openapi({
      description: 'A path/array pointing to the location of the problem.',
      examples: [
        ['body', 'key of body'],
        ['query', 'key of query'],
        ['header', 'key of header'],
        ['cookie', 'key of cookie'],
        ['path', 'key of path'],
      ],
    }),
  message: z.string().openapi({
    description: 'A human-readable description pointing to the source of the problem',
  }),
});

export const RFCResponseSchema = z.object({
  type: z.string().default('about:blank').openapi({
    description: 'A URI reference [RFC3986] that identifies the problem type.',
    example: 'about:blank',
  }),
  title: z.string().openapi({
    description: 'A short, human-readable summary of the problem type.',
    example: 'Bad Request.',
  }),
  detail: z.string().openapi({
    description: 'A human-readable explanation specific to this occurrence of the problem.',
    example: 'The request did not match the required Schema.',
  }),
  status: z.number().optional().openapi({
    description: 'The HTTP status of this request',
    example: 400,
  }),
  instance: z.string().optional(),
});

export const HasteBadRequestSchema = RFCResponseSchema.extend({
  issues: ZodIssueSchema.array(),
});
