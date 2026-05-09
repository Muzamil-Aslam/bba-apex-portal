const Joi = require('joi');

exports.validateRegister = (req, res, next) => {
  const schema = Joi.object({
    name: Joi.string().min(2).max(100).required(),
    uid: Joi.string().min(5).max(20).required(),
    email: Joi.string().email().required(),
    password: Joi.string().min(6).required(),
    course: Joi.string().allow('', null),
    semester: Joi.number().min(1).max(8).allow(null),
    phone: Joi.string().pattern(/^[0-9]{10}$/).allow('', null)
  });
  const { error } = schema.validate(req.body);
  if (error) return res.status(400).json({ success: false, message: error.details[0].message });
  next();
};

exports.validateLogin = (req, res, next) => {
  const schema = Joi.object({ email: Joi.string().email().required(), password: Joi.string().required() });
  const { error } = schema.validate(req.body);
  if (error) return res.status(400).json({ success: false, message: error.details[0].message });
  next();
};
