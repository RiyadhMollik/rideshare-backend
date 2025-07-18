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
const Role = require('../models/Role');
const { Op } = require('sequelize');

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
  const { phone_number , user_type} = req.body;
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
      user_type,
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
  const { phone_number, otp , push_token } = req.body;

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
    user.push_token = push_token;
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

const createAdminUser = async (req, res) => {
  try {
    const { email, phone_number, password, name, roleId, gender } = req.body;

    // Validate required fields
    if (!email || !phone_number || !password || !name || !roleId || !gender) {
      return res.status(400).json({ error: 'All fields (email, phone_number, password, name, roleId, gender) are required' });
    }

    // Validate gender
    if (!['Male', 'Female'].includes(gender)) {
      return res.status(400).json({ error: 'Gender must be either Male or Female' });
    }

    // Check if email or phone number already exists
    const existingUser = await User.findOne({
      where: { [Op.or]: [{ email }, { phone_number }] },
    });
    if (existingUser) {
      return res.status(400).json({ error: 'Email or phone number already in use' });
    }

    // Check if role exists
    const role = await Role.findByPk(roleId);
    if (!role) {
      return res.status(400).json({ error: 'Invalid role ID' });
    }

    // Hash the password
    const saltRounds = 10;
    const password_hash = await bcrypt.hash(password, saltRounds);

    // Create the admin user
    const newUser = await User.create({
      email,
      phone_number,
      password_hash,
      name,
      user_type: 'admin',
      roleId,
      gender,
      is_verified: true,
      created_at: new Date(),
      updated_at: new Date(),
    });

    return res.status(201).json({ message: 'Admin user created successfully', user: newUser });
  } catch (error) {
    console.error('Error creating admin user:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

// Get all admin users with pagination and search
 const getAdminUsers = async (req, res) => {
  try {
    const { page = 1, itemsPerPage = 5, search = '' } = req.query;
    const offset = (page - 1) * itemsPerPage;

    const where = {
      user_type: 'admin',
      [Op.or]: [
        { name: { [Op.like]: `%${search}%` } },
        { email: { [Op.like]: `%${search}%` } },
      ],
    };

    const { count, rows } = await User.findAndCountAll({
      where,
      include: [
        {
          model: Role,
          as: 'Role',
          attributes: ['id', 'name'],
          required: false, // Allow users with null roleId
        },
      ],
      attributes: ['user_id', 'name', 'email', 'phone_number', 'roleId', 'gender'],
      limit: parseInt(itemsPerPage),
      offset: parseInt(offset),
    });

    const totalPages = Math.ceil(count / itemsPerPage);

    return res.status(200).json({
      users: rows,
      totalPages,
    });
  } catch (error) {
    console.error('Error fetching admin users:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

// Update an admin user
 const updateAdminUser = async (req, res) => {
  try {
    const { user_id } = req.params;
    const { email, phone_number, password, name, roleId, gender } = req.body;
    console.log(user_id);
    
    // Validate required fields
    if (!email || !phone_number || !name || !roleId || !gender) {
      return res.status(400).json({ error: 'Required fields (email, phone_number, name, roleId, gender) are missing' });
    }

    // Validate gender
    if (!['Male', 'Female'].includes(gender)) {
      return res.status(400).json({ error: 'Gender must be either Male or Female' });
    }

    // Check if user exists and is an admin
    const user = await User.findByPk(user_id);
    if (!user || user.user_type !== 'admin') {
      return res.status(404).json({ error: 'Admin user not found' });
    }

    // Check for email or phone number conflicts
    const existingUser = await User.findOne({
      where: {
        [Op.or]: [{ email }, { phone_number }],
        user_id: { [Op.ne]: user_id },
      },
    });
    if (existingUser) {
      return res.status(400).json({ error: 'Email or phone number already in use' });
    }

    // Check if role exists
    const role = await Role.findByPk(roleId);
    if (!role) {
      return res.status(400).json({ error: 'Invalid role ID' });
    }

    // Prepare updates
    const updates = {
      email,
      phone_number,
      name,
      roleId,
      gender,
      updated_at: new Date(),
    };

    // Update password if provided
    if (password) {
      const saltRounds = 10;
      updates.password_hash = await bcrypt.hash(password, saltRounds);
    }

    // Apply updates
    await user.update(updates);

    return res.status(200).json({ message: 'Admin user updated successfully', user });
  } catch (error) {
    console.error('Error updating admin user:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

// Delete an admin user
const deleteAdminUser = async (req, res) => {
  try {
    const { user_id } = req.params;

    // Check if user exists and is an admin
    const user = await User.findByPk(user_id);
    if (!user || user.user_type !== 'admin') {
      return res.status(404).json({ error: 'Admin user not found' });
    }

    // Delete the user
    await user.destroy();

    return res.status(200).json({ message: 'Admin user deleted successfully' });
  } catch (error) {
    console.error('Error deleting admin user:', error);
    return res.status(500).json({ error: 'Internal server error' });
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

module.exports = { sendOtp, verifyOtp, googleLogin,adminLogin , deleteAdminUser,updateAdminUser , getAdminUsers ,createAdminUser };
