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
// Endpoint for create banner
router.post("/",authService.protect,authService.allowedTo("admin", "manager"),createBanner)
// Endpoint for get banner products
router.get('/products',authService.protect,authService.allowedTo("admin", "manager","user-wholesale","user-normal"), getBannerProducts);
// Endpoint for deleting a product from the banner
router.delete("/:productId",authService.protect,authService.allowedTo("admin", "manager"),deleteProductFromBanner)
// Endpoint for deleting a product from the banner
router.delete("/",authService.protect,authService.allowedTo("admin", "manager"),deleteBanner)


module.exports = router;
