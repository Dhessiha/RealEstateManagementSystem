// Express 4 doesn't catch rejected promises from async route handlers —
// an unhandled one just hangs the request forever instead of returning
// an error. Wrap every async handler with this so a database failure
// (e.g. MySQL unreachable) turns into a clean 500 response instead.
export function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}
