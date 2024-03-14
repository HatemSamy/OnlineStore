const twilio = require('twilio');

// Initialize Twilio client
const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

// Function to send OTP via SMS
exports.sendOTP = async (otp) => {
  // try {
    await client.messages.create({
      body: `Your OTP for signup: ${otp}`,
      to: '+201222598099',
      from: '+17604254407' 
    });
    
    console.log('OTP sent successfully');
  // } catch (error) {
  //   console.error('Error sending OTP:', error);
  //   // throw new Error('Failed to send OTP');
  // }
};



// const axios = require('axios');
// const qs = require('qs');
// let data = qs.stringify({
//   body: `Your OTP for signup: ${otp}`,
//       to: '+201222598099',
//       from: '+17604254407'
// });

// let config = {
//   method: 'post',
//   maxBodyLength: Infinity,
//   url: 'https://api.twilio.com/2010-04-01/Accounts/{{TWILIO_ACCOUNT_SID}}/Messages.json',
//   headers: { 
//     'Content-Type': 'application/x-www-form-urlencoded', 
//     'Authorization': `Basic ${Buffer.from(`${process.env.TWILIO_ACCOUNT_SID}:${process.env.TWILIO_AUTH_TOKEN`).toString('base64')}`
//   },
//   data : data
// };

// axios.request(config)
// .then((response) => {
//   console.log(JSON.stringify(response.data));
// })
// .catch((error) => {
//   console.log(error);
// });

