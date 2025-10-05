const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

// In-memory storage for demo
const users = [];
const sessions = {};

// Punjab bus stops data with coordinates
const punjabBusStops = [
  { id: 1, name: "Amritsar Bus Stand", lat: 31.6340, lng: 74.8723, city: "Amritsar" },
  { id: 2, name: "Ludhiana Bus Terminal", lat: 30.9010, lng: 75.8573, city: "Ludhiana" },
  { id: 3, name: "Jalandhar Bus Stand", lat: 31.3260, lng: 75.5762, city: "Jalandhar" },
  { id: 4, name: "Patiala Bus Terminal", lat: 30.3398, lng: 76.3869, city: "Patiala" },
  { id: 5, name: "Bathinda Bus Stand", lat: 30.2115, lng: 74.9455, city: "Bathinda" },
  { id: 6, name: "Mohali Bus Terminal", lat: 30.7046, lng: 76.7179, city: "Mohali" },
  { id: 7, name: "Firozpur Bus Stand", lat: 30.9251, lng: 74.6107, city: "Firozpur" },
  { id: 8, name: "Batala Bus Terminal", lat: 31.8188, lng: 75.2028, city: "Batala" },
  { id: 9, name: "Moga Bus Stand", lat: 30.8138, lng: 75.1688, city: "Moga" },
  { id: 10, name: "Abohar Bus Terminal", lat: 30.1445, lng: 74.1995, city: "Abohar" },
  { id: 11, name: "Malerkotla Bus Stand", lat: 30.5309, lng: 75.8805, city: "Malerkotla" },
  { id: 12, name: "Khanna Bus Terminal", lat: 30.7046, lng: 76.2201, city: "Khanna" },
  { id: 13, name: "Phagwara Bus Stand", lat: 31.2240, lng: 75.7708, city: "Phagwara" },
  { id: 14, name: "Muktsar Bus Terminal", lat: 30.4745, lng: 74.5160, city: "Muktsar" },
  { id: 15, name: "Barnala Bus Stand", lat: 30.3745, lng: 75.5487, city: "Barnala" }
];

// Simple password storage (no hashing for demo purposes)
function storePassword(password) {
  return password; // Store password as plain text for simplicity
}

// Generate simple session token
function generateToken() {
  return 'token_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

// Simple token generation (no JWT complexity)
function generateJWT(userId, email) {
  return 'simple_token_' + userId + '_' + Date.now();
}

// Verify simple token
function verifyJWT(token) {
  try {
    if (!token || !token.startsWith('simple_token_')) return null;
    
    const parts = token.split('_');
    if (parts.length < 4) return null;
    
    const userId = parts[2];
    const timestamp = parseInt(parts[3]);
    
    // Check if token is less than 24 hours old
    if (Date.now() - timestamp > 24 * 60 * 60 * 1000) return null;
    
    return { userId: parseInt(userId), timestamp };
  } catch (error) {
    return null;
  }
}

// Routes
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// User registration
app.post('/register', (req, res) => {
  try {
    const { email, password, name } = req.body;
    
    // Check if user already exists
    const existingUser = users.find(user => user.email === email);
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }
    
    // Create user
    const user = {
      id: users.length + 1,
      email,
      password: storePassword(password),
      name,
      profileIcon: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random&color=fff&size=100`,
      createdAt: new Date()
    };
    
    users.push(user);
    
    // Log to console (PowerShell)
    console.log(`\n🚌 NEW USER REGISTERED:`);
    console.log(`📧 Email: ${email}`);
    console.log(`🔑 Password: ${password}`);
    console.log(`👤 Name: ${name}`);
    console.log(`🆔 User ID: ${user.id}`);
    console.log(`⏰ Time: ${new Date().toLocaleString()}`);
    console.log('='.repeat(50));
    
    res.status(201).json({ 
      message: 'User registered successfully',
      user: { id: user.id, email: user.email, name: user.name, profileIcon: user.profileIcon }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// User login
app.post('/login', (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Find user
    const user = users.find(user => user.email === email);
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }
    
    // Check password
    const storedPassword = storePassword(password);
    if (user.password !== storedPassword) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }
    
    // Generate JWT token
    const token = generateJWT(user.id, user.email);
    
    // Log to console (PowerShell)
    console.log(`\n🚌 USER LOGIN:`);
    console.log(`📧 Email: ${email}`);
    console.log(`🔑 Password: ${password}`);
    console.log(`👤 Name: ${user.name}`);
    console.log(`🆔 User ID: ${user.id}`);
    console.log(`⏰ Time: ${new Date().toLocaleString()}`);
    console.log('='.repeat(50));
    
    res.json({ 
      message: 'Login successful',
      token,
      user: { id: user.id, email: user.email, name: user.name, profileIcon: user.profileIcon }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get bus stops
app.get('/api/bus-stops', (req, res) => {
  res.json(punjabBusStops);
});

// Get user profile
app.get('/api/profile/:userId', (req, res) => {
  const userId = parseInt(req.params.userId);
  const user = users.find(user => user.id === userId);
  
  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }
  
  res.json({
    id: user.id,
    email: user.email,
    name: user.name,
    profileIcon: user.profileIcon,
    createdAt: user.createdAt
  });
});

// Socket.io for real-time updates
io.on('connection', (socket) => {
  console.log(`\n🔌 User connected: ${socket.id}`);
  
  socket.on('join-bus-tracking', (data) => {
    socket.join('bus-tracking');
    console.log(`🚌 User ${data.userId} joined bus tracking`);
  });
  
  socket.on('disconnect', () => {
    console.log(`🔌 User disconnected: ${socket.id}`);
  });
});

// Simulate bus location updates
setInterval(() => {
  const randomBusStop = punjabBusStops[Math.floor(Math.random() * punjabBusStops.length)];
  const busData = {
    busId: Math.floor(Math.random() * 50) + 1, // Bus IDs 1-50
    currentStop: randomBusStop,
    nextStop: punjabBusStops[Math.floor(Math.random() * punjabBusStops.length)],
    estimatedArrival: Math.floor(Math.random() * 60) + 1, // ETA 1-60 minutes
    timestamp: new Date()
  };
  
  io.to('bus-tracking').emit('bus-location-update', busData);
}, 15000); // Update every 15 seconds (optimized for mobile)

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`\n🚌 Bus Tracking System Server Running!`);
  console.log(`🌐 Server: http://localhost:${PORT}`);
  console.log(`📱 Mobile Access: http://[YOUR_IP]:${PORT}`);
  console.log(`🗺️  Punjab Bus Stops: ${punjabBusStops.length} locations loaded`);
  console.log(`👥 Registered Users: ${users.length}`);
  console.log('='.repeat(50));
  console.log(`📦 Dependencies: Express, Socket.io, CORS only`);
  console.log(`🔧 Built-in modules: path, http`);
});