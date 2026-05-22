// Route files declare what URLs exist for a given resource and which
// controller function handles each one. Keeping routes separate from
// controllers makes it easy to see the API surface at a glance.

import { Router } from "express";
import { getHealth } from "../controllers/health.controller.js";
//                                                          ^^^
// Note the ".js" extension on the import even though the source file is .ts.
// This is a quirk of using ES Modules with TypeScript: at runtime, the
// imports will resolve to .js files (after compilation). Using .js in the
// source code keeps the import paths valid in both worlds. It feels weird
// at first — you get used to it.

// A Router is a "mini-application" — a collection of routes that can be
// mounted under a path prefix in the main app. Lets us split up routes
// into logical files.
const router = Router();

// Map the HTTP verb + path to the controller function.
// "GET /" here will become "GET /health" once we mount the router
// under the /health prefix in index.ts (next step).
router.get("/", getHealth);

export default router;