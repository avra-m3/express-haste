import { RequestHandler } from "express-serve-static-core";
import { z } from "zod";


export const PetSchema = z.object({
    type: z.enum(['cat', 'dog']),
    breed: z.string()
})
export const Authentication = z.string().openapi({
    param: {
        in: 'header',
        name: 'authorization'
    },
    ref: 'authentication-header'
})
export const petHandler: RequestHandler<any, any, z.infer<typeof PetSchema>, any, any> = (req, res) => {
    res.status(200).json({
        status: 200,
        title: 'success',
        details: `${ req.body.type }/breeds/${ req.body.breed }`
    }).send()
}