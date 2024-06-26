const categoryRoute = require("./categoryRoute");
const subCategoryRoute = require("./subCategoryRoute");
const brandRoute = require("./brandRoute");
const productRoute = require("./productRoute");
const userRoute = require("./userRoute");
const authRoute = require("./authRoute");
const reviewRoute = require("./reviewRoute");
const wishlistRoute = require("./wishlistRoute");
const addressRoute = require("./addressRoute");
const couponRoute = require("./couponRoute");
const cartRoute = require("./cartRoute");
const orderRoute = require("./orderRoute");
const bannerRoute = require("./bannerRoute");
const uploadImageFromUserRoute = require("./uploadImageFromUserRoute");
const sendMessageRoute = require("./sendMessageRoute");
const feedbackRoute = require("../services/feedbackService");
const synchronizationRpoter = require("../routes/synchronization.router");
const moamalatRouter = require("../routes/transactionRouter");

// const cat  = require("../src/Modules/Category/category.router");

const mountRoutes = (app) => {
  app.use("/api/v1/categoeires", categoryRoute);
  app.use("/api/v1/subcategoeires", subCategoryRoute);
  app.use("/api/v1/brands", brandRoute);
  app.use("/api/v1/products", productRoute);
  app.use("/api/v1/users", userRoute);
  app.use("/api/v1/auth", authRoute);
  app.use("/api/v1/reviews", reviewRoute);
  app.use("/api/v1/wishlist", wishlistRoute);
  app.use("/api/v1/addresses", addressRoute);
  app.use("/api/v1/coupons", couponRoute);
  app.use("/api/v1/cart", cartRoute);
  app.use("/api/v1/orders", orderRoute);
  app.use("/api/v1/banners", bannerRoute);
  app.use("/api/v1/uploadImage", uploadImageFromUserRoute);
  app.use("/api/v1/message", sendMessageRoute);
  app.use("/api/v1/feedback", feedbackRoute);
  app.use("/api/v1/configureAndSync",synchronizationRpoter);
  // app.use('/api/v1/moamalat', moamalatRouter);
  // app.use("/api/v1/getAllCategories", cat);
};

module.exports = mountRoutes;
