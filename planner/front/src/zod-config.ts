import { z } from 'zod';

// Zod otherwise probes `new Function` when a schema is created, which the
// Content-Security-Policy reports. Import this before anything that defines schemas.
z.config({ jitless: true });
