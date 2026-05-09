require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const Event = require('../models/Event');

const connectDB = async () => {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('MongoDB connected for seeding...');
};

const seedData = async () => {
  await connectDB();
  await User.deleteMany({});
  await Event.deleteMany({});

  // Create admin user
  const admin = await User.create({
    name: 'Admin BBA Apex', uid: 'ADMIN001', email: 'admin@bbapex.cu.edu.in',
    password: 'Admin@123', role: 'admin', course: 'BBA', semester: 1
  });

  // Create sample faculty
  const faculty = await User.create({
    name: 'Dr. Rajesh Kumar', uid: 'FAC001', email: 'faculty@bbapex.cu.edu.in',
    password: 'Faculty@123', role: 'faculty', course: 'BBA'
  });

  // Create sample students
  const students = await User.insertMany([
    { name: 'Priya Sharma', uid: '21BBA1001', email: 'priya@student.cu.edu.in', password: 'Student@123', course: 'BBA', semester: 5, phone: '9876543210', totalPoints: 85 },
    { name: 'Arjun Singh', uid: '21BBA1002', email: 'arjun@student.cu.edu.in', password: 'Student@123', course: 'BBA', semester: 5, phone: '9876543211', totalPoints: 75 },
    { name: 'Neha Gupta', uid: '21BBA1003', email: 'neha@student.cu.edu.in', password: 'Student@123', course: 'BBA', semester: 3, phone: '9876543212', totalPoints: 65 },
    { name: 'Rohit Verma', uid: '22BBA2001', email: 'rohit@student.cu.edu.in', password: 'Student@123', course: 'BBA', semester: 3, phone: '9876543213', totalPoints: 55 },
    { name: 'Anjali Patel', uid: '22BBA2002', email: 'anjali@student.cu.edu.in', password: 'Student@123', course: 'BBA', semester: 1, phone: '9876543214', totalPoints: 45 }
  ]);

  // Create sample events
  const now = new Date();
  await Event.insertMany([
    { title: 'Digital Marketing Masterclass', description: 'Intensive workshop on digital marketing strategies, SEO, and social media marketing for modern businesses.', category: 'Workshop', date: new Date(now.getTime() + 7 * 86400000), registrationDeadline: new Date(now.getTime() + 5 * 86400000), venue: 'LT-101, Block 3, CU', maxParticipants: 60, status: 'upcoming', points: 5, organizer: 'BBA Apex', poster: '', createdBy: admin._id, tags: ['marketing', 'digital', 'workshop'] },
    { title: 'Entrepreneurship Summit 2024', description: 'Annual summit bringing together startup founders, investors, and students to discuss the entrepreneurship ecosystem.', category: 'Industry Session', date: new Date(now.getTime() + 14 * 86400000), registrationDeadline: new Date(now.getTime() + 12 * 86400000), venue: 'Auditorium, Main Block, CU', maxParticipants: 200, status: 'upcoming', points: 5, organizer: 'BBA Apex', poster: '', createdBy: admin._id, tags: ['startup', 'entrepreneurship', 'summit'] },
    { title: 'Business Plan Competition', description: 'Present your innovative business ideas to a panel of industry experts and win exciting prizes.', category: 'Competition', date: new Date(now.getTime() + 21 * 86400000), registrationDeadline: new Date(now.getTime() + 18 * 86400000), venue: 'Conference Hall, Block 5', maxParticipants: 40, status: 'upcoming', points: 10, winnerBonus: 20, organizer: 'BBA Apex', poster: '', createdBy: admin._id, tags: ['business', 'competition', 'innovation'] },
    { title: 'Finance & Investment Workshop', description: 'Learn about stock market, mutual funds, and personal finance management from industry professionals.', category: 'Workshop', date: new Date(now.getTime() - 7 * 86400000), registrationDeadline: new Date(now.getTime() - 10 * 86400000), venue: 'LT-201, Block 3, CU', maxParticipants: 80, status: 'completed', points: 5, currentParticipants: 72, organizer: 'BBA Apex', poster: '', createdBy: admin._id, tags: ['finance', 'investment', 'workshop'] },
    { title: 'HR & Talent Management Seminar', description: 'Industry experts discuss current HR trends, talent acquisition, and organizational behavior.', category: 'Seminar', date: new Date(now.getTime() + 30 * 86400000), registrationDeadline: new Date(now.getTime() + 27 * 86400000), venue: 'Seminar Hall, Block 2', maxParticipants: 100, status: 'upcoming', points: 5, organizer: 'BBA Apex', poster: '', createdBy: faculty._id, tags: ['hr', 'talent', 'management'] },
  ]);

  console.log('✅ Database seeded successfully!');
  console.log('\n📧 Login Credentials:');
  console.log('Admin: admin@bbapex.cu.edu.in / Admin@123');
  console.log('Faculty: faculty@bbapex.cu.edu.in / Faculty@123');
  console.log('Student: priya@student.cu.edu.in / Student@123');
  process.exit(0);
};

seedData().catch(err => { console.error(err); process.exit(1); });
