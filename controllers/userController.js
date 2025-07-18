const User = require('../models/user');
const jwt = require('jsonwebtoken');
require('dotenv').config();
const TransactionModel = require('../models/transaction');
const { Op } = require('sequelize');
// Existing function to get a user's own profile
const getUserProfile = async (req, res) => {
  const userId = req.user.user_id;
  const user = await User.findByPk(userId);
  console.log("user:", user);
  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }
  res.json(user);
};
const getCountAllDriverAndUser = async (req, res) => {
  try {
    // Get total user count
    const totalUsers = await User.count();

    // Get total drivers count
    const totalDrivers = await User.count({
      where: {
        user_type: 'driver',
      },
    });

    // Get total normal users count (non-driver)
    const totalNormalUsers = await User.count({
      where: {
        user_type: 'normal',
      },
    });

    // Send response
    res.status(200).json({
      totalUsers,
      totalDrivers,
      totalNormalUsers,
    });
  } catch (error) {
    console.error('Error fetching counts:', error);
    res.status(500).json({ message: 'Error fetching counts' });
  }
};
const updateUserProfile = async (req, res) => {
  const userId = req.user.user_id;
  console.log(req.body);
  const { name, email, gender, profile_picture, address, nid_photo, push_token, phone_number, referral_code, user_type } = req.body;
  try {
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Update user details
    user.name = name || user.name;
    user.profile_picture = profile_picture || user.profile_picture;
    user.address = address || user.address;
    user.nid_photo = nid_photo || user.nid_photo;
    user.phone_number = phone_number || user.phone_number;
    user.push_token = push_token || user.push_token;
    user.gender = gender || user.gender;
    user.email = email || user.email;
    user.user_type = user_type || user.user_type;

    // Handle referral_code if provided
    if (referral_code) {
      const referredUser = await User.findOne({ where: { referral_code } });

      if (referredUser) {
        user.referred_by = referredUser.user_id;
      } else {
        return res.status(400).json({ message: 'Invalid referral code' });
      }
    }

    await user.save();
    res.json({ message: 'Profile updated successfully', user });
  } catch (error) {
    console.error('Error updating profile:', error);

    // Check for Sequelize unique constraint violation
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({ message: 'Phone number or email already in use' });
    }

    // Check for MySQL duplicate entry error (fallback)
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ message: 'Phone number or email already in use' });
    }

    res.status(500).json({ message: 'Failed to update profile' });
  }
};


// New function to get all users (Admin Only)
const getAllUsers = async (req, res) => {
  try {
    const {is_verified, user_type, search = '', page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    // Build filter
    let filter = {};

    // Filter by user type
    if (user_type && ['normal', 'driver', 'admin'].includes(user_type)) {
      filter.user_type = user_type;
    }

    if (typeof is_verified !== 'undefined') {
      if (is_verified === 'true') filter.is_verified = true;
      else if (is_verified === 'false') filter.is_verified = false;
    }
    // Add search condition
    if (search.trim() !== '') {
      filter[Op.or] = [
        { name: { [Op.like]: `%${search}%` } },
        { email: { [Op.like]: `%${search}%` } },
        { phone_number: { [Op.like]: `%${search}%` } },
      ];
    }

    // Count total users with filters
    const totalCount = await User.count({ where: filter });

    // Fetch users with filters + pagination
    const users = await User.findAll({
      where: filter,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['user_id', 'DESC']],
    });

    const totalPages = Math.ceil(totalCount / limit);

    res.json({
      users,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalCount,
        limit: parseInt(limit),
      },
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ message: 'Failed to fetch users' });
  }
};



// New function to get a single user by ID (Admin Only)
const getUserById = async (req, res) => {
  const userId = req.params.id;
  try {
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ message: 'Failed to fetch user' });
  }
};

const getUserWalletBalance = async (req, res) => {
  const userId = req.user.user_id; // Assumes user ID is in the request object
  try {
    const user = await User.findByPk(userId, {
      attributes: ['wallet_balance'], // Only fetch wallet_balance
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ wallet_balance: parseFloat(user.wallet_balance) });
  } catch (error) {
    console.error('Error fetching wallet balance:', error);
    res.status(500).json({ message: 'Failed to fetch wallet balance' });
  }
};

const updateUserWalletBalance = async (req, res) => {

  const { userId, amount, description } = req.body; // `amount` and `description` are required

  try {
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const updatedBalance = parseFloat(user.wallet_balance) + parseFloat(amount);
    if (updatedBalance < 0) {
      return res.status(400).json({ message: 'Insufficient wallet balance' });
    }

    // Update wallet balance
    user.wallet_balance = updatedBalance;
    await user.save();

    // Log the transaction
    await TransactionModel.create({
      ride_request_id: null, // No ride associated, so it's null
      user_id: userId,
      amount: parseFloat(amount),
      payment_method: 'wallet',
      status: 'completed',
      description,
    });

    res.json({
      message: 'Wallet balance updated successfully',
      wallet_balance: updatedBalance,
    });
  } catch (error) {
    console.error('Error updating wallet balance:', error);
    res.status(500).json({ message: 'Failed to update wallet balance' });
  }
};

