import { z } from "zod";
import { openApiVersions } from "zod-openapi/lib-types/openapi";
import { last } from "fp-ts/Array";

export const HasteOptionSchema = z.object({
    openApiVersion: z.enum(openApiVersions).optional().default(openApiVersions[openApiVersions.length - 1]),
    appTitle: z.string(),
    appVersion: z.string(),
    docPath: z.string().optional().default('/documentation')
})
export const ZodIssueSchema = z.object({
    code: z.string(),
    path: z.string().array(),
    message: z.string(),
})

export const RFCResponseSchema = z.object({
    type: z.string().default('about:blank').openapi({
        description: 'A URI reference [RFC3986] that identifies the problem type.',
        example: 'about:blank'
    }),
    title: z.string().openapi({
        description: 'A short, human-readable summary of the problem type.',
        example: 'Bad Request.'
    }),
    detail: z.string().openapi({
        description: 'A human-readable explanation specific to this occurrence of the problem.',
        example: 'The request did not match the required Schema.'
    }),
    status: z.number().optional().openapi({
        description: "The HTTP status of this request",
        example: 400
    }),
    instance: z.string().optional()
})