const DriverVehicle = require('../models/driverVehicle');
const VehicleType = require('../models/vehicleType');
const { v4: uuidv4 } = require('uuid');

exports.createDriverVehicle = async (req, res) => {
  const { vehicleTypeId, image, documents, verified, vehicleDetails, status } = req.body;
  const driverId = req.user.user_id;

  try {
    const vehicleType = await VehicleType.findByPk(vehicleTypeId);
    const driverVehicle = await DriverVehicle.create({
      driverId: driverId,
      vehicleTypeId: vehicleType.id,
      vehicleTypeName: vehicleType.name,
      description: vehicleType.description,
      image: image,
      extraOptions: vehicleType.extraOptions,
      documents: documents,
      verified: verified,
      vehicleDetails: vehicleDetails,
      status: status || 'pending',
    });

    res.status(201).json(driverVehicle);
  } catch (error) {
    console.error('Error in createDriverVehicle controller:', error);
    res.status(500).json({ message: 'Failed to create driver vehicle', error: error.message });
  }
};

exports.updateDriverVehicle = async (req, res) => {
  const { id } = req.params;
  const { vehicleTypeId, image, documents, verified, vehicleDetails, status } = req.body;

  try {
    // Fetch the driver vehicle by ID
    const driverVehicle = await DriverVehicle.findByPk(id);
    if (!driverVehicle) {
      return res.status(404).json({ message: 'Driver vehicle not found' });
    }

    // Optional update logic for vehicleTypeId
    if (vehicleTypeId) {
      const vehicleType = await VehicleType.getById(vehicleTypeId);
      if (vehicleType) {
        driverVehicle.vehicleTypeId = vehicleType.id;
        driverVehicle.vehicleTypeName = vehicleType.name;
        driverVehicle.description = vehicleType.description;
        driverVehicle.extraOptions = vehicleType.extraOptions;
      }
    }

    // Optional updates for other fields
    if (image) driverVehicle.image = image;
    if (documents) driverVehicle.documents = documents;
    if (typeof verified !== 'undefined') driverVehicle.verified = verified; // Explicitly check for undefined to allow boolean false
    if (vehicleDetails) driverVehicle.vehicleDetails = vehicleDetails;
    if (status) driverVehicle.status = status;

    // Save the updated driver vehicle
    await driverVehicle.save();

    res.json(driverVehicle);
  } catch (error) {
    console.error('Error in updateDriverVehicle controller:', error);
    res.status(500).json({ message: 'Failed to update driver vehicle', error: error.message });
  }
};


exports.deleteDriverVehicle = async (req, res) => {
  const { id } = req.params;

  try {
    const driverVehicle = await DriverVehicle.findByPk(id);
    if (!driverVehicle) {
      return res.status(404).json({ message: 'Driver vehicle not found' });
    }

    await driverVehicle.destroy();
    res.json({ message: 'Driver vehicle deleted successfully' });
  } catch (error) {
    console.error('Error in deleteDriverVehicle controller:', error);
    res.status(500).json({ message: 'Failed to delete driver vehicle', error: error.message });
  }
};

exports.getDriverVehiclesByDriverId = async (req, res) => {
  const driverId = req.user.user_id;
  try {
    const driverVehicles = await DriverVehicle.findAll({ where: { driverId } });
    res.json(driverVehicles);
  } catch (error) {
    console.error('Error in getDriverVehiclesByDriverId controller:', error);
    res.status(500).json({ message: 'Failed to fetch driver vehicles', error: error.message });
  }
};

exports.getAllDriverVehicles = async (req, res) => {
  try {
    // Extract query parameters for pagination and status filter
    const { status, page = 1, limit = 10 } = req.query;

    // Pagination logic
    const offset = (page - 1) * limit;

    // Create filter object for status
    let filter = {};

    // If status is provided and is a valid value, add it to the filter
    if (status && ['pending', 'verified', 'blocked'].includes(status)) {
      filter.status = status;
    }

    // Fetch total count of driver vehicles (for pagination metadata)
    const totalItems = await DriverVehicle.count({ where: filter });

    // Fetch driver vehicles with filtering and pagination
    const driverVehicles = await DriverVehicle.findAll({
      where: filter,
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    // Calculate total pages
    const totalPages = Math.ceil(totalItems / limit);

    // // Construct pagination URLs (assuming the base URL is known)
    // const baseUrl = `${req.protocol}://${req.get('host')}${req.originalUrl.split('?').shift()}`;
    // const nextPage = page < totalPages ? `${baseUrl}?page=${parseInt(page) + 1}&limit=${limit}` : null;
    // const previousPage = page > 1 ? `${baseUrl}?page=${parseInt(page) - 1}&limit=${limit}` : null;

    // Send the result as a JSON response, with pagination metadata
    res.json({
      data: driverVehicles,
      pagination: {
        total_items: totalItems,
        total_pages: totalPages,
        current_page: parseInt(page),
        page_size: parseInt(limit),
      }
    });
  } catch (error) {
    console.error('Error in getAllDriverVehicles controller:', error);
    res.status(500).json({ message: 'Failed to fetch driver vehicles', error: error.message });
  }
};

// get single vehicle details by id
exports.getDriverVehicleById = async (req, res) => {
  const { id } = req.params;

  try {
    const driverVehicle = await DriverVehicle.findByPk(id);
    if (!driverVehicle) {
      return res.status(404).json({ message: 'Driver vehicle not found' });
    }

    res.json(driverVehicle);
  } catch (error) {
    console.error('Error in getDriverVehicleById controller:', error);
    res.status(500).json({ message: 'Failed to fetch driver vehicle', error: error.message });
  }
};
