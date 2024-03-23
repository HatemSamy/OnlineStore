require("dotenv").config();
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;

const client = require('twilio')(accountSid, authToken);



function sendOTP(phoneNumber, otp) {
  return client.messages.create({
      body: `Your OTP is: ${otp}`,
      from: '+17604254407',
      to: phoneNumber
  });
}

module.exports = sendOTP;

