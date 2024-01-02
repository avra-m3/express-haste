import { requiresParameter } from './requiresParameter';
import { requiresBody } from './requiresBody';

export const body = requiresBody;

export const path = requiresParameter('path');
export const cookie = requiresParameter('cookie');
export const query = requiresParameter('query');
export const header = requiresParameter('header');

export { requiresResponse as response } from './requiresResponse';
export { requiresMany as requires } from './requiresMany';

export * from './operation';
