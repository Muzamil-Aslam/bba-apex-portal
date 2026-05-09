require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');

const connectDB = async () => {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('MongoDB connected for seeding...');
};

const seedData = async () => {
  await connectDB();

  // Remove only old demo users — leave any real registrations intact
  await User.deleteMany({ email: { $in: [
    'admin@bbapex.cu.edu.in',
    'faculty@bbapex.cu.edu.in',
    'priya@student.cu.edu.in',
    'arjun@student.cu.edu.in',
    'neha@student.cu.edu.in',
    'rohit@student.cu.edu.in',
    'anjali@student.cu.edu.in',
  ] } });

  // Create real admin account
  await User.create({
    name: 'Muzamil Aslam',
    uid: 'ADMIN001',
    email: 'muzamilaslam990@gmail.com',
    password: 'BBAApex@2024',
    role: 'admin',
    course: 'BBA',
    semester: 1,
  });

  console.log('\n✅ Admin account created successfully!');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('  Email    : muzamilaslam990@gmail.com');
  console.log('  Password : BBAApex@2024');
  console.log('  Role     : admin');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('\n⚠️  Change your password after first login!');
  process.exit(0);
};

seedData().catch(err => { console.error(err); process.exit(1); });