const getUserTransactions = async (req, res) => {
  const userId = req.user.user_id; // Assumes user ID is in the request object
  const { page = 1, limit = 10 } = req.query; // Default pagination values

  try {
    const offset = (page - 1) * limit;

    const transactions = await TransactionModel.findAll({
      where: { user_id: userId },
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['created_at', 'DESC']], // Latest transactions first
    });

    res.json({ transactions });
  } catch (error) {
    console.error('Error fetching transactions:', error);
    res.status(500).json({ message: 'Failed to fetch transactions' });
  }
};


// New function to update any user profile (Admin Only)
const adminUpdateUserProfile = async (req, res) => {
  const userId = req.params.id;
  const { name, wallet_balance, profile_picture, address, nid_photo, push_token, phone_number, user_type, is_verified } = req.body;

  try {
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.name = name || user.name;
    user.profile_picture = profile_picture || user.profile_picture;
    user.address = address || user.address;
    user.nid_photo = nid_photo || user.nid_photo;
    user.phone_number = phone_number || user.phone_number;
    user.push_token = push_token || user.push_token;
    user.user_type = user_type || user.user_type;
    user.is_verified = is_verified !== undefined ? is_verified : user.is_verified;
    user.wallet_balance = wallet_balance || user.wallet_balance;

    await user.save();
    res.json({ message: 'User profile updated successfully', user });
  } catch (error) {
    console.error('Error updating user profile:', error);

    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ message: 'Phone number or email already in use' });
    }

    res.status(500).json({ message: 'Failed to update user profile' });
  }
};

const deleteUser = async (req, res) => {
  try {
    const { userId } = req.params;

    // Find the user by ID
    const deletedUser = await User.destroy({ where: { user_id: userId } });

    if (!deletedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({ message: "User deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const addDriver = async (req, res) => {
  const {
    email,
    phone_number,
    name,
    address,
    gender,
    vehicleTypeId,
    image,
    verified,
    vehicleDetails,
    status,
  } = req.body;

  // File uploads
  const nid_photo = req.files?.nid_photo
    ? `${req.protocol}://${req.get("host")}/uploads/${req.files.nid_photo[0].filename}`
    : null;

  const profile_picture = req.files?.profile_picture
    ? `${req.protocol}://${req.get("host")}/uploads/${req.files.profile_picture[0].filename}`
    : null;

  const drivingLicense = req.files?.drivingLicense
    ? `${req.protocol}://${req.get("host")}/uploads/${req.files.drivingLicense[0].filename}`
    : null;

  const vehiclePicFront = req.files?.vehiclePicFront
    ? `${req.protocol}://${req.get("host")}/uploads/${req.files.vehiclePicFront[0].filename}`
    : null;

  try {
    // Check if user already exists
    const existingUser = await User.findOne({
      where: {
        [Op.or]: [{ email }, { phone_number }],
      },
    });

    if (existingUser) {
      return res.status(400).json({ message: "Email or phone number already registered" });
    }

    // Create the user
    const driver = await User.create({
      email,
      phone_number,
      name,
      address,
      nid_photo,
      profile_picture,
      gender,
      user_type: "driver",
      is_verified: false,
      wallet_balance: 0.0,
      rating: 0.0,
    });

    const vehicleType = await VehicleType.findByPk(vehicleTypeId);
    if (!vehicleType) {
      return res.status(400).json({ message: "Invalid vehicle type ID" });
    }

    // Construct documents object
    const documents = {
      nid: nid_photo,
      drivingLicense,
      vehiclePicFront,
    };

    // Create DriverVehicle entry
    const driverVehicle = await DriverVehicle.create({
      driverId: driver.user_id,
      vehicleTypeId: vehicleType.id,
      vehicleTypeName: vehicleType.name,
      description: vehicleType.description,
      image,
      extraOptions: vehicleType.extraOptions,
      documents,
      verified,
      vehicleDetails: vehicleDetails ? JSON.parse(vehicleDetails) : null,
      status: status || "pending",
    });

    return res.status(201).json({
      message: "Driver registered successfully",
      driver: {
        user_id: driver.user_id,
        email: driver.email,
        name: driver.name,
        phone_number: driver.phone_number,
        user_type: driver.user_type,
      },
      driverVehicle,
    });
  } catch (error) {
    console.error("Error adding driver:", error);
    return res.status(500).json({ message: "Server error" });
  }
};


module.exports = {
  getUserProfile,
  updateUserProfile,
  getAllUsers,
  getUserById,
  getUserWalletBalance,
  updateUserWalletBalance,
  getUserTransactions,
  adminUpdateUserProfile,
  deleteUser,
  getCountAllDriverAndUser,
  addDriver
};
