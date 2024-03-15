const asyncHandler = require("express-async-handler");
const { v4: uuidv4 } = require("uuid");
const sharp = require("sharp");
const ApiFeatures = require("../utils/apiFeatures");

const factory = require("./handlersFactory");
const { uploadMixOfImages } = require("../middlewares/uploadImageMiddleware");

const Banner = require("../models/bannerModel");
const productModel = require("../models/productModel");
const bannerModel = require("../models/bannerModel");

exports.uploadBannerImage = uploadMixOfImages([
  {
    name: "images",
    maxCount: 7,
  },
]);

exports.createBanner = asyncHandler(async (req, res) => {
  try {
    const { productIds } = req.body;
    if (!Array.isArray(productIds) || productIds.length === 0) {
      return res.status(400).json({ message: "Invalid product IDs" });
    }
    const products = await productModel.find({ _id: { $in: productIds }});

    if (products.length === 0) {
      return res.status(400).json({ message: "No valid products found for the user" });
    }

    let banner = await bannerModel.findOne();

    if (!banner) {
      const imageUrls = products.map(product => ({
        productId: product._id,
        url: product.image.url
      }));
      banner = new bannerModel({ images: imageUrls });
    } else {
      const existingProductIds = banner.images.map(image => image.productId.toString());

      const newProducts = products.filter(product => !existingProductIds.includes(product._id.toString()));

      if (newProducts.length === 0) {
        return res.status(400).json({ message: "All selected products already exist in the banner" });
      }

      const newImageUrls = newProducts.map(product => ({
        productId: product._id,
        url: product.image.url
      }));
      banner.images = [...banner.images, ...newImageUrls];
    }

    await banner.save();

    res.status(201).json({ message: "Banner created/updated successfully", banner });
  } catch (error) {
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
});

exports.getBannerProducts = asyncHandler(async (req, res) => {
  try {
    const banner = await bannerModel.findOne().populate('images.productId');
    console.log(banner); 
    if (!banner) {
      return res.status(404).json({ message: "Banner not found" });
    }

    const products = banner.images.map(image => image.productId);

    res.status(200).json({ message:"all banner products  data",data:products });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});


exports.deleteProductFromBanner = asyncHandler(async (req, res) => {
  try {
    const { productId } = req.params;
    let banner = await bannerModel.findOne();

    if (!banner) {
      return res.status(404).json({ message: "Banner not found" });
    }
    const index = banner.images.findIndex(image => image.productId.toString() === productId);

    if (index === -1) {
      return res.status(404).json({ message: "Product not found in the banner" });
    }
    banner.images.splice(index, 1);
    await banner.save();

    res.status(200).json({ message: "Product deleted from the banner successfully", banner });
  } catch (error) {
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
});


exports.deleteBanner = asyncHandler(async (req, res) => {
  try {
    const deletedBanner = await bannerModel.findOneAndDelete();

    if (!deletedBanner) {
      return res.status(404).json({ message: "Banner not found" });
    }

    res.status(200).json({ message: "Banner deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
});


// exports.setImageToBody = factory.setImageToBody(Banner);

// exports.resizeBannerImage = asyncHandler(async (req, res, next) => {
//   //1- Image processing for images
//   if (req.files.images) {
//     req.body.images = [];
//     await Promise.all(
//       req.files.images.map(async (img, index) => {
//         const imageName = `banner-${uuidv4()}-${Date.now()}-${index + 1}.jpeg`;

//         await sharp(img.buffer)
//           .resize(2000, 1333)
//           .toFormat("jpeg")
//           .jpeg({ quality: 95 })
//           .toFile(`uploads/banners/${imageName}`);

//         // Save image into our db
//         req.body.images.push(imageName);
//       })
//     );

//     next();
//   }
//   //   if (req.files.images) {
//   //     const imagesFileName = `banner-${uuidv4()}-${Date.now()}.jpeg`;

//   //     await sharp(req.files.images[0].buffer)
//   //       .resize(2000, 1333)
//   //       .toFormat("jpeg")
//   //       .jpeg({ quality: 95 })
//   //       .toFile(`uploads/banners/${imagesFileName}`);

//   //     // Save image into our db
//   //     req.body.images = imagesFileName;
//   //   }
// });

// @desc    Get list of banners
// @route   GET /api/v1/banners
// @access  Public
// exports.getBanners = factory.getAll(Banner);
// let result = {};
//     for(let index = 0 ; index < documents.length ; index++) {
//       result[data._id] = {

//       }
//     }

// exports.getBanners = asyncHandler(async (req, res, next) => {
//   let filter = {};
//   if (req.filterObj) {
//     filter = req.filterObj;
//   }
//   // Build query
//   const documentsCounts = await Banner.countDocuments();
//   const apiFeatures = new ApiFeatures(Banner.find(filter), req.query)
//     .paginate(documentsCounts)
//     .filter()
//     .limitFields()
//     .sort();

//   const { mongooseQuery, paginationResult } = apiFeatures;
//   const documents = await mongooseQuery;

//   if (documents.length > 0) {
//     const { _id, images } = documents[0];

//     const data = {
//       id: _id,
//       images: images.map((image, index) => ({
//         // [`banner${index + 1}`]: {
//         url: image.url,
//         imageId: image.imageId,
//         // },
//       })),
//     };

//       res.status(200).json({ results: 1, paginationResult, data });
//   } else {
//     res.status(200).json({ results: 0, paginationResult, data: {} });
//   }
// });
//****************************************************************** */
//// exports.getBanners = asyncHandler(async (req, res, next) => {
//   let filter = {};
//   if (req.filterObj) {
//     filter = req.filterObj;
//   }
//   // Build query
//   const documentsCounts = await Banner.countDocuments();
//   const apiFeatures = new ApiFeatures(Banner.find(filter), req.query)
//     .paginate(documentsCounts)
//     .filter()
//     .limitFields()
//     .sort();

//   // Execute query
//   const { mongooseQuery, paginationResult } = apiFeatures;
//   const documents = await mongooseQuery;

//   // Check if documents length is greater than 0
//   if (documents.length > 0) {
//     // Return the first document as an object
//     const data = documents;

//     res.status(200).json({ results: 1, paginationResult, data: data[0] });
//   } else {
//     res.status(200).json({ results: 0, paginationResult, data: {} });
//   }
// });
//****************************************************************** */
// @desc    Get specific banner by id
// @route   GET /api/v1/banners/:id
// @access  Public
////exports.getBanner = factory.getOne(Banner);

// @desc    Create banner
// @route   POST  /api/v1/banners
// @access  Private
// exports.createBanner = factory.createOne(Banner);
//************************************************************ */
//// exports.createBanner = async (req, res) => {
//   // try {
//     const images = req.body.images.map((file) => ({
//       url: file.url,
//       imageId: file.imageId,
//     }));

//     const banner = new Banner({ images });
//     await banner.save();

//     res
//       .status(201)
//       .json({ message: "Banner created successfully", data: banner });
// //   } catch (error) {
// //     res.status(500).json({ error: "Failed to create banner" });
// //   }
// };

//***************************************************************** */

// exports.getBannerProducts = asyncHandler(async (req, res, next) => {
//   try {
//     // Assuming you want to fetch 7 random products
//     const products = await productModel.aggregate([{ $sample: { size: 7 } }]);
    
//     // Assuming each product has an image URL
//     const bannerImages = products.map(product => {
//       return {
//         url: product.imageUrl, // Change 'imageUrl' to the actual field name in your product model
//         imageId: product._id // Assuming you want to associate product ID with the image
//       };
//     });

//     // Create or update banner with the retrieved product images
//     let banner = await Banner.findOne();
//     if (!banner) {
//       banner = new Banner({ images: bannerImages });
//       await banner.save();
//     } else {
//       banner.images = bannerImages;
//       await banner.save();
//     }

//     res.status(200).json({ success: true, data: banner });
//   } catch (error) {
//     return next(new ApiError("Failed to fetch banner products", 500));
//   }
// });
// @desc    Update specific banner
// @route   PUT /api/v1/banners/:id
// @access  Private
// exports.updateBanner = factory.updateOne(Banner);
//*************************************************************************** */
// @desc    Delete specific banner
// @route   DELETE /api/v1/banners/:id
// @access  Private
// exports.deleteBanner = factory.deleteOne(Banner);


////************************************************************** */
// get random products to set it in the banner
// exports.getBannerProducts = asyncHandler(async (req, res, next) => {
//   try {
//     // Assuming you want to fetch 7 random products
//     const products = await productModel.aggregate([{ $sample: { size: 7 } }]);
    
//     // Assuming each product has an image URL
//     const bannerImages = products.map(product => {
//       return {
//         url: product.imageUrl, 
//         imageId: product._id 
//       };
//     });

//     // Create or update banner with the retrieved product images
//     let banner = await Banner.findOne();
//     if (!banner) {
//       banner = new Banner({ images: bannerImages });
//       await banner.save();
//     } else {
//       banner.images = bannerImages;
//       await banner.save();
//     }

//     res.status(200).json({ success: true, data: banner });
//   } catch (error) {
//     return next(new ApiError("Failed to fetch banner products", 500));
//   }
// });

//************************************************ */
// Delete specific product fromthe banner 
// exports.deleteProductFromBanner = async (req, res, next) => {
//   const productId = req.params.productId;

//   try {
//     let banner = await Banner.findOne();

//     if (!banner) {
//       return next(new ApiError("Banner not found", 404));
//     }

//     // Remove the product from the banner
//     banner.images = banner.images.filter(image => image.imageId !== productId);
//     await banner.save();

//     res.status(200).json({ success: true, message: "Product removed from banner" });
//   } catch (error) {
//     return next(new ApiError("Failed to delete product from banner", 500));
//   }
// };

//************************************************************** */
// exports.getSevenProductsForBanner = async (req, res, next) => {
//   try {
//     // Assuming you want to fetch 7 random products
//     const products = await productModel.aggregate([{ $sample: { size: 7 } }]);
    
//     // Send the 7 products in the response
//     res.status(200).json({ success: true, data: products });
//   } catch (error) {
//     return next(new ApiError("Failed to fetch 7 products for the banner", 500));
//   }
// };