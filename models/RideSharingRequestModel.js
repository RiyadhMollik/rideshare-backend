// Used for defining the RideSharingRequest model
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const RideSharingRequestModel = sequelize.define('RideSharingRequest', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    ride_sharing_id: {
        type: DataTypes.INTEGER,
        references: {
            model: 'RideSharing',
            key: 'id'
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
    },
    passenger_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'User', // Linking to the User model
            key: 'user_id'
        }
    },
    requested_seats: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    pickup_point: {
        type: DataTypes.JSON,
        allowNull: false,
    },
    destination_point: {
        type: DataTypes.JSON,
        allowNull: false,
    },
    fare: {
        type: DataTypes.DOUBLE,
        allowNull: false,
    },
    note: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    status: {
        type: DataTypes.ENUM('pending', 'accepted', 'rejected', 'canceled', 'picked_up', 'dropped_off'),
        defaultValue: 'pending',
    },
    created_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
    },
    updated_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
    }
}, {
    timestamps: false,
    tableName: 'RideSharingRequest'
});

module.exports = RideSharingRequestModel;