const express = require('express');
const http = require('http');
const cors = require('cors');
const multer = require("multer");
const path = require('path');
const { ApolloServer } = require('@apollo/server');
const { expressMiddleware } = require('@apollo/server/express4');
const { initializeSocket } = require('./utils/socket');
const { Server } = require('socket.io');
const bodyParser = require('body-parser');
const { swaggerUi, swaggerSpec } = require('./utils/swagger');
const sequelize = require('./config/database');
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const serviceRoutes = require('./routes/serviceRoutes');
const vehicleTypeRoutes = require('./routes/vehicleTypeRoutes');
const driverVehicleRoutes = require('./routes/driverVehicleRoutes');
const rideRequestRoutes = require('./routes/rideRequestRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const ratingRoutes = require('./routes/ratingRoutes');
const rideSharingRoutes = require('./routes/rideShareRoutes');
const settingsRoutes= require('./routes/settingsRoutes');
const busRoutes= require('./routes/busroutes');
const walletRoutes = require('./routes/walletRoutes');
const typeDefs = require('./graphql/typeDefs/rideSchema');
const resolvers = require('./graphql/resolvers/rideResolvers');
const { validateToken } = require('./utils/jwtUtils');

const app = express();
const server = http.createServer(app);
require('dotenv').config();
app.use(cors({
  origin: 'http://localhost:5173', // Your frontend URL
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true, // Allow credentials
}));
console.log("db name:", process.env.DB_NAME);
console.log("db name:", process.env.DB_HOST);
// Initialize Socket.io
const io = new Server(server, {
  cors: {
    origin: '*',
    allowedHeaders: ["*"],
  },
});
initializeSocket(io);

app.use('/uploads', express.static('uploads'));
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.use(express.json());
app.use(bodyParser.json());
app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api', serviceRoutes);
app.use('/api', vehicleTypeRoutes);
app.use('/api', driverVehicleRoutes);
app.use('/api', rideRequestRoutes);
app.use('/api', paymentRoutes);
app.use('/api', ratingRoutes);
app.use('/api', rideSharingRoutes);
app.use('/api',settingsRoutes);
app.use('/api', busRoutes);
app.use('/api/wallet',walletRoutes);
app.get('/', (req, res) => {
  console.log('Welcome to the API v11');
  
  res.json({ message: 'Welcome to the API v11' });
});

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/"); // Save images in the 'uploads' directory
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname)); // Unique filename
  },
});

// File upload middleware
const upload = multer({ storage: storage });

// Image upload route
app.post("/upload", upload.single("image"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: "No file uploaded" });
  }

  const imageUrl = `${req.protocol}://${req.get("host")}/uploads/${req.file.filename}`;
  res.status(200).json({ message: "Image uploaded successfully", imageUrl });
});
// Define createApolloGraphqlServer function
const createApolloGraphqlServer = async () => {
  const graphqlServer = new ApolloServer({
    typeDefs,
    resolvers,
    // No need for context here; we handle it separately
  });

  await graphqlServer.start();
  return graphqlServer;
};

// Apply Apollo Server middleware
const applyApolloMiddleware = async () => {
  const apolloServer = await createApolloGraphqlServer();

  app.use(
    '/graphql',
    expressMiddleware(apolloServer, {
      context: async ({ req }) => {
        const token = req.headers['authorization']?.split(' ')[1]; 
        const user = validateToken(token); 
        return { user };
      },
    })
  );
};
// Initialize Apollo middleware
applyApolloMiddleware();

// Connect to the database
sequelize.authenticate()
  .then(() => console.log('Database connected...'))
  .catch(err => console.log('Error: ' + err));

// Set up Socket.io instance for routes
app.set('socketio', io);

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
