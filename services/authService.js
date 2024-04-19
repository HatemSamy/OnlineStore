const crypto = require("crypto");

// eslint-disable-next-line import/no-extraneous-dependencies
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const otpGenerator = require('otp-generator');
// const { sendOTP } = require('./twilio');

const asyncHandler = require("express-async-handler");
const ApiError = require("../utils/apiError");
const sendEmail = require("../utils/sendEmail");
const createToken = require("../utils/createToken");
const { sanatizeUser } = require("../utils/sanatizeData");


const User = require("../models/userModel");
const sendOTP = require("../utils/twilio");

// exports.signup = asyncHandler(async (req, res, next) => {
//   let active = false; 
//   const { name, email, password, phone, profileImg, lat, lng, address, role } = req.body;
//   if (role === "manager" || role === "admin") {
//     return next(new ApiError("You must be a manager or an admin.", 400));
//   }

//   if (role !== "user-wholesale") {
//     active = true;
//   }

//   const otp = Math.floor(1000 + Math.random() * 9000);
//   console.log(otp);
//   const newUser = new User({
//     name,
//     email,
//     password,
//     phone,
//     profileImg,
//     lat,
//     lng,
//     address,
//     role,
//     active,
//     OTP:otp
//   });

  
//   await sendOTP(phone, otp)
//   .then(message => console.log(`OTP sent: ${message.sid}`))
//   .catch(error => console.error(error));


//   const user = await newUser.save();
//   delete user._doc.password;
//   res.status(201).json({ message: "OTP sent to your phone number for verification.", userId: user._id });
// });

exports.signup = asyncHandler(async (req, res, next) => {
  let active = false;
  const { name, email, password, phone, profileImg, lat, lng, address, role } = req.body;
  
  if (role === "manager" || role === "admin") {
      return next(new ApiError("You must be a manager or an admin.", 400));
  }

  if (role !== "user-wholesale") {
      active = true;
  }

  const otp = Math.floor(1000 + Math.random() * 9000);
  console.log(otp);

  const newUser = new User({
      name,
      email,
      password,
      phone,
      profileImg,
      lat,
      lng,
      address,
      role,
      active,
      OTP: otp
  });

  if (email) {
      // Send OTP via email
      await sendEmail(email, "OTP", otp)
          .then(info => console.log(`Email sent: ${info.response}`))
          .catch(error => console.error(error));
  } else if (phone) {
      // Send OTP via phone
      await sendOTP(phone, otp)
          .then(message => console.log(`OTP sent: ${message.sid}`))
          .catch(error => console.error(error));
  } else {
      return next(new ApiError("You must provide either an email address or a phone number.", 400));
  }

  const savedUser = await newUser.save();
  delete savedUser._doc.password;
  res.status(201).json({ message: "OTP sent for verification.", user: savedUser});
});


// verify account
exports.verifyAccount = asyncHandler(async (req, res, next) => {
  const { email, otp } = req.body;



  const user = await User.findOne({ email, OTP: otp });
  if (!user) {
    return next(new ApiError("User account does not exist", 404));
  }
     console.log();
  if (otp !== user.OTP) {
    return next(new ApiError("Incorrect OTP", 404));
  }

  const verifiedUser = await User.findOneAndUpdate(
    { email, OTP: otp },
    { Verified: true },
    { new: true }
  );

  res.status(201).json({
    message: "Your account has been verified successfully. Please login now.",
    userId: user._id
  });
});





// @desc    Login
// @route   POST /api/v1/auth/login
// @access  Public
exports.login = asyncHandler(async (req, res, next) => {
  const { email, phone, password } = req.body;

  if (!email && !phone) {
    return next(new ApiError("Email or phone is required", 400));
  }
  if (!password) {
    return next(new ApiError("Password is required", 400));
  }
    const user = await User.findOne(
      {
        $or: [{ email }, { phone }],
      },
    );
    if (!user) {
      return next(new ApiError("Incorrect email or password", 401));
    }

    if (!user.Verified) {
      return next(new ApiError("your account not verifyed , verify your account frist", 401));
    }
    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) {
      return next(new ApiError("Incorrect email or password", 401));
    }


    const payLoad = {
      userId: user._id,
      active: user.active,
    };

    const token = createToken(payLoad);
    delete user._doc.password;
    res.status(200).json({ data: sanatizeUser(user), token });

});

