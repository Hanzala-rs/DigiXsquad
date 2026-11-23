import { db, DEMO_REQUEST } from './db';
import { mockSession } from './session';

/** Test helpers: reset the shared mock backend (requests, talents, engagements, session). */
export { DEMO_REQUEST };
export const hireStore = {
  reset() {
    db.reset();
    mockSession.set(null);
  },
};
