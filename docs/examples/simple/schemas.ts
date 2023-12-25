import { z } from 'zod';
import { extendZodWithOpenApi } from 'zod-openapi';

extendZodWithOpenApi(z);

const UsernamePassword = z.tuple([
  z.string().openapi({
    description: 'Your username',
    example: 'admin',
  }),
  z.string().openapi({
    description: 'Your password',
    example: 'password',
  }),
]);
export const UsernamePasswordAuth = z
  .string()
  .transform((arg) => UsernamePassword.parse(atob(arg.slice(6)).split(':')))
  .openapi({
    description:
      'A base64 encoded string with the username followed by a colon(:) then a password.',
    example: btoa('username:password'),
    ref: 'username-password-auth',
  });

export const PetId = z.string().uuid('Must be a valid pet identifier.').openapi({
  description: 'The unique pet identifier for your fur baby.',
  example: '8b280029-dec0-4b75-9027-2c737a38c8a3',
  ref: 'pet-id',
});

export const AsyncCreationRequest = z
  .enum(['true', 'false', ''])
  .default('false')
  .transform((v) => v === 'true' || v === '')
  .openapi({
    description: 'Process the creation of this pet async and return a 201 immediately with a jobId',
    example: 'true',
    ref: 'async-query-param',
  });


export const PetSchema = z.object({
  type: z.enum(['cat', 'dog']).openapi({
    description: "The type of animal you're creating, either 'cat' or 'dog'.",
    example: 'cat',
  }),
  breed: z.string().openapi({
    description: "The breed of animal you're creating, can be any string.",
    example: 'Border Collie',
  }),
  vaccinated: z.boolean().openapi({
    description: 'Is this animal up to date on vaccinations.'
  })
})

export const PetWithIdSchema = PetSchema.extend({
  id: PetId
})


export const JobAcceptedSchema = z.object({
  status: z.number().or(z.string()),
  title: z.string(),
  details: z.string().uuid().openapi({
    description: 'Where you can find the result of this job when it\'s ready.',
    example: '/jobs/8b280029-dec0-4b75-9027-2c737a38c8a3'
  })
})