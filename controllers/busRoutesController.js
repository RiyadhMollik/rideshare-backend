
const Route = require('../models/routesModel'); 
// Authentication Controller
exports.authenticate = async (req, res) => {
    const { routeId, credentials } = req.body;

    try {
        // Check route credentials in the database
        const route = await Route.findByPk(routeId);

        if (!route || route.credentials !== credentials) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        // Send a response confirming authentication
        res.status(200).json({ message: 'Authentication successful', routeId });
    } catch (err) {
        console.error('Error in authentication:', err);
        res.status(500).json({ message: 'Server error' });
    }
};

// Get all routes
exports.getAllRoutes = async (req, res) => {
    try {
      const routes = await Route.findAll({
      });
  
      if (!routes || routes.length === 0) {
        return res.status(404).json({ message: 'No routes found' });
      }
  
      res.status(200).json({ routes });
    } catch (err) {
      console.error('Error in getting routes:', err);
      res.status(500).json({ message: 'Server error' });
    }
  };
