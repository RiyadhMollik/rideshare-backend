const { VehicleType, serviceVehicle } = require('../models/index');

exports.createVehicleType = async (req, res) => {
  const { name, description, image, extraOptions } = req.body;

  try {
    const vehicleType = await VehicleType.create({
      name,
      description,
      image,
      extraOptions,
    });

    res.status(201).json(vehicleType);
  } catch (error) {
    res.status(500).json({ message: 'Failed to create vehicle type', error: error.message });
  }
};

exports.getAllVehicleTypes = async (req, res) => {
  try {
    const vehicleTypes = await VehicleType.findAll({
      include: [{
        model: serviceVehicle,
        as: 'vehicles',
      }],
    });
    res.json(vehicleTypes);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch vehicle types', error: error.message });
  }
};

exports.editVehicleType = async (req, res) => {
  const { vehicleTypeId } = req.params;
  const { name, description, image, extraOptions } = req.body;

  try {
    const vehicleType = await VehicleType.findByPk(vehicleTypeId);
    if (!vehicleType) {
      return res.status(404).json({ message: 'Vehicle type not found' });
    }

    vehicleType.name = name !== undefined ? name : vehicleType.name;
    vehicleType.description = description !== undefined ? description : vehicleType.description;
    vehicleType.image = image !== undefined ? image : vehicleType.image;
    vehicleType.extraOptions = extraOptions !== undefined ? extraOptions : vehicleType.extraOptions;

    await vehicleType.save();

    res.json(vehicleType);
  } catch (error) {
    res.status(500).json({ message: 'Failed to edit vehicle type', error: error.message });
  }
};

exports.deleteVehicleType = async (req, res) => {
  const { vehicleTypeId } = req.params;

  try {
    const vehicleType = await VehicleType.findByPk(vehicleTypeId);
    if (!vehicleType) {
      return res.status(404).json({ message: 'Vehicle type not found' });
    }

    await vehicleType.destroy();

    res.json({ message: 'Vehicle type deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete vehicle type', error: error.message });
  }
};
