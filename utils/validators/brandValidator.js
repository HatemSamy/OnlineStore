const { check, body } = require("express-validator");
const slugify = require("slugify");

const validatorMiddleware = require("../../middlewares/validatorMiddleware");

// 1- rules
// 2- middlewares => catch errors from rules if exist
// in file validator in utils

exports.getBrandValidator = [
  check("id").isMongoId().withMessage("Invalide Brand id format"),
  validatorMiddleware,
];

exports.createBrandValidator = [
  check("name")
    .notEmpty()
    .withMessage("Brand required")
    .isLength({ min: 3 })
    .withMessage("Too short Brand name")
    .isLength({ max: 32 })
    .withMessage("Too long Brand name")
    .custom((val, { req }) => {
      req.body.slug = slugify(val);
      return true;
    }),
  validatorMiddleware,
];

// dry=> Don't repeat your self => ولكن هنا عادي لان لازم تعمل اتشكات

exports.updateBrandValidator = [
  check("id").isMongoId().withMessage("Invalide Brand id format"),
  body("name").optional().custom((val, { req }) => {
    req.body.slug = slugify(val);
    return true;
  }),
  validatorMiddleware,
];

exports.deleteBrandValidator = [
  check("id").isMongoId().withMessage("Invalide Brand id format"),
  validatorMiddleware,
];
