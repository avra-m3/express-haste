import { z } from 'zod';
import { body, HasteRequestHandler, header, path, query, requires, response } from "express-haste";
import {
    AsyncCreationRequest,
    JobAcceptedSchema,
    PetId,
    PetSchema,
    PetWithIdSchema, UsernamePasswordAuth
} from "./schemas";


export const searchPetRequirements = requires(
    query('id', PetId),
    query('async', AsyncCreationRequest),
    response('200', PetWithIdSchema),
    response('202', JobAcceptedSchema),
);

export const searchPets: HasteRequestHandler<typeof searchPetRequirements> = (req, res) => {
    if (req.query.async) {
        return res.status(202).json({
            status: 202,
            title: 'accepted',
            details: '/job/8b280029-dec0-4b75-9027-2c737a38c8a3',
        });
    }

    res.status(200).json({
        id: req.query.id,
        type: 'cat',
        breed: 'burmese',
        vaccinated: true,
    });
};
export const getOnePetRequirements = requires(
    path('id', PetId),
    response('200', PetWithIdSchema)
);

export const getOnePet: HasteRequestHandler<typeof getOnePetRequirements> = (req, res) => {
    res.status(200).json({
        id: req.params.id,
        type: 'cat',
        breed: 'burmese',
        vaccinated: true,
    });
};

export const createPetRequirements = requires(
    body(PetSchema),
    path('id', z.string()),
    query('async', AsyncCreationRequest),
    header('authorization', UsernamePasswordAuth),
    response('202', JobAcceptedSchema),
    response('201', JobAcceptedSchema),
);

export const createPetHandler: HasteRequestHandler<typeof createPetRequirements> = (req, res) => {
    if (req.query.async) {
        return res.status(202).json({
            status: 202,
            title: 'accepted',
            details: '/job/8b280029-dec0-4b75-9027-2c737a38c8a3',
        });
    }
    res.status(200).json({
        status: 201,
        title: 'created',
        details: `${ req.body.type }/breeds/${ req.body.breed }`,
    });
};
