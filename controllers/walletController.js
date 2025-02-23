const  TopUpRequest  = require('../models/topupRequest');  // Assuming the model is named TopUpRequest
const  User  = require('../models/user');
const sequelize  = require('../config/database'); // Adjust according to your project
const TransactionModel = require('../models/transaction');
exports.createTopUpRequest = async (req, res) => {
  const {amount, method, transactionId, image } = req.body;

  const userId = req.user.user_id; 
  const t = await sequelize.transaction();

  try {
    // Validate the data
    if (!userId || !amount || !method || !transactionId) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // Check if the user exists
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Create the top-up request
    const topUpRequest = await TopUpRequest.create({
      user_id: userId,
      amount,
      transaction_id: transactionId,
      method,
      image
    }, { transaction: t });

    await t.commit();
    res.status(201).json({ message: 'Top-up request created successfully', topUpRequest });
  } catch (error) {
    if (t.finished !== 'commit') await t.rollback();
    res.status(500).json({ message: 'Failed to create top-up request', error: error.message });
  }
};

exports.getTopUpRequests = async (req, res) => {
  const { page = 1, limit = 10, status=null } = req.query; // Default values if not provided

  try {
    const whereClause = {};
  
      // Add status filter to whereClause only if status is provided (not null)
      if (status) {
        whereClause.status = status;
      }
    const offset = (page - 1) * limit;

    const topUpRequests = await TopUpRequest.findAndCountAll({
      where: whereClause,
      offset: parseInt(offset, 10),
      limit: parseInt(limit, 10),
      include: [{ model: User, attributes: ['user_id', 'name', 'email'] }], // Adjust based on your `User` model
      order: [['created_at', 'DESC']], // Sort by most recent
    });

    const totalPages = Math.ceil(topUpRequests.count / limit);

    res.status(200).json({
      message: 'Top-up requests retrieved successfully',
      data: topUpRequests.rows,
      pagination: {
        totalRecords: topUpRequests.count,
        totalPages,
        currentPage: parseInt(page, 10),
      },
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to retrieve top-up requests', error: error.message });
  }
};



 exports.approveTopUpRequest = async (req, res) => {
  const { topUpRequestId } = req.body; // `topUpRequestId`, `amount`, and `description` are required

  try {
    // Find the top-up request
    const topUpRequest = await TopUpRequest.findByPk(topUpRequestId);
    if (!topUpRequest) {
      return res.status(404).json({ message: 'Top-up request not found' });
    }

    if (topUpRequest.status === 'completed') {
      return res.status(400).json({ message: 'Top-up request is already completed' });
    }

    // Find the user associated with the top-up request
    const user = await User.findByPk(topUpRequest.user_id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Update wallet balance
    const updatedBalance = parseFloat(user.wallet_balance) + parseFloat(topUpRequest.amount);
    user.wallet_balance = updatedBalance;
    await user.save();

    // Update the top-up request status to "completed"
    topUpRequest.status = 'completed';
    await topUpRequest.save();

    // Log the transaction
    await TransactionModel.create({
      ride_request_id: null, // No ride associated, so it's null
      user_id: topUpRequest.user_id,
      amount: parseFloat(topUpRequest.amount),
      payment_method: 'wallet',
      status: 'completed',
      description: 'Top-up request approved',
    });

    res.json({
      message: 'Top-up request approved and wallet updated successfully',
      wallet_balance: updatedBalance,
    });
  } catch (error) {
    console.error('Error approving top-up request:', error);
    res.status(500).json({ message: 'Failed to approve top-up request', error: error.message });
  }
};
