// transactionModel.js
const mongoose = require('mongoose');

// Define schema for transaction
const transactionSchema = new mongoose.Schema({
    // transactionId: {
    //     type: String,
    //     required: true,
    //     unique: true
    // },
    status: {
        type: String,
        required: true
    },
    amount: {
        type: Number,
        required: true
    },
    reference: {
        type: String,
        required: true
    },
    timestamp: {
        type: Date,
        default: Date.now
    }
});

// Create Transaction model
const Transaction = mongoose.model('Transaction', transactionSchema);

module.exports = Transaction;
