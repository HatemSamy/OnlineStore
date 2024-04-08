const sql = require('mssql');
const {connectAndQuery} = require('../config/database.js');

const productModel = require('../models/productModel.js');
const OrderModel = require('../models/orderModel');
const mongoose = require('mongoose');
const apiError = require('../utils/apiError.js');
const orderModel = require('../models/orderModel');



exports.syncOrdersToSQL = async function(req, res, next) {
  try {
    // Retrieve confirmed orders from MongoDB with populated cartItems.product
    var confirmedOrders = await OrderModel.find({ status: 'confirm' })
      .populate({
        path: 'cartItems.product',
        model: 'Product',
        select: 'ProductID',
      })
      .exec();

      console.log("--------------------------------------------------------");
      console.log(confirmedOrders);
      console.log("--------------------------------------------------------");
  
    if (confirmedOrders.length === 0) {
      console.log({ message: 'No confirmed orders to add.' });
      // return res.status(200).json({ message: 'No confirmed orders to add.' });
    }

    // Connect to SQL Server
    var connection = await connectAndQuery();

    // Add orders to SQL Server
    for (var i = 0; i < confirmedOrders.length; i++) {
      var order = confirmedOrders[i];

      // Check if the order already exists in SQL Server
      var existingOrder = await new sql.Request(connection)
        .input('orderNumber', sql.Int, order.orderNumber)
        .query('SELECT * FROM [dbo].[Order] WHERE orderNumber = @orderNumber');

      if (existingOrder.recordset.length > 0) {
        // Order already exists, skip insertion
        console.log('Order with orderNumber ' + order.orderNumber + ' already exists in SQL Server. Skipping insertion.');
        continue;
      }

      // Insert order
      var insertOrderQuery = `
        INSERT INTO [dbo].[Order] (orderNumber, userID, branchID, taxPrice, shippingPrice, totalOrderPrice, 
          paymentMethod, isPaid, paidAt, isDelivered, managerID, deliveredAt, status, acceptedAt, createdAt)
        VALUES (@orderNumber, @userID, @branchID, @taxPrice, @shippingPrice, @totalOrderPrice, 
          @paymentMethod, @isPaid, @paidAt, @isDelivered, @managerID, @deliveredAt, @status, @acceptedAt, @createdAt);
      `;

      var isPaidValue = order.isPaid ? 'true' : 'false';
      var isDeliveredValue = order.isDelivered ? 'true' : 'false';
      await new sql.Request(connection)
        .input('orderNumber', sql.Int, order.orderNumber)
        .input('userID', sql.NVarChar, order.user._id)
        .input('branchID', sql.NVarChar, order.branchId._id)
        .input('taxPrice', sql.Decimal(18, 2), order.taxPrice)
        .input('shippingPrice', sql.Decimal(18, 2), order.shippingPrice)
        .input('totalOrderPrice', sql.Decimal(18, 2), order.totalOrderPrice)
        .input('paymentMethod', sql.NVarChar, order.paymentMethod)
        .input('isPaid', sql.NVarChar,isPaidValue)
        .input('paidAt', sql.DateTime, order.paidAt)
        .input('isDelivered', sql.NVarChar,isDeliveredValue)
        .input('managerID', sql.NVarChar, order.managerId || null)
        .input('deliveredAt', sql.DateTime, order.deliveredAt || null)
        .input('status', sql.NVarChar, order.status)
        .input('acceptedAt', sql.DateTime, order.accepteddAt || null)
        .input('createdAt', sql.DateTime, order.createdAt)
        .query(insertOrderQuery);

      // Log success
      console.log('Order with orderNumber ' + order.orderNumber + ' added successfully.');

      // Loop through cartItems and store information in SQL Server
      for (var j = 0; j < order.cartItems.length; j++) {
        var cartItem = order.cartItems[j];
        try {
          var insertCartItemQuery = `
            INSERT INTO [dbo].[OrderCartItem] (
              OrderNumber, Quantity, Color, Price, ProductID
            )
            VALUES (
              @OrderNumber, @Quantity, @Color, @Price, @ProductID
            );
          `;

          await new sql.Request(connection)
            .input('OrderNumber', sql.Int, order.orderNumber)
            .input('Quantity', sql.Int, cartItem.quantity)
            .input('Color', sql.NVarChar, cartItem.color)
            .input('Price', sql.Decimal(18, 2), cartItem.price)
            .input('ProductID', sql.Int, cartItem.product && cartItem.product.ProductID ? cartItem.product.ProductID : null)
            .query(insertCartItemQuery);

          console.log('CartItem added successfully for OrderNumber: ' + order.orderNumber);
        } catch (cartItemError) {
          console.error('Error adding cart item for OrderNumber: ' + order.orderNumber, cartItemError);
        }
      }

      // Update order status in MongoDB
      await OrderModel.findByIdAndUpdate(order._id, { $set: { status: 'synced' } });
    }

    console.log({ message: 'Orders synced successfully' });
    // res.status(200).json({ message: 'Orders synced successfully' });
  } catch (error) {
    console.error('Error in syncOrdersToSQL:', error);
  }
};


