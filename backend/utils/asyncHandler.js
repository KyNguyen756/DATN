/**
 * Wraps an async express route handler so that any rejected promise
 * is forwarded to the next error-handling middleware instead of
 * causing an unhandled rejection crash.
 *
 * Usage: router.get('/path', asyncHandler(controller.method));
 */
module.exports = fn => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);
