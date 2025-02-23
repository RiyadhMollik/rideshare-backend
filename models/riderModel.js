// driver.js
const redisClient = require('../config/redis');

class Driver {
  constructor(id, latitude, longitude, serviceId, vehicleType, socketId) {
    this.id = id;
    this.latitude = latitude;
    this.longitude = longitude;
    this.serviceId = serviceId;
    this.vehicleType = vehicleType;
    this.socketId = socketId;
  }

  async saveLocation() {
    try {
      await redisClient.geoAdd(`drivers:locations:${this.serviceId}:${this.vehicleType}`, {
        longitude: this.longitude,
        latitude: this.latitude,
        member: this.socketId
      });

      await redisClient.hSet(`driver:${this.socketId}`, {
        driverId: this.id,
        serviceId: this.serviceId,
        vehicleType: this.vehicleType,
        latitude: this.latitude,
        longitude: this.longitude
      });
    } catch (err) {
      console.error('Failed to save driver location:', err);
      throw new Error('Failed to save driver location');
    }
  }

  static async getNearbyDrivers(latitude, longitude, serviceId, vehicleType, radius = 10, count = 20) {
    try {
      const nearbyDriverSocketIds = await redisClient.geoSearch(
        `drivers:locations:${serviceId}:${vehicleType}`, {
          longitude: longitude,
          latitude: latitude,
        },
        { radius: radius, unit: 'km', count: count }
      );

      return nearbyDriverSocketIds;
    } catch (err) {
      console.error('Failed to fetch nearby drivers:', err);
      throw new Error('Failed to fetch nearby drivers');
    }
  }
}

module.exports = Driver;
