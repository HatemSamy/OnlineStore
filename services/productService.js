const asyncHandler = require("express-async-handler");
const { v4: uuidv4 } = require("uuid");
const sharp = require("sharp");
const ApiError = require("../utils/apiError");

const { uploadMixOfImages } = require("../middlewares/uploadImageMiddleware");
const factory = require("./handlersFactory");
const Product = require("../models/productModel");

exports.uploadProductImages = uploadMixOfImages([
  {
    name: "image",
    maxCount: 1,
  },
  {
    name: "images",
    maxCount: 5,
  },
]);

exports.setImageToBody = factory.setImageToBody(Product);

exports.createFilterObject = (req, res, next) => {
  let filterObject = {};
  if (req.params.categoryId) filterObject = { category: req.params.categoryId };
  req.filterObj = filterObject;
  next();
};

// exports.resizeProductImages = asyncHandler(async (req, res, next) => {
//   // console.log(req.files);
//   //1- Image processing for imageCover
//   if (req.files.imageCover) {
//     const imageCoverFileName = `product-${uuidv4()}-${Date.now()}-cover.jpeg`;

//     await sharp(req.files.imageCover[0].buffer)
//       .resize(2000, 1333)
//       .toFormat('jpeg')
//       .jpeg({ quality: 95 })
//       .toFile(`uploads/products/${imageCoverFileName}`);

//     // Save image into our db
//     req.body.imageCover = imageCoverFileName;
//   }
//   //2- Image processing for images
//   if (req.files.images) {
//     req.body.images = [];
//     await Promise.all(
//       req.files.images.map(async (img, index) => {
//         const imageName = `product-${uuidv4()}-${Date.now()}-${index + 1}.jpeg`;

//         await sharp(img.buffer)
//           .resize(2000, 1333)
//           .toFormat('jpeg')
//           .jpeg({ quality: 95 })
//           .toFile(`uploads/products/${imageName}`);

//         // Save image into our db
//         req.body.images.push(imageName);
//       })
//     );

//     next();
//   }
// });

// @desc    Get list of products
// @route   GET /api/v1/products
// @access  Public
exports.getProducts = factory.getAll(Product, "Products");

// @desc    Get specific product by id
// @route   GET /api/v1/products/:id
// @access  Public
exports.getProduct = factory.getOne(Product, "reviews");

// @desc    Create product
// @route   POST  /api/v1/products
// @access  Private
exports.createProduct = async (req, res) => {
  try {
    const { title, titleAr, slug, description, descriptionAr, quantity, priceNormal, priceWholesale, priceAfterDiscount, colors, image, images, category, subcategories, brand, ratingsAverage, ratingsQuantity,ProductID } = req.body;
      console.log({"ProductID" :req.body.ProductID });
      console.log({"ProductID" :req.body.priceNormal});

    // Check if the ProductID is provided by the client or handled automatically

    const product = new Product({
      title,
      titleAr,
      slug,
      description,
      descriptionAr,
      quantity,
      priceNormal,
      priceWholesale,
      priceAfterDiscount,
      colors,
      image,
      images,
      category,
      subcategories,
      brand,
      ratingsAverage,
      ratingsQuantity,
      ProductID
    });

    await product.save();

    res.status(201).json({ message: 'Product created successfully', product });
  } catch (error) {
    console.error(error);
    res.status(500).json({ status: 'error', error: error.message });
  }
};
// @desc    Update specific product
// @route   PUT /api/v1/products/:id
// @access  Private
// exports.updateProduct = factory.updateOne(Product);
exports.updateProduct = factory.updateOne(Product);

// @desc    Delete specific product
// @route   DELETE /api/v1/products/:id
// @access  Private
exports.deleteProduct = factory.deleteOne(Product);