exports.syncProductData = async (req, res, next) => {
  try {
    // Connect to SQL Server and retrieve data
    const connection = await connectAndQuery();

    // Retrieve products from SQL Server
    const productsResult = await new sql.Request(connection).query('SELECT * FROM Product');
    const products = productsResult.recordset;

    // Retrieve product images from SQL Server
    const productImagesResult = await new sql.Request(connection).query('SELECT * FROM ProductImages');
    const productImages = productImagesResult.recordset;

    await connection.close();

    // Transform SQL Server data
    const transformedData = products.map((sqlProduct) => {
      // Filter product images by ProductID
      const productImagesFiltered = productImages.filter((image) => image.ProductID === sqlProduct.ProductID);

      return {
        ProductID: sqlProduct.ProductID,
        title: sqlProduct.Title,
        titleAr: sqlProduct.TitleAr,
        slug: sqlProduct.Slug,
        description: sqlProduct.Description,
        descriptionAr: sqlProduct.DescriptionAr,
        quantity: sqlProduct.Quantity,
        sold: sqlProduct.Sold,
        priceNormal: sqlProduct.PriceNormal,
        priceWholesale: sqlProduct.PriceWholesale,
        priceAfterDiscount: sqlProduct.PriceAfterDiscount,
        colors: sqlProduct.Colors ? sqlProduct.Colors.split(',').map((color) => color.trim()) : [],
        image: {
          url: sqlProduct.ImageURL,
          imageId: sqlProduct.ImageID,
        },
        images: productImagesFiltered.map((image) => ({
          url: image.ImageURL,
          imageId: image.ImageID,
        })),
        category: sqlProduct.CategoryID,
        brand: sqlProduct.BrandID,
        ratingsAverage: sqlProduct.RatingsAverage,
        ratingsQuantity: sqlProduct.RatingsQuantity,
        createdAt: sqlProduct.CreatedAt,
        updatedAt: sqlProduct.UpdatedAt,
      };
    });

    // Transform numeric category and brand IDs to ObjectIds
    transformedData.forEach((product) => {
      if (product.category) {
        product.category = new mongoose.Types.ObjectId(product.category);
      }
      if (product.brand) {
        product.brand = new mongoose.Types.ObjectId(product.brand);
      }
    });

    // Get existing ProductIDs in MongoDB
    const existingProductIDs = await productModel.find().distinct('ProductID');

    // Loop through transformedData and update or add MongoDB records
    for (const productData of transformedData) {
      try {
        // Check if the product already exists in the database
        const existingProduct = await productModel.findOne({ ProductID: productData.ProductID });

        if (existingProduct) {
          // Update the existing product
          const updateResult = await productModel.updateOne(
            { ProductID: productData.ProductID },
            productData
          );
          console.log('MongoDB Record Updated:', productData.ProductID);
        } else {
          // Create a new product if it doesn't exist
          await productModel.create(productData);
          console.log('MongoDB Record Added:', productData.ProductID);
        }
      } catch (err) {
        console.error('Error synchronizing MongoDB record:', err);
      }
    }

    console.log('Data synchronization completed successfully.');
    // res.json({ message: 'Data synchronization completed successfully.' });
  } catch (error) {
    console.log('Error during synchronization:', error);
    next(new Error('Error during synchronization', { cause: 500 }));
  }
};


