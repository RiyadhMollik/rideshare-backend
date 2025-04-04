const { VehicleType, serviceVehicle } = require('../models/index');

exports.createVehicleType = async (req, res) => {
  const imageUrl = req.file ? `${req.protocol}://${req.get("host")}/uploads/${req.file.filename}` : null;

  const { name, description } = req.body;
  const extraOptions = JSON.parse(req.body.extraOptions);
  console.log(extraOptions);
  

  try {
    const vehicleType = await VehicleType.create({
      name,
      description,
      image: imageUrl,
      extraOptions,
    });    
    res.status(201).json(vehicleType);
  } catch (error) {
    console.log(error);
    
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

exports.vehicleTypeDetails = async (req, res) => {
  const { vehicleTypeId } = req.params;
  try {
    const vehicleType = await VehicleType.findByPk(vehicleTypeId);
    if (!vehicleType) {
      return res.status(404).json({ message: 'Vehicle type not found' });
    }
    res.json(vehicleType);
  } catch (error) {
    res.status(500).json({ message: 'Failed to edit vehicle type', error: error.message });
  }
};

exports.editVehicleType = async (req, res) => {
  const { vehicleTypeId } = req.params;
  const imageUrl = req.file ? `${req.protocol}://${req.get("host")}/uploads/${req.file.filename}` : null;

  const { name, description } = req.body;
  const extraOptions = JSON.parse(req.body.extraOptions);
  console.log(extraOptions);
  try {
    const vehicleType = await VehicleType.findByPk(vehicleTypeId);
    if (!vehicleType) {
      return res.status(404).json({ message: 'Vehicle type not found' });
    }

    vehicleType.name = name !== undefined ? name : vehicleType.name;
    vehicleType.description = description !== undefined ? description : vehicleType.description;
    vehicleType.image = imageUrl !== undefined ? imageUrl : vehicleType.image;
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
