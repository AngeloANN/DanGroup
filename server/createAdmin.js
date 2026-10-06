// server/createAdmin.js
const mongoose = require('mongoose');
const dotenv = require('dotenv');

// Load env vars
dotenv.config();

// Connect to DB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('MongoDB Connected'))
  .catch(err => console.error('MongoDB connection error:', err));

// Define a simple User model if it can't be imported
let User;
try {
  User = require('./models/user');
} catch (error) {
  console.log('Could not import User model, defining inline');
  const userSchema = new mongoose.Schema({
    name: {
      type: String,
      required: true
    },
    email: {
      type: String,
      required: true,
      unique: true
    },
    password: {
      type: String,
      required: true
    },
    role: {
      type: String,
      enum: ['user', 'admin', 'staff', 'customer'],
      default: 'user'
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  });

  // Simple password hashing before save
  userSchema.pre('save', async function(next) {
    if (!this.isModified('password')) {
      next();
    }
    this.password = await bcrypt.hash(this.password, 10);
  });

  User = mongoose.model('User', userSchema);
}

// Create admin user
const createAdmin = async () => {
  try {
    // Set admin details
    const adminData = {
      name: 'Admin User',
      email: process.env.ADMIN_EMAIL || 'admin@dangroup.club',
      password: process.env.ADMIN_PASSWORD,
      role: 'admin'
    };

    // Refuse to create an admin without a password in .env
    if (!adminData.password) {
      console.error('ADMIN_PASSWORD is missing from .env');
      process.exit(1);
    }

    // Check if admin already exists
    const existingAdmin = await User.findOne({ email: adminData.email });
    
    if (existingAdmin) {
      console.log('Admin user already exists');
    } else {
      // Create new admin
      const admin = await User.create(adminData);
      console.log('Admin user created:', admin.email);
    }
    
    mongoose.connection.close();
    
  } catch (error) {
    console.error('Error creating admin user:', error);
  }
};

createAdmin();