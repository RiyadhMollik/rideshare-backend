const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const RideRequestModel = sequelize.define('RideRequest', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
    user_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    service_id: {
        type: DataTypes.STRING,
        allowNull: false
    },
    vehicle_type: {
        type: DataTypes.STRING,
        allowNull: false
    },
   
    pickup_point: {
        type: DataTypes.JSON,
        allowNull: false
    },
    destination: {
        type: DataTypes.JSON,
        allowNull: false
    },
    pickup_place: {
        type: DataTypes.STRING,
        allowNull: true
    },
    destination_place: {
        type: DataTypes.STRING,
        allowNull: true
    },
    user_name: {
        type: DataTypes.STRING,
        allowNull: true
    },
    user_pic: {
        type: DataTypes.STRING,
        allowNull: true
    },
    user_rating: {
        type: DataTypes.DECIMAL(2, 1),
        allowNull: true
    },
    user_number: {
        type: DataTypes.STRING,
        allowNull: true
    },
    time: {
        type: DataTypes.DATE,
        allowNull: false
    },
    fare: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false
    },
    extra_details: {
        type: DataTypes.JSON,
        allowNull: true
    },
    status: {
        type: DataTypes.ENUM('pending','bidding', 'ride_placed', 'ride_active', 'arrived', 'ride_in_progress', 'ride_canceled', 'ride_completed', 'deleted'),
        defaultValue: 'pending'
    },
    bids: {
        type: DataTypes.JSON,
        allowNull: true,
        defaultValue:[]
    },
    driver_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
    },
    driver_fcm_token: {
        type: DataTypes.STRING,
        allowNull: true
    },
    user_fcm_token: {
        type: DataTypes.STRING,
        allowNull: false
    },
    // bids_Amount: {
    //     type: DataTypes.DECIMAL(10, 2),
    //     allowNull: true
    // },
    otp: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    driver_name: {
        type: DataTypes.STRING,
        allowNull: true
    },
    driver_pic: {
        type: DataTypes.STRING,
        allowNull: true
    },
    vehicle: {
        type: DataTypes.STRING,
        allowNull: true
    },
    vehicle_number: {
        type: DataTypes.STRING,
        allowNull: true
    },
    driver_number: {
        type: DataTypes.STRING,
        allowNull: true
    },
    driver_rating: {
        type: DataTypes.DECIMAL(2, 1),
        allowNull: true
    },
    created_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    },
    updated_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    }
}, {
    timestamps: false,
    tableName: 'ride_requests'
});

module.exports = RideRequestModel;
