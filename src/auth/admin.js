import createError from "http-errors";

export const adminOnlyMiddleware = (req, res, next) => {
  if (req.author.position === "Admin") {
    next();
  } else {
    next(createError(403, "Admins only!"));
  }
};
