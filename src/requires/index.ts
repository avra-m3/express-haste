import { ZodSchema } from 'zod';
import { requiresParameter } from './requiresParameter';
import { requiresBody } from './requiresBody';

export const body = <S extends ZodSchema>(schema: S) => requiresBody(schema);

export const path = requiresParameter('path');
export const cookie = requiresParameter('cookie');
export const query = requiresParameter('query');
export const header = requiresParameter('header');

export {requiresResponse as response} from "./requiresResponse"

export * from './operation';
export * from './requiresMany';
