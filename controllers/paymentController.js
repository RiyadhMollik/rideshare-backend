const Transaction = require('../models/transaction');
const { Sequelize } = require('sequelize');
const redisClient = require('../config/redis');
const ServiceVehicle = require('../models/serviceVehicle');
const RideRequest = require('../models/rideRequestModel');
const User = require('../models/user');
const GlobalSettings = require('../models/settings'); // Import the new GlobalSettings model
const sequelize = new Sequelize(process.env.DB_NAME, process.env.DB_USER, process.env.DB_PASSWORD, {
  host: process.env.DB_HOST,
  dialect: 'mysql',
  dialectModule: require('mysql2'),
  logging: false,
});
// Utility functions for calculation
const toNumber = (value) => Number(value) || 0;
const calculatePercentage = (amount, percent) => parseFloat((amount * percent / 100).toFixed(2));
const updateBalance = (balance, amount) => {
  const numericBalance = toNumber(balance);
  const numericAmount = toNumber(amount);
  return parseFloat((numericBalance + numericAmount).toFixed(2));
};

exports.processPayment = async (req, res) => {
  const { rideRequestId, paymentMethod, couponCode } = req.body;
  const userId = req.user.user_id;
  console.log(rideRequestId, paymentMethod, couponCode , userId);
  
  const t = await sequelize.transaction();
  try {
    const rideRequest = await RideRequest.findByPk(rideRequestId);

    if (!rideRequest) {
      await t.rollback();
      return res.status(404).json({ message: 'Ride request not found' });
    }
    console.log(userId, rideRequest.driver_id);
    
    // Fetch required data in parallel
    const [users, globalSettings] = await Promise.all([

      User.findAll({
        where: { user_id: [userId, rideRequest.driver_id, 1] },
      }),
      GlobalSettings.findOne(), // Fetch global settings
    ]);

    // Check if required data was found

    if (users.length < 3) {
      await t.rollback();
      return res.status(404).json({ message: 'Required users not found' , users });
    }
    if (!globalSettings) {
      await t.rollback();
      return res.status(404).json({ message: 'Global settings not found' });
    }
    // Extract user data
    const passenger = users.find(user => user.user_id === userId);
    const driver = users.find(user => user.user_id === rideRequest.driver_id);
    const admin = users.find(user => user.user_id === 1);
    const totalFare = toNumber(rideRequest.fare); // Total fare including service charge
    const serviceChargePercentage = globalSettings.service_charge;
    // Remove service charge to get the actual fare
    const fare = parseFloat((totalFare / (1 + (serviceChargePercentage / 100))).toFixed(2));
    const serviceCharge = calculatePercentage(fare, globalSettings.service_charge);
    const adminCommission = calculatePercentage(fare, globalSettings.commission);
    const referralCommission = calculatePercentage(fare, globalSettings.referral_commission);
    const totalAdminCommission = adminCommission
      - (passenger.referred_by ? referralCommission : 0)
      - (driver.referred_by ? referralCommission : 0);
    console.log("Payments ", fare, serviceCharge, adminCommission, referralCommission, totalAdminCommission);
    // Wallet balance checks and updates
    if (paymentMethod === 'wallet') {
      const totalUserDeduction = fare + serviceCharge;
      if (toNumber(passenger.wallet_balance) < totalUserDeduction) {
        await t.rollback();
        return res.status(402).json({ message: 'Insufficient wallet balance' });
      }
      passenger.wallet_balance = updateBalance(passenger.wallet_balance, -totalUserDeduction);
    }else if (paymentMethod === 'cash') {
      if (toNumber(passenger.wallet_balance) < serviceCharge) {
        console.log(passenger.user_id);
        console.log(serviceCharge);
        await t.rollback();
        return res.status(402).json({ message: 'Insufficient wallet balance for service charge' });
      }
      passenger.wallet_balance = updateBalance(passenger.wallet_balance, -serviceCharge);

      if (toNumber(driver.wallet_balance) < adminCommission) {
        await t.rollback();
        return res.status(402).json({ message: 'Insufficient driver balance for admin commission' });
      }
      driver.wallet_balance = updateBalance(driver.wallet_balance, -adminCommission);
    }
    // Apply referral commissions if applicable
    const applyReferralCommission = async (userId, amount, description) => {
      const referrer = await User.findByPk(userId, { transaction: t });
      referrer.wallet_balance = updateBalance(referrer.wallet_balance, amount);
      await referrer.save({ transaction: t });
      await Transaction.create({
        user_id: referrer.user_id,
        ride_request_id: rideRequestId,
        amount,
        payment_method: paymentMethod,
        status: 'completed',
        description,
      }, { transaction: t });
    };
    if (passenger.referred_by) await applyReferralCommission(passenger.referred_by, referralCommission, 'passenger referral commission');
    if (driver.referred_by) await applyReferralCommission(driver.referred_by, referralCommission, 'driver referral commission');

    // Update admin balance
    admin.wallet_balance = updateBalance(admin.wallet_balance, totalAdminCommission + serviceCharge);

    // Update driver’s balance if payment method was wallet
    if (paymentMethod === 'wallet') {
      driver.wallet_balance = updateBalance(driver.wallet_balance, fare - adminCommission);
    }

    // Save updates for admin, passenger, and driver in parallel
    await Promise.all([
      admin.save({ transaction: t }),
      passenger.save({ transaction: t }),
      driver.save({ transaction: t }),
    ]);

    // Create transactions for admin commission, service charge, and driver payment
    const createTransaction = (userId, amount, description, paymentMethod) => Transaction.create({
      user_id: userId,
      ride_request_id: rideRequestId,
      amount,
      payment_method: paymentMethod,
      status: 'completed',
      description,
    }, { transaction: t });

    await Promise.all([
      createTransaction(admin.user_id, totalAdminCommission, 'admin commission for ride', "wallet"),
      createTransaction(admin.user_id, serviceCharge, 'service charge for ride', "wallet"),
      createTransaction(passenger.user_id, serviceCharge, 'paid service charge', "wallet"),
      createTransaction(driver.user_id, totalAdminCommission, 'paid admin commission', "wallet"),
      createTransaction(driver.user_id, fare - adminCommission, 'payment for ride', paymentMethod),
      createTransaction(passenger.user_id, fare, 'paid for ride', paymentMethod)
    ]);
    // Update ride request status
    rideRequest.status = 'ride_active';
    await rideRequest.save({ transaction: t });

    // Emit event to notify ride status update
    const io = req.app.get('socketio');
    io.to(`rideRequest:${rideRequestId}`).emit('rideStatusUpdate', {
      rideRequestId,
      status: 'ride_active',
      userId,
      riderId: rideRequest.driver_id,
      paymentMethod
    });
    await t.commit();
    res.status(201).json({ message: 'Payment successful' });
  } catch (error) {
    if (t.finished !== 'commit') {
      await t.rollback();
    }
    console.log(error);

    res.status(500).json({ message: 'Failed to process payment', error: error.message });
  }
};
