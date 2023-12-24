import { z } from 'zod';
import { body, HasteRequestHandler, path, query, requiresMany, response } from '../../../src';
import {
  AsyncCreationRequest,
  JobAcceptedSchema,
  PetId,
  PetSchema,
  PetWithIdSchema,
} from './schemas';

export const searchPetRequirements = requiresMany(
  query('id', PetId),
  query('async', AsyncCreationRequest),
  response('202',  JobAcceptedSchema),
  response('200',  PetWithIdSchema),
);

export const searchPets: HasteRequestHandler<typeof searchPetRequirements> = (req, res) => {
  if (req.query.async) {
    res.status(202).json({
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
export const getOnePetRequirements = requiresMany(
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

export const createPetRequirements = requiresMany(
  body(PetSchema),
  path('id', z.string()),
  query('async', AsyncCreationRequest)
);

export const createPetHandler: HasteRequestHandler<typeof createPetRequirements> = (req, res) => {
  if (req.query.async) {
    res.status(202).json({
      status: 202,
      title: 'accepted',
      details: '/job/8b280029-dec0-4b75-9027-2c737a38c8a3',
    });
  }
  res.status(200).json({
    status: 202,
    title: 'accepted',
    details: `${req.body.type}/breeds/${req.body.breed}`,
  });
};
