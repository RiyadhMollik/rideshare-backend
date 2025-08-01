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
const settingsRoutes = require('./routes/settingsRoutes');
const busRoutes = require('./routes/busroutes');
const walletRoutes = require('./routes/walletRoutes');
const typeDefs = require('./graphql/typeDefs/rideSchema');
const resolvers = require('./graphql/resolvers/rideResolvers');
const roleRoutes = require('./routes/roleRoutes');
const { Op } = require("sequelize"); // Import Sequelize Op
const { validateToken } = require('./utils/jwtUtils');
const serviceAccount = require("./config/ride-sharing-54f52-firebase-adminsdk-v7oa1-82297cbb2a.json");
const admin = require("firebase-admin");
const app = express();
const server = http.createServer(app);
require('dotenv').config();
const User = require("./models/user");
app.use(cors({
  origin: 'http://localhost:5173', // Your frontend URL
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
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
app.use('/api', settingsRoutes);
app.use('/api', busRoutes);
app.use('/api/wallet', walletRoutes);
app.use('/api/roles', roleRoutes);

app.get('/', (req, res) => {
  console.log('Welcome to the API v11');

  res.json({ message: 'Welcome to the API v11' });
});

const CHUNK_SIZE = 450;

app.post("/send-notification", async (req, res) => {
  const { title, body, user_type } = req.body;

  try {
    const whereCondition = {
      push_token: {
        [Op.not]: null,
      },
    };

    if (user_type && user_type !== "all") {
      whereCondition.user_type = user_type;
    }

    // Fetch users
    const users = await User.findAll({
      where: whereCondition,
      attributes: ["push_token"],
    });

    const tokens = users.map(user => user.push_token).filter(Boolean);

    if (tokens.length === 0) {
      return res.status(400).json({ error: "No valid push tokens found" });
    }

    const chunks = [];
    for (let i = 0; i < tokens.length; i += CHUNK_SIZE) {
      chunks.push(tokens.slice(i, i + CHUNK_SIZE));
    }
    const responses = [];
    for (const chunk of chunks) {
      const message = {
        notification: { title, body },
        tokens: chunk,
      };
      const response = await admin.messaging().sendEachForMulticast(message);
      responses.push(response);
    }
    res.status(200).json({
      success: true,
      message: "Notifications sent successfully",
      totalChunks: chunks.length,
      responses,
    });
  } catch (error) {
    console.error("Error sending notification:", error);
    res.status(500).json({ success: false, error: error.message });
  }
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
  .then(() => {
    // sequelize.sync({ alter: true })
    console.log('Database connected...')
  })
  .catch(err => console.log('Error: ' + err));

// Set up Socket.io instance for routes
app.set('socketio', io);

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
