const mongoose = require('mongoose');
mongoose.set('strictQuery', true); // or false based on your preference
require('dotenv').config();
const express = require('express');
// Add this at the top with other requires
const operatorRoutes = require('./routes/operatorRoutes');
// Add with other route imports
const authRoutes = require('./routes/authRoute');

const cors = require('cors');
const multer = require('multer');
const path = require('path');

// Initialize Express
const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/api/operators', operatorRoutes);
// Add with other app.use() routes
app.use('/api', authRoutes);

// Configure Multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({ storage });

// Database connection
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('Connected to MongoDB'))
.catch(err => console.error('MongoDB connection error:', err));

// Routes
const breakdownRoutes = require('./routes/breakdownRoutes');
app.use('/api/breakdowns', breakdownRoutes);

// File upload route
app.post('/api/upload', upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }
  res.json({ filePath: `/uploads/${req.file.filename}` });
});

// Error handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something broke!' });
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => console.log(`Server running on port ${PORT}`));
