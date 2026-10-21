/** validate(zodSchema) — parses req.body and replaces it with the cleaned result. */
export const validate = (schema) => (req, _res, next) => {
  req.body = schema.parse(req.body ?? {});
  next();
};
