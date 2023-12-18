import { RequestHandler } from "express-serve-static-core";
import { z } from "zod";
import { extendZodWithOpenApi } from "zod-openapi";

extendZodWithOpenApi(z)

export const PetSchema = z.object({
    type: z.enum(['cat', 'dog']),
    breed: z.string()
})
export const Authentication = z.string().openapi({
    param: {
        in: 'header',
        name: 'authorization'
    },
    ref: 'authentication-header',
    description: "Some authentication header, you can use zod refinements and transforms to validate."
})
export const SessionCookie = z.string().openapi({
    param: {
        in: 'cookie',
        name: 'session'
    },
    ref: 'session-cookie',
    description: "A session cookie"
})

export const PetIdInQuery = z.string().uuid().openapi({
    param: {
        in: 'query',
        name: 'id'
    },
    ref: 'pet-id-query',
    description: "Pet ID in query params"
})
export const PetIdInPath = z.string().uuid().openapi({
    param: {
        in: 'path',
        name: 'petId'
    },
    ref: 'pet-id-path',
    description: "Pet ID in the path"
})

export const petHandler: RequestHandler<any, any, z.infer<typeof PetSchema>, any, any> = (req, res) => {
    res.status(200).json({
        status: 200,
        title: 'success',
        details: `${ req.body.type }/breeds/${ req.body.breed }`
    }).cookie('session', req.cookies.session).send()
}
export const petGetHandler: RequestHandler = (req, res) => {
    res.status(200).json({
        id: req.params.petId || req.query.id,
        type: 'cat',
        breed: 'burmese'
    }).cookie('session', req.cookies.session).send()
}