const { Model, DataTypes } = require('sequelize');
const sequelize = require('../config/database'); // Adjust the path to your sequelize instance

class TopUpRequest extends Model {}

TopUpRequest.init({
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'User', // Linking to the User model
      key: 'user_id'
  },
    onDelete: 'CASCADE',
  },
  amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  },
  transaction_id: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  method: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  image:{
    type: DataTypes.TEXT,
    allowNull:true
  },
  status: {
    type: DataTypes.ENUM('pending', 'completed', 'rejected'),
    defaultValue: 'pending',
  },
  created_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
}, {
  sequelize,
  modelName: 'TopUpRequest',
  tableName: 'top_up_requests',
  timestamps: false, // Use `created_at` field instead
});


module.exports = TopUpRequest;
