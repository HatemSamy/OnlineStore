
// // transaction.routes.js

// const express = require('express');
// const Moamalat = require('../services/transaction.controller');
// const Transaction = require('../models/transaction');
// const router = express.Router();

// const moamalat = new Moamalat();
// router.post('/process-payment', async (req, res) => {
//     try {
//       // Simulate payment completion
//       const paymentCompleted = Math.random() < 0.5; // 50% chance of success
  
//       if (paymentCompleted) {
//         // Handle successful payment
//         const transactionApproved = await moamalat.transactionApproved(req.body.reference);
//          console.log(transactionApproved);
//         if (transactionApproved) {
//           // Payment approved
//           // Save payment details to the database
//           const newTransaction = new Transaction({
//             reference: req.body.reference,
//             amount: req.body.amount,
//             timestamp: new Date(),
//             status: 'Completed'
//           });
  
//           await newTransaction.save(); // Save the transaction to the database
  
//           res.status(200).json({ success: true, message: 'Payment completed successfully' });
//         } else {
//           // Payment declined
//           res.status(400).json({ success: false, message: 'Payment declined' });
//         }
//       } else {
//         // Payment failed
//         res.status(400).json({ success: false, message: 'Payment failed' });
//       }
//     } catch (error) {
//       console.error('Error processing payment:', error);
//       res.status(500).json({ success: false, message: 'Internal server error' });
//     }
//   });
  

// module.exports = router;

const express = require('express');
const { createPayment } = require('../services/transaction.controller');
const router = express.Router({ mergeParams: true });
router.route('/createPayment').post(createPayment)
module.exports = router;