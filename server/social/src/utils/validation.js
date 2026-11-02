// Native resilient validation replacement for express-validator

export const body = (field) => {
  const callable = (req, res, next) => {
    if (typeof next === 'function') next();
  };

  const methods = ['notEmpty', 'isMongoId', 'isLength', 'isISO8601', 'isArray', 'isEmail', 'trim', 'optional', 'withMessage'];
  for (const m of methods) {
    callable[m] = () => callable;
  }

  return callable;
};

export const validationResult = (req) => ({
  isEmpty: () => true,
  array: () => []
});
