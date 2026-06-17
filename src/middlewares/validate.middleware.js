// src/middlewares/validate.middleware.js
import InvariantError from '../exceptions/InvariantError.js';

const validate = (schema, source = 'body') => {
  return (req, res, next) => {
    const { error } = schema.validate(req[source], { abortEarly: true });
    
    if (error) {
      const errorMessage = error.details[0].message;
      
      return next(new InvariantError(errorMessage));
    }
    
    next(); 
  };
};

export default validate;