import { setupWorker } from 'msw/browser';
import { db } from './db';
import { handlers } from './handlers';

export const worker = setupWorker(...handlers);
// Persist after every mocked response so a full page load keeps created/updated records.
worker.events.on('response:mocked', () => db.save());
