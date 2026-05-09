# 🎓 BBA Apex Event Management Portal
### Chandigarh University – Official Student Event Platform

---

## 📋 Project Overview

A full-stack, production-ready event management portal for BBA Apex – Chandigarh University.

**Tech Stack:**
- **Frontend:** React.js + Vite + Tailwind CSS
- **Backend:** Node.js + Express.js
- **Database:** MongoDB (Mongoose ODM)
- **Auth:** JWT (JSON Web Tokens)
- **File Storage:** Cloudinary
- **Color Theme:** Maroon + White + Gold | **Fonts:** Poppins + Open Sans

---

## 🗂️ Project Structure

```
BBA Apex Event Management/
├── backend/
│   ├── config/
│   │   └── db.js                  # MongoDB connection
│   ├── controllers/
│   │   ├── authController.js      # Register, login, profile
│   │   ├── eventController.js     # CRUD for events
│   │   ├── registrationController.js
│   │   ├── certificateController.js
│   │   ├── galleryController.js
│   │   ├── userController.js      # Leaderboard, students
│   │   └── dashboardController.js # Admin & student dashboards
│   ├── middleware/
│   │   ├── auth.js               # JWT protect + role authorize
│   │   └── validate.js           # Joi input validation
│   ├── models/
│   │   ├── User.js               # Student/Admin/Faculty
│   │   ├── Event.js              # Events with categories
│   │   ├── Registration.js       # Event registrations
│   │   ├── Certificate.js        # Issued certificates
│   │   └── Gallery.js            # Event photos/videos
│   ├── routes/
│   │   ├── auth.js
│   │   ├── events.js
│   │   ├── registrations.js
│   │   ├── certificates.js
│   │   ├── gallery.js
│   │   ├── users.js
│   │   └── dashboard.js
│   ├── utils/
│   │   └── seeder.js             # Demo data seeder
│   ├── .env.example
│   ├── package.json
│   └── server.js
│
└── frontend/
    ├── public/
    │   └── favicon.svg
    ├── src/
    │   ├── components/
    │   │   ├── Navbar.jsx         # Responsive navigation
    │   │   ├── Footer.jsx         # University-branded footer
    │   │   ├── EventCard.jsx      # Reusable event card
    │   │   └── LoadingSpinner.jsx
    │   ├── context/
    │   │   └── AuthContext.jsx    # Global auth state
    │   ├── pages/
    │   │   ├── Home.jsx           # Hero + counters + events + leaderboard
    │   │   ├── Events.jsx         # Search + filter + paginate
    │   │   ├── EventDetail.jsx    # Single event view + register
    │   │   ├── Gallery.jsx        # Masonry gallery + lightbox
    │   │   ├── Certificates.jsx   # UID-based certificate download
    │   │   ├── Leaderboard.jsx    # Points-based ranking + podium
    │   │   ├── Login.jsx
    │   │   ├── Register.jsx
    │   │   ├── StudentDashboard.jsx
    │   │   ├── AdminPanel.jsx     # Full CRUD admin panel
    │   │   └── NotFound.jsx
    │   ├── utils/
    │   │   └── api.js             # Axios instance + interceptors
    │   ├── App.jsx
    │   ├── main.jsx
    │   └── index.css              # Tailwind + custom classes
    ├── index.html
    ├── package.json
    ├── tailwind.config.js
    └── vite.config.js
```

---

## 🚀 Quick Setup Guide

### Prerequisites
- Node.js v18+
- MongoDB (local or MongoDB Atlas)
- Cloudinary account (free tier works)
- npm or yarn

---

### 1️⃣ Clone / Open the Project
```bash
cd "BBA Apex Event Management"
```

---

### 2️⃣ Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Create environment file
cp .env.example .env
```

**Edit `.env` with your values:**
```env
PORT=5000
NODE_ENV=development
MONGO_URI=mongodb://localhost:27017/bba_apex_portal
JWT_SECRET=your_super_secret_key_min_32_chars
JWT_EXPIRE=7d
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
FRONTEND_URL=http://localhost:3000
```

**Seed the database with demo data:**
```bash
npm run seed
```

**Start the backend server:**
```bash
# Development (with auto-restart)
npm run dev

# Production
npm start
```

Server runs at: `http://localhost:5000`

---

### 3️⃣ Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Create environment file (optional - defaults to /api proxy)
echo "VITE_API_URL=http://localhost:5000/api" > .env.local

# Start development server
npm run dev
```

Frontend runs at: `http://localhost:3000`

---

## 🔐 Demo Login Credentials

After running the seeder (`npm run seed`):

| Role    | Email                          | Password     |
|---------|--------------------------------|--------------|
| Admin   | admin@bbapex.cu.edu.in         | Admin@123    |
| Faculty | faculty@bbapex.cu.edu.in       | Faculty@123  |
| Student | priya@student.cu.edu.in        | Student@123  |

---

## 📊 Database Schema

### User
```
uid (unique), name, email, password (hashed), role (student/admin/faculty),
course, semester, phone, totalPoints, isActive, avatar
```

