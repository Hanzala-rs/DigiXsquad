import { setupServer } from 'msw/node';
import { handlers } from './handlers';

/** For Vitest. */
export const server = setupServer(...handlers);
