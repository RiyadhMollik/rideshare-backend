const GlobalSettings = require('../models/settings');

// Fetch all global settings
exports.getGlobalSettings = async (req, res) => {
  try {
    const settings = await GlobalSettings.findOne({ where: { id: 1 } }); // Assuming single settings row
    if (!settings) {
      return res.status(404).json({ message: 'Settings not found' });
    }
    res.status(200).json({ settings });
  } catch (error) {
    console.error('Error fetching global settings:', error);
    res.status(500).json({ message: 'Error fetching global settings', error });
  }
};

// Update global settings
exports.updateGlobalSettings = async (req, res) => {
  try {
    const { commission, referral_commission, service_charge } = req.body;

    // Fetch the first and only settings record (assuming a single row for global settings)
    const settings = await GlobalSettings.findOne({ where: { id: 1 } }); // Adjust as needed

    if (!settings) {
      return res.status(404).json({ message: 'Settings not found' });
    }

    // Update only provided fields
    settings.commission = commission ?? settings.commission;
    settings.referral_commission = referral_commission ?? settings.referral_commission;
    settings.service_charge = service_charge ?? settings.service_charge;

    await settings.save();

    res.status(200).json({ message: 'Settings updated successfully', settings });
  } catch (error) {
    console.error('Error updating global settings:', error);
    res.status(500).json({ message: 'Error updating global settings', error });
  }
};
