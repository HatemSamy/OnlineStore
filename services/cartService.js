const asyncHandler = require("express-async-handler");
const ApiError = require("../utils/apiError");

const Product = require("../models/productModel");
const Coupon = require("../models/couponModel");
const Cart = require("../models/cartModel");
const productModel = require("../models/productModel");

const calcTotalCartPrice = (cart, userType) => {
  let totalPrice = 0;
    cart.cartItems.forEach((item) => {
      totalPrice += item.quantity * item.price;
    });
  cart.totalCartPrice = totalPrice;
  cart.totalPriceAfterDiscount = undefined;
  return cart;
};

//___________________________________________________________________________________________________

exports.addProductToCart = async (req, res) => {
  try {
    const { productId, color, quantity } = req.body;
    const userId = req.user._id;

    let cart = await Cart.findOne({ user: userId });

    if (!cart) {
      let productPrice;
      const product = await Product.findById(productId);
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }
      
      if (req.user.role === "user-normal") {
        productPrice = product.priceNormal;
      } else if (req.user.role === "user-wholesale") {
        productPrice = product.priceWholesale;
      }

      cart = await Cart.create({
        user: userId,
        cartItems: [{ product: productId, color, price: productPrice,quantity}],
        totalCartPrice: productPrice * quantity,
        totalPriceAfterDiscount: 0,
      });
      return res.status(201).json({ message: 'Product added to cart successfully', cart });
    }

    const existingCartItem = cart.cartItems.find(item => item.product.toString() === productId && item.color === color);
    if (existingCartItem) {
      existingCartItem.quantity += quantity;
    } else {
      const product = await Product.findById(productId);
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }
      let productPrice;
      if (req.user.role === "user-normal") {
        productPrice = product.priceNormal;
      } else if (req.user.role === "user-wholesale") {
        productPrice = product.priceWholesale;
      }
      cart.cartItems.push({
        product: productId,
        quantity,
        color,
        price: productPrice
      });
    }

    cart.totalCartPrice = cart.cartItems.reduce((total, item) => total + item.price * item.quantity, 0);
    cart.totalPriceAfterDiscount = cart.totalCartPrice;

    await cart.save();

    res.status(200).json({ message: 'Product added to cart successfully', cart });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
};



exports.getLoggedUserCart = asyncHandler(async (req, res, next) => {
  const cart = await Cart.findOne({ user: req.user._id })
    .populate({
      path: "cartItems.product",
      select: "title titleAr description descriptionAr price image",
    })
    .populate({
      path: "user",
      select: "name email phone lat lng address role",
    });

  if (!cart) {
    return res.status(200).json({
      message: `There is no cart for this user id: ${req.user._id}`,
      data: {},
    });
  }

  // Calculate the total cart price
  const updatedCart = calcTotalCartPrice(cart);

  // Replace product IDs with product details
  const populatedCartItems = updatedCart.cartItems.map((item) => ({
    _id: item._id,
    quantity: item.quantity,
    color: item.color,
    price: item.price,
    product: {
      _id: item.product._id,
      title: item.product.title,
      titleAr: item.product.titleAr,
      description: item.product.description,
      descriptionAr: item.product.descriptionAr,
      price: item.product.price,
      image: item.product.image.url,
      // Add other fields as needed
    },
  }));

  const populatedCart = {
    status: "success",
    numOfCartItems: populatedCartItems.length,
    data: {
      _id: updatedCart._id,
      cartItems: populatedCartItems,
      user: updatedCart.user,
      createdAt: updatedCart.createdAt,
      updatedAt: updatedCart.updatedAt,
      __v: updatedCart.__v,
      totalCartPrice: updatedCart.totalCartPrice,
      totalPriceAfterDiscount: updatedCart.totalPriceAfterDiscount,
    },
  };

  res.status(200).json(populatedCart);
});


// @desc    Remove specific cart item
// @route   Delete /api/v1/cart/:itemId
// @access  Private/Protected/User
exports.removeSpecificCartItem = asyncHandler(async (req, res, next) => {
  const cart = await Cart.findOneAndUpdate(
    { user: req.user._id },
    {
      $pull: { cartItems: { product: req.params.itemId } },
    },
    { new: true }
  );

  calcTotalCartPrice(cart);
  cart.save();

  res.status(200).json({
    status: "success",
    numOfCartItems: cart.cartItems.length,
    data: cart,
  });
});

// @desc    Remove logged user cart
// @route   Delete /api/v1/cart
// @access  Private/Protected/User
exports.clearCart = asyncHandler(async (req, res, next) => {
  await Cart.findOneAndDelete({ user: req.user._id });
  res.status(204).send();
});

// @desc    Update specific cart item quantity
// @route   PUT /api/v1/cart/:itemId
// @access  Private/Protected/User
exports.updateCartItemQuantity = asyncHandler(async (req, res, next) => {
  const { quantity } = req.body;
  const cart = await Cart.findOne({ user: req.user._id });

  if (!cart) {
    return next(
      new ApiError(`There is no cart for this user id : ${req.user._id}`, 404)
    );
  }

  const itemIndex = cart.cartItems.findIndex(
    (item) => item._id.toString() === req.params.itemId
  );
  if (itemIndex > -1) {
    const cartItem = cart.cartItems[itemIndex];
    cartItem.quantity = quantity;
    cart.cartItems[itemIndex] = cartItem;
  } else {
    return next(
      new ApiError(`There is no item for this id :${req.params.itemId}`, 404)
    );
  }

  calcTotalCartPrice(cart);
  await cart.save();

  res.status(200).json({
    status: "success",
    numOfCartItems: cart.cartItems.length,
    data: cart,
  });
});

// @desc    Apply coupon on logged user cart
// @route   PUT /api/v1/cart/applyCoupon
// @access  Private/Protected/User
exports.applyCoupon = asyncHandler(async (req, res, next) => {
  // 1) Get coupon based on coupon name
  const coupon = await Coupon.findOne({
    name: req.body.coupon,
    expire: { $gt: Date.now() },
  });

  if (!coupon) {
    return next(new ApiError(`Coupon is invalid or expired`));
  }

  // 2) Get logged user cart to get total cart price
  const cart = await Cart.findOne({ user: req.user._id });

  const totalPrice = cart.totalCartPrice;

  // 3) Calculate price after priceAfterDiscount
  const totalPriceAfterDiscount = (
    totalPrice -
    (totalPrice * coupon.discount) / 100
  ).toFixed(2);

  cart.totalPriceAfterDiscount = totalPriceAfterDiscount;
  await cart.save();

  res.status(200).json({
    status: "success",
    numOfCartItems: cart.cartItems.length,
    data: cart,
  });
});
