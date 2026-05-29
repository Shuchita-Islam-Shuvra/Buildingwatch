# 🏗️ BuildingWatch — Structural Safety Monitoring System

> Inspired by the Rana Plaza Tragedy (2013)

## 📌 Overview
BuildingWatch is a real-time structural safety monitoring system that tracks building crack levels using simulated sensors. When danger levels exceed thresholds, the system automatically triggers alerts and notifies responsible authorities.

## 🎯 Features
- 📡 Live sensor simulation (Crack, Vibration, Load, Tilt, Humidity)
- 🚨 Auto danger alert generation (Low → Critical)
- 📧 Notification system for company managers
- 🏢 Building & floor management
- 🔍 Inspection & maintenance tracking
- 📊 Risk assessment dashboard
- 🚒 Emergency team & evacuation plan management

## 🗄️ Database — Supabase (PostgreSQL)
- 14 tables
- Hosted on Supabase cloud
- No local database setup needed

## 🛠️ Tech Stack
| Layer | Technology |
|-------|-----------|
| Frontend | HTML, CSS, Vanilla JavaScript |
| Backend | Supabase JS SDK |
| Database | Supabase (PostgreSQL) |
| Build Tool | Vite |
| Deployment | Vercel |

## 🌐 Live Demo
[BuildingWatch Live →](https://buildingwatch-supabase.vercel.app)

## ⚙️ Installation & Setup

### Prerequisites
- [Node.js](https://nodejs.org) (v24+)
- Git installed

### Steps

**1. Clone the repository**
```bash
git clone https://github.com/Shuchita-Islam-Shuvra/Buildingwatch.git
cd Buildingwatch
```

**2. Install dependencies**
```bash
npm install
```

**3. Run locally**
```bash
npm run dev
```

**4. Open in browser**


buildingwatch-supabase/
├── index.html          # Main HTML + navigation
├── src/
│   ├── main.js         # All pages + Supabase logic
│   └── style.css       # Styling
├── package.json
└── vite.config.js


## 📊 Database Tables
| Table | Description |
|-------|-------------|
| company | Building owner companies |
| building | Building information |
| floor | Floor details per building |
| sensor | Sensors installed per floor |
| sensor_reading | Live sensor readings |
| danger_alert | Auto-generated danger alerts |
| notification | Alert notifications sent |
| contact_person | Company managers/contacts |
| inspector | Building inspectors |
| inspection | Inspection records |
| maintenance_log | Repair & maintenance history |
| risk_assessment | Building risk scores |
| emergency_team | Emergency response teams |
| evacuation_plan | Evacuation routes per building |

## 👩‍💻 Course Info
**Course:** CSE-2201 — Database Management System Lab  
**Department:** Computer Science & Engineering  
**University:** University of Dhaka  
**Year:** 2nd Year, 2nd Semester, 2025