### Event
```
title, description, category, date, registrationDeadline, venue,
maxParticipants, currentParticipants, points, winnerBonus, status,
isPublished, tags, poster (Cloudinary URL), createdBy (ref: User)
```

### Registration
```
student (ref: User), event (ref: Event), studentName, uid, course,
semester, phone, email, status (pending/confirmed/attended/cancelled),
registrationNumber (auto-generated), pointsAwarded
```

### Certificate
```
student (ref: User), event (ref: Event), uid, studentName,
certificateType (participation/winner/runner-up/merit),
fileUrl (Cloudinary), certificateNumber (auto-generated), issuedAt
```

### Gallery
```
event (ref: Event), eventName, title, mediaType (image/video),
fileUrl, thumbnailUrl, description, isFeatured, uploadedBy
```

---

## 🏆 Point System

| Activity           | Points |
|--------------------|--------|
| Workshop           | 5 pts  |
| Seminar            | 5 pts  |
| Industry Session   | 5 pts  |
| Academic Event     | 5 pts  |
| Competition        | 10 pts |
| Winner Bonus       | 20 pts |

Points are auto-awarded when faculty marks attendance.

---

## 🔌 API Reference

### Auth Routes (`/api/auth`)
| Method | Route            | Description         | Auth |
|--------|-----------------|---------------------|------|
| POST   | /register        | Student registration | ❌  |
| POST   | /login           | Login               | ❌  |
| GET    | /me              | Get current user    | ✅  |
| PUT    | /profile         | Update profile      | ✅  |
| PUT    | /change-password | Change password     | ✅  |

### Events Routes (`/api/events`)
| Method | Route    | Description     | Auth         |
|--------|---------|-----------------|--------------|
| GET    | /        | List events     | ❌           |
| GET    | /stats   | Event statistics| ❌           |
| GET    | /:id     | Get event       | ❌           |
| POST   | /        | Create event    | Admin/Faculty|
| PUT    | /:id     | Update event    | Admin/Faculty|
| DELETE | /:id     | Delete event    | Admin/Faculty|

### Registrations (`/api/registrations`)
| Method | Route                         | Description          |
|--------|------------------------------|----------------------|
| POST   | /event/:eventId              | Register for event   |
| GET    | /my                          | My registrations     |
| GET    | /event/:eventId              | Event's registrations (Admin)|
| PATCH  | /:regId/attendance           | Mark attended (Admin)|
| GET    | /event/:eventId/download     | Export Excel (Admin) |

### Certificates (`/api/certificates`)
| Method | Route        | Description              |
|--------|-------------|--------------------------|
| GET    | /uid/:uid    | Get certs by UID (public)|
| GET    | /my          | My certificates          |
| POST   | /upload      | Upload certificate (Admin)|

---

## 🌐 Deployment Guide

### Option A: Deploy on Render (Free)

**Backend:**
1. Push to GitHub
2. Create new Web Service on render.com
3. Set build command: `npm install`
4. Set start command: `node server.js`
5. Add all environment variables from `.env`

**Frontend:**
1. Create new Static Site on render.com
2. Set build command: `npm install && npm run build`
3. Set publish dir: `dist`
4. Set env var: `VITE_API_URL=https://your-backend.onrender.com/api`

### Option B: Deploy on Railway

```bash
# Backend
railway login
railway init
railway add
railway up
```

### Option C: VPS / Ubuntu Server

```bash
# Install PM2
npm install -g pm2

# Start backend
cd backend
pm2 start server.js --name "bba-apex-api"

# Build frontend
cd frontend
npm run build
# Serve dist/ with Nginx

# Nginx config example:
# server {
#   listen 80;
#   server_name yourdomain.com;
#   location /api { proxy_pass http://localhost:5000; }
#   location / { root /var/www/bba-apex/dist; try_files $uri /index.html; }
# }
```

### MongoDB Atlas (Cloud Database)
1. Create free cluster at mongodb.com/atlas
2. Get connection string: `mongodb+srv://user:pass@cluster.mongodb.net/bba_apex`
3. Replace `MONGO_URI` in your `.env`

---

## ✨ Features Summary

### Student Features
- Register & login with UID/email
- Browse & search events by category/status
- Register for events with deadline enforcement
- View registered events & attendance status
- Download participation certificates by UID
- Track total points & leaderboard ranking
- Personal dashboard with full history

### Admin/Faculty Features
- Secure admin panel with role-based access
- Create, edit, delete events with poster upload
- View all registrations per event
- Mark student attendance (auto-awards points)
- Export registration list as Excel (.xlsx)
- Upload certificates linked to students
- Manage gallery photos and videos
- Overview dashboard with statistics

### Platform Features
- JWT authentication with role-based authorization
- Full-text search across events
- Animated counters on homepage
- Masonry gallery with lightbox
- Mobile-responsive navbar with user dropdown
- Toast notifications for all actions
- Auto-generated registration & certificate numbers
- Podium-style leaderboard display
- Points auto-calculated by event category

---

## 📞 Support

BBA Apex – Chandigarh University  
📧 bbapex@cumail.in  
🌐 Chandigarh University, Mohali, Punjab
