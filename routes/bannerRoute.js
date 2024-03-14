const express = require("express");

const {
  getBanners,
  getBanner,
  createBanner,
  updateBanner,
  deleteBanner,
  uploadBannerImage,
  resizeBannerImage,
  setImageToBody,
  getBannerProducts,
  deleteProductFromBanner,
  getSevenProductsForBanner,
  AddproductToBanner,
} = require("../services/bannerService");

const { uploadImages, updateImage, updateImages, deleteImages, uploadBannerImages } = require("../config/cloudinary");

const authService = require("../services/authService");
const productModel = require("../models/productModel");
const bannerModel = require("../models/bannerModel");

const router = express.Router();

// router
//   .route("/")
//   .get(getBanners)
//   .post( authService.protect, authService.allowedTo("admin", "manager"), uploadBannerImage,createBanner);
//     // resizeBannerImage, uploadBannerImages('banner'),

// router
//   .route("/:id")
//   .get(getBanner)
//   .put(authService.protect,authService.allowedTo("admin", "manager"), uploadBannerImage,updateImage,updateImages('banner'),updateBanner)
//     // resizeBannerImage,setImageToBody,

//   .delete(authService.protect,authService.allowedTo("admin", "manager"),setImageToBody,deleteImages,deleteBanner);
//   // Route to get products associated with a banner
// router.get("/:id/products", getBannerProducts);

// // Route to delete a specific product from the banner
// router.delete("/:bannerId/products/:productId", deleteProductFromBanner);

// router.get("/products/seven", getSevenProductsForBanner);
//^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
router.post("/",authService.protect,authService.allowedTo("admin", "manager"),createBanner)
//^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^

router.post("/:bannerId/products/:productId",authService.protect,authService.allowedTo("admin", "manager"),AddproductToBanner )
//^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^

router.get('/:bannerId/products',authService.protect,authService.allowedTo("admin", "manager"), getBannerProducts);
// Endpoint for deleting a product from the banner
router.delete("/:bannerId/products/:productId",authService.protect,authService.allowedTo("admin", "manager"),deleteProductFromBanner)

// Endpoint for deleting a product from the banner
router.delete("/:bannerId",authService.protect,authService.allowedTo("admin", "manager"),deleteBanner)



module.exports = router;
