// const dayjs = require('dayjs');
// const fetch = require('node-fetch');
// const crypto = require('crypto');

const ApiError = require("../utils/apiError");

// const testApiUrl = 'https://tnpg.moamalat.net';

// const prodApiUrl = 'https://npg.moamalat.net';
// const testConfig = {
//   merchantId: '10081014649',
//   terminalId: '99179395',
//   secureKey: '39636630633731362D663963322D346362642D386531662D633963303432353936373431',
//   prod: false
// };

// class Moamalat {
//   constructor({
//     merchantId,
//     terminalId,
//     secureKey = '',
//     prod
//   } = testConfig) {
//     this.merchantId = merchantId;
//     this.terminalId = terminalId;
//     this.secureKey = secureKey;
//     this.apiUrl = prod ? prodApiUrl : testApiUrl;
//   }

//   checkout(amount, reference = '', date = new Date()) {
//     const dateTime = dayjs(date).format('YYYYMMDDHHmm');
//     const _amount = amount * 1000;
//     const hashData = {
//       MerchantId: this.merchantId,
//       TerminalId: this.terminalId,
//       Amount: _amount.toString(),
//       DateTimeLocalTrxn: dateTime,
//       MerchantReference: reference.toString()
//     };
//     return {
//       MID: this.merchantId,
//       TID: this.terminalId,
//       AmountTrxn: _amount,
//       MerchantReference: reference.toString(),
//       TrxDateTime: dateTime,
//       SecureHash: this.generateSecureHash(hashData)
//     };
//   }

//   async transactionApproved(reference) {
//     const transactions = await this.transactions(reference);
//     return transactions && transactions.Transactions.length > 0 &&
//       transactions.Transactions[0].DateTransactions[0].Status === 'Approved';
//   }

//   async transactions(reference, options = {}) {
//     const hashData = {
//       MerchantId: this.merchantId,
//       TerminalId: this.terminalId,
//       DateTimeLocalTrxn: dayjs().format('YYYYMMDDHHmmss')
//     };
//     const {
//       displayLength = 1,
//       displayStart = 0,
//       dateFrom,
//       dateTo,
//       sortCol,
//       sortDir
//     } = options;
//     const body = {
//       ...hashData,
//       MerchantReference: reference && reference.toString(),
//       DisplayLength: displayLength,
//       DisplayStart: displayStart,
//       DateFrom: dateFrom && dayjs(dateFrom).format('YYYYMMDD'),
//       DateTo: dateTo && dayjs(dateTo).format('YYYYMMDD'),
//       SortCol: sortCol,
//       SortDir: sortDir,
//       SecureHash: this.generateSecureHash(hashData)
//     };
//     const res = await fetch(
//       `${this.apiUrl}/cube/paylink.svc/api/FilterTransactions`,
//       {
//         headers: {
//           'Content-Type': 'application/json'
//         },
//         method: 'POST',
//         body: JSON.stringify(body)
//       }
//     );
//     return await res.json();
//   }

//   generateSecureHash(hashData) {
//     const params = new URLSearchParams(hashData);
//     params.sort();
//     const data = params.toString();
//     const key = Buffer.from(this.secureKey, 'hex');
//     const hmac = crypto.createHmac('sha256', key).update(data).digest('hex');
//     return hmac;
//   }
// }

// module.exports = Moamalat;
const asyncHandler = require("express-async-handler");

const Moamalat = require("moamalat").default;
const moamalat = new Moamalat({
  merchantId: '10081014649',
  terminalId: '99179395',
  secureKey: '39636630633731362D663963322D346362642D386531662D633963303432353936373431',
  prod: true,
});
exports.createPayment = asyncHandler(async (req, res, next) => {


  // example invoice
  const invoice = {
    id: 1,
    amount: req.body.amount,
    date: new Date(),
  };

  // use the data from the invoice for checkout
  const mycheckout = moamalat.checkout(
    invoice.amount, 
    invoice.id, 
    invoice.date 
  );
  res.json(mycheckout)

});



