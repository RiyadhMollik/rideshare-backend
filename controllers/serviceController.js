const { Service, serviceVehicle, VehicleType } = require('../models/index');

exports.createService = async (req, res) => {
  const imageUrl = req.file ? `${req.protocol}://${req.get("host")}/uploads/${req.file.filename}` : null;
  const { name, description, type} = req.body;
  
  try {
    const service = await Service.create({
      name,
      description,
      type,
      imageUrl,
    });
    console.log(service);

    res.status(201).json(service);
  } catch (error) {
    console.log(error);

    res.status(500).json({ message: 'Failed to create service', error: error.message });
  }
};

exports.getAllServices = async (req, res) => {
  try {
    const services = await Service.findAll({
      include: [{
        model: serviceVehicle,
        as: 'vehicles',
        include: [{
          model: VehicleType,
          as: 'vehicleType',
        }],
      }],
    });
    res.json(services);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch services', error: error.message });
  }
};

exports.addVehicleToService = async (req, res) => {
  const { serviceId, vehicleTypeId, vehicleName, perKm, enabled, capacity, outsideCity, labourAvailable ,commissionType , commission } = req.body;
  try {
    const service = await Service.findByPk(serviceId);
    if (!service) {
      return res.status(404).json({ message: 'Service not found' });
    }
    const vehicleType = await VehicleType.findByPk(vehicleTypeId);
    if (!vehicleType) {
      return res.status(404).json({ message: 'Vehicle type not found' });
    }

    const vehicle = await serviceVehicle.create({
      serviceId,
      vehicleTypeId,
      vehicleTypeName: vehicleType.name,
      description: vehicleType.description,
      image: vehicleType.image,
      extraOptions: vehicleType.extraOptions,
      name: vehicleName,
      perKm,
      enabled,
      capacity,
      outsideCity,
      labourAvailable,
      commissionType,
      commission
    });

    res.status(201).json(vehicle);
  } catch (error) {
    res.status(500).json({ message: 'Failed to add vehicle to service', error: error.message });
  }
};

exports.updateServiceToVehicle = async (req, res) => {
  console.log(req.body);
  
  const {
    serviceId,
    vehicleTypeId,
    vehicleName,
    perKm,
    enabled,
    capacity,
    outsideCity,
    labourAvailable,
    commissionType,
    commission
  } = req.body;

  const { id } = req.params;

  try {
    const vehicle = await serviceVehicle.findByPk(id);
    if (!vehicle) {
      return res.status(404).json({ message: 'Service vehicle not found' });
    }

    const service = await Service.findByPk(serviceId);
    if (!service) {
      return res.status(404).json({ message: 'Service not found' });
    }

    const vehicleType = await VehicleType.findByPk(vehicleTypeId);
    if (!vehicleType) {
      return res.status(404).json({ message: 'Vehicle type not found' });
    }

    await vehicle.update({
      serviceId,
      vehicleTypeId,
      vehicleTypeName: vehicleType.name,
      description: vehicleType.description,
      image: vehicleType.image,
      extraOptions: vehicleType.extraOptions,
      name: vehicleName,
      perKm,
      enabled,
      capacity,
      outsideCity,
      labourAvailable,
      commissionType,
      commission
    });

    res.status(200).json({ message: 'Service vehicle updated successfully', vehicle });
  } catch (error) {
    console.error('Error updating service vehicle:', error);
    res.status(500).json({ message: 'Failed to update service vehicle', error: error.message });
  }
};
exports.getAllServiceToVehicles = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    const { count, rows } = await serviceVehicle.findAndCountAll({
      offset,
      limit,
      order: [['id', 'DESC']],
    });

    res.status(200).json({
      vehicles: rows,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      totalItems: count,
    });
  } catch (error) {
    console.error('Error fetching service vehicles:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

exports.getServiceToVehicleById = async (req, res) => {
  try {
    const { id } = req.params;
    const vehicle = await serviceVehicle.findByPk(id);
    if (!vehicle) {
      return res.status(404).json({ message: 'Service vehicle not found' });
    }
    res.status(200).json(vehicle);
  } catch (error) {
    console.error('Error fetching service vehicle by ID:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};


exports.ServiceDetails = async (req, res) => {
  const { id } = req.params;
  console.log(id);

  try {
    const service = await Service.findByPk(id);
    if (!service) {
      return res.status(404).json({ message: 'Service not found' });
    }
    res.json(service);
  } catch (error) {
    res.status(500).json({ message: 'Failed to edit service', error: error.message });
  }
};

exports.editService = async (req, res) => {
  const { serviceId } = req.params;
  const imageUrl = req.file ? `${req.protocol}://${req.get("host")}/uploads/${req.file.filename}` : null;
  const { name, description, type} = req.body;
  console.log(imageUrl);
  try {
    const service = await Service.findByPk(serviceId);
    if (!service) {
      return res.status(404).json({ message: "Service not found" });
    }

    service.name = name !== undefined ? name : service.name;
    service.description = description !== undefined ? description : service.description;
    service.type = type !== undefined ? type : service.type;
    if (imageUrl) {
      service.imageUrl = imageUrl;
    }

    await service.save();

    res.json({ success: true, message: "Service updated successfully!", service });
  } catch (error) {
    res.status(500).json({ message: "Failed to edit service", error: error.message });
  }
};


exports.deleteService = async (req, res) => {
  const { serviceId } = req.params;

  try {
    const service = await Service.findByPk(serviceId);
    if (!service) {
      return res.status(404).json({ message: 'Service not found' });
    }

    await service.destroy();

    res.json({ message: 'Service deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete service', error: error.message });
  }
};

exports.updateServiceVehicle = async (req, res) => {
  const { vehicleId } = req.params;
  const { vehicleTypeId, vehicleName, perKm, commission, enabled, capacity, outsideCity, labourAvailable } = req.body;

  try {
    const vehicle = await serviceVehicle.findByPk(vehicleId);
    if (!vehicle) {
      return res.status(404).json({ message: 'Vehicle not found' });
    }

    vehicle.vehicleTypeId = vehicleTypeId !== undefined ? vehicleTypeId : vehicle.vehicleTypeId;
    vehicle.name = vehicleName !== undefined ? vehicleName : vehicle.name;
    vehicle.perKm = perKm !== undefined ? perKm : vehicle.perKm;
    vehicle.enabled = enabled !== undefined ? enabled : vehicle.enabled;
    vehicle.capacity = capacity !== undefined ? capacity : vehicle.capacity;
    vehicle.outsideCity = outsideCity !== undefined ? outsideCity : vehicle.outsideCity;
    vehicle.labourAvailable = labourAvailable !== undefined ? labourAvailable : vehicle.labourAvailable

    await vehicle.save();

    res.json(vehicle);
  } catch (error) {
    res.status(500).json({ message: 'Failed to update vehicle', error: error.message });
  }
};


exports.deleteServiceVehicle = async (req, res) => {
  const { vehicleId } = req.params;

  try {
    const vehicle = await serviceVehicle.findByPk(vehicleId);
    if (!vehicle) {
      return res.status(404).json({ message: 'Vehicle not found' });
    }

    await vehicle.destroy();

    res.json({ message: 'Vehicle deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete vehicle', error: error.message });
  }
};