// @ desc   make sure the user is logged in
exports.protect = asyncHandler(async (req, res, next) => {
  // 1) check if token exists, if exist get
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  }
  if (!token) {
    return next(
      new ApiError(
        "You are not login, please login to get access  this route",
        401
      )
    );
  }

  // 2) verify token (no change happens, expired token)
  const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);

  // 3) check if user exists
  const currentUser = await User.findById(decoded.userId);
  if (!currentUser) {
    return next(
      new ApiError(
        "The user that belong tp this token does no longer exist",
        401
      )
    );
  }

  if (decoded.active === false && currentUser.role === "user-wholesale") {
    return next(new ApiError("The user is not activated", 401));
  }

  // 4) check if user change his password after token created
  if (currentUser.passwordChangedAt) {
    const passChangedTimestamp = parseInt(
      currentUser.passwordChangedAt.getTime() / 1000,
      10
    );
    // password changed after token created (Error)
    if (passChangedTimestamp > decoded.iat) {
      return next(
        new ApiError(
          "User recently changed his password. please login again..",
          401
        )
      );
    }
  }

  // 5) check if user activate or not activate
  if (currentUser.active === false) {
    return next(
      new ApiError(
        "User not active. please go to settings to activate your email..",
        401
      )
    );
  }

  req.user = currentUser;
  next();
});

// @desc    Authorization (User Permissions)
// (Clogars) ...roles => ['admin] or ['user']
exports.allowedTo = (...roles) =>
  asyncHandler(async (req, res, next) => {
    // 1) access roles
    // 2) access registered user (req.user.role)
    if (!roles.includes(req.user.role)) {
      return next(
        new ApiError("You are not allowed to access this route", 403)
      );
    }

    // if (req.user.enablePermission === false && req.user.role === "manager") {
    //   return next(
    //     new ApiError(
    //       "The manager is not add any products or categories or some permissions",
    //       401
    //     )
    //   );
    // }
    next();
  });

// @desc    Forget Password
// @route   POST /api/v1/auth/forgotPassword
// @access  Public
exports.forgetPassword = asyncHandler(async (req, res, next) => {
  // 1) Get user by email
  const user = await User.findOne({
    $or: [{ email: req.body.email }, { phone: req.body.phone }],
  });

  if (!user) {
    return next(
      new ApiError(
        `There is no user with this email or this phone ${
          req.body.email || req.body.phone
        }`,
        404
      )
    );
  }

  // 2) If user is exist, Generate hsash reset random 6 digits and save it in db
  const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
  const hashedResetCode = crypto
    .createHash("sha256")
    .update(resetCode)
    .digest("hex");

  // Save hashed password reset code into db
  user.passwordResetCode = hashedResetCode;
  // Add expriration time for password reset code (10 min)
  user.passwordResetExpires = Date.now() + 10 * 60 * 1000;
  user.passwordResetVerified = false;

  user.save();

  const message = `Hi ${user.name},\nWe received a reset the password on your Mozart Account.\n${resetCode}\nEnter this code to complete your reset.\nThanks for helping us keep your account secure.\nThe Mozart Team`;

  if (req.body.phone) {
    await sendSMS(message, req.body.phone);
    res
      .status(200)
      .json({ status: "Success", message: "Rest code send to phone" });
  }

  // 3) Send the reset code via email
  try {
    await sendEmail({
      email: user.email,
      subject: "Your password reset code (valid for 10 minutes)",
      message,
    });
  } catch (err) {
    user.passwordResetCode = undefined;
    user.passwordResetExpires = undefined;
    user.passwordResetVerified = undefined;

    await user.save();
    return next(new ApiError("There is an error in sending email", 500));
  }

  res
    .status(200)
    .json({ status: "Success", message: "Rest code send to email" });
});

// @desc    Verify password reset code
// @route   POST /api/v1/auth/verifyResetCode
// @access  Public
exports.verifyPasswordResetCode = asyncHandler(async (req, res, next) => {
  // 1) Get user based on reset code
  const hashedResetCode = crypto
    .createHash("sha256")
    .update(req.body.resetCode)
    .digest("hex");

  const user = await User.findOne({
    passwordResetCode: hashedResetCode,
    passwordResetExpires: { $gt: Date.now() },
  });
  if (!user) {
    return next(new ApiError("Reset code invalid or expired"));
  }

  // 2) Reset code valide
  user.passwordResetVerified = true;
  await user.save();

  res.status(200).json({ status: "Success" });
});

// @desc    Reset password
// @route   POST /api/v1/auth/resetPassword
// @access  Public
exports.resetPassword = asyncHandler(async (req, res, next) => {
  // 1) Get user based on email
  const user = await User.findOne({
    $or: [{ email: req.body.email }, { phone: req.body.phone }],
  });
  if (!user) {
    return next(
      new ApiError(
        `There is no user with email or with phone ${
          req.body.email || req.body.phone
        }`,
        404
      )
    );
  }

  // 2) Check if reset code verified
  if (!user.passwordResetVerified) {
    return next(new ApiError("Reset code not verified", 400));
  }

  user.password = req.body.newPassword;
  user.passwordResetCode = undefined;
  user.passwordResetExpires = undefined;
  user.passwordResetVerified = undefined;

  await user.save();

  // 3) If everything is ok, generate token
  const token = createToken(user._id);
  res.status(200).json({ token });
});
