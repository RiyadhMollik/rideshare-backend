const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/user');
require('dotenv').config();
const axios = require('axios');
const generateOtp = require('../utils/generateOtp');
const { OAuth2Client } = require('google-auth-library');
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
const serviceAccount = require('../config/ride-sharing-54f52-firebase-adminsdk-v7oa1-82297cbb2a.json');

const admin = require('firebase-admin');

const generateReferralCode = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
};
const sendOtp = async (req, res) => {
  console.log('phone_number:', req.body.phone_number);
  const { phone_number } = req.body;
  console.log('phone_number:', phone_number);
  
  let user = await User.findOne({ where: { phone_number } });
  const otp = generateOtp();
  const expiresAt = new Date(Date.now() + 5 * 60000);
  if (user) {
    user.otp = otp;
    user.otp_expires_at = expiresAt;
    await user.save();
  } else {
    const referralCode = generateReferralCode();
    user = await User.create({
      phone_number,
      otp,
      referral_code: referralCode,
      otp_expires_at: expiresAt
    });
  }
//  res.status(202).json({ message: 'OTP sent successfully'});
  // Send the OTP to the user
  //const apiKey = process.env.SMS_API_KEY;
  const apiKey= process.env.TOKHON_SMS_API_KEY;
  
  const senderId = 'helpNhelper';
  const message = `Your OTP for Tokhon is ${otp}`;
// ashride api
  // const url = `http://bulksmsbd.net/api/smsapi`;
  // // const params = {
  // //   api_key: apiKey,
  // //   type: 'text',
  // //   number: phone_number,
  // //   senderid: senderId,
  // //   message: message
  // // };

  //tokhn otp api
  const url = `https://api.sms.net.bd/sendsms`;
   const params = {
    api_key: apiKey,
    to: phone_number,
    msg: message
  };

  try {
    const response = await axios.get(url, { params });
    console.log('response:', response);
    
    const statusCode = response.status;
      //   //ashride
    // if (statusCode === 202) {
  
    //   //res.json({ user_id: user.user_id });
    // } 
    if(statusCode === 200){
      res.json({ user_id: user.user_id });
    }
    
    else if (statusCode == 1001) {
      res.status(400).json({ message: 'Invalid number' });
    } else if(statusCode == 200){
        res.status(200).json({ message: 'OTP sent successfully' });
    }

    else {
      res.status(200).json({ message: 'Failed to send OTP' });
    }
    
  } catch (error) {
    console.error('Error sending OTP:', error);
    res.status(500).json({ message: 'Failed to send OTP' });
  }
};
const verifyOtp = async (req, res) => {
  const { phone_number, otp } = req.body;

  const user = await User.findOne({ where: { phone_number } });
  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }

  if (user.otp_expires_at < new Date()) {
    return res.status(400).json({ message: 'OTP expired' });
  }

  if (user.otp === otp) {
    user.otp = null;
    user.otp_expires_at = null;
    await user.save();

    const token = jwt.sign({ user_id: user.user_id }, process.env.JWT_SECRET);
    return res.json({ token, user });
  } else {
    return res.status(400).json({ message: 'Invalid OTP' });
  }
};

const gmailLogin = async (req, res) => {
  const { email, name, profile_picture } = req.body;

  let user = await User.findOne({ where: { email } });
  if (!user) {
    user = await User.create({
      email,
      name,
      profile_picture,
      is_verified: false // Set to false for document verification
    });
  }

  const token = jwt.sign({ user_id: user.user_id }, process.env.JWT_SECRET);
  res.json({ token, user });
};

// Initialize Firebase Admin SDK
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const googleLogin = async (req, res) => {
  const { id_token, email, name, profile_picture } = req.body;

  try {
    // Verify the ID token using Firebase Admin SDK
   // TODO: work o this.
//     const decodedToken = await admin.auth().verifyIdToken(id_token);
// console.log("decodedToken ",decodedToken);
//     if (decodedToken.email !== email) {
//       return res.status(400).json({ message: 'Invalid user' });
//     }

    // Check if the user already exists in your database
    let user = await User.findOne({ where: { email } });

    if (!user) {
      const referralCode = generateReferralCode();
      // Create a new user if they don't exist
      user = await User.create({
        email,
        name,
        profile_picture,
        referral_code: referralCode,
        is_verified: false, // Set to false for document verification
      });
    } else {
    
      // Update the user's info with the latest from Google
      user.name = name;
      user.profile_picture = profile_picture;
      
      await user.save();
    }

    
    // Generate a JWT token for your application
    const token = jwt.sign({ user_id: user.user_id }, process.env.JWT_SECRET);

    res.json({ token, user });
  } catch (error) {
    console.error('Firebase token verification failed:', error);
    res.status(500).json({ message: 'Google login failed' });
  }
};


const adminLogin = async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Check if the user is an admin
    if (user.user_type !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Verify the password
    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Generate a token
    const token = jwt.sign(
      { user_id: user.user_id, user_type: user.user_type, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );
    res.json({ token });
  } catch (err) {
    res.status(500).json({ message: 'Something went wrong', error: err.message });
  }
};




module.exports = { sendOtp, verifyOtp, googleLogin,adminLogin };
