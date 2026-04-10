/**
 * Production-safe no-op instrumentation.
 *
 * Medusa will attempt to import `apps/backend/instrumentation` on start.
 * We ship this JS file so production images don't crash when the TS example
 * (`instrumentation.ts`) isn't compiled into the runtime output.
 */

function register() {
  // no-op
}

module.exports = { register }

