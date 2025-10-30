# Intramuros Tourism System - Complete Documentation

## 📋 Documentation Overview

This folder contains comprehensive system documentation for the **Intramuros Tourism System**, a Progressive Web Application (PWA) designed to enhance the tourist experience in Intramuros, Manila.

---

## 📚 Document Index

### 1. [Use Case Diagram](./01_USE_CASE_DIAGRAM.md)
**Purpose**: Visual representation of all system use cases and actors

**Contents**:
- Complete PlantUML use case diagram
- 77 use cases across 16 modules
- 3 actor types (Guest, Tourist, Administrator)
- Actor descriptions and capabilities
- Module summary table

**Key Highlights**:
- Authentication & Profile Management (14 use cases)
- Itinerary Management (10 use cases)
- Map & Navigation (7 use cases)
- Review System (6 use cases)
- Photobooth Features (6 use cases)
- AI Chatbot (4 use cases)
- Admin Functions (26 use cases)
- PWA Features (3 use cases)

---

### 2. [Use Case Descriptions - Part 1](./02_USE_CASE_DESCRIPTIONS_PART1.md)
**Purpose**: Detailed descriptions of authentication, profile, and itinerary use cases

**Contents**:
- **Authentication Module**: Register, Login (Email/Google), OTP Verification, Password Reset, Complete Profile
- **Profile Management Module**: View/Edit Profile, Update Picture, Change Password, Change Language
- **Itinerary Management Module**: Browse, View Details, Create, Edit, Delete, Start Tour, Navigate, Mark Visited

**Format**: Each use case includes:
- Function name
- Actor(s)
- Pre-conditions
- Step-by-step use case steps
- Post-conditions

---

### 3. [Use Case Descriptions - Part 2](./02_USE_CASE_DESCRIPTIONS_PART2.md)
**Purpose**: Detailed descriptions of map, review, photobooth, chatbot, and emergency use cases

**Contents**:
- **Map & Navigation Module**: View 3D Map, Site Pins, Site Details, Directions, AR Content, Filter Sites
- **Review System Module**: View Archives, Write Review, Rate Site, Upload Photos, Edit/Delete Review
- **Photobooth Module**: Access, Capture, Apply Filters/Borders, Download, Share
- **AI Chatbot Module**: Ask Questions, Get Info, Directions Help, Switch Language
- **Emergency Services Module**: View Contacts, Call Emergency

---

### 4. [Use Case Descriptions - Part 3](./02_USE_CASE_DESCRIPTIONS_PART3.md)
**Purpose**: Detailed descriptions of all administrator functions

**Contents**:
- **Admin - User Management**: View Users, Search, Change Role, Delete User, View Logs
- **Admin - Site Management**: Manage Sites, Add/Edit/Delete, Upload Media, Set AR, Set Status
- **Admin - Itinerary Management**: Create/Edit/Delete Admin Itineraries, Archive, Restore
- **Admin - Photobooth Management**: Manage Filters, Upload Assets, Categorize, Archive, Reorder
- **Admin - Chatbot Management**: Manage Entries, Add Knowledge, Edit Responses, Manage Tags
- **Admin - Emergency Management**: Manage Contacts, Add/Edit/Delete, Reorder
- **Admin - System Logs**: View Logs, Filter, View Admin Activity

---

### 5. [Sequence Diagrams](./03_SEQUENCE_DIAGRAMS.md)
**Purpose**: Visual representation of system interactions and data flow

**Contents**: 16 comprehensive sequence diagrams

**Authentication Sequences**:
1. User Registration and Email Verification
2. User Login with Email
3. Google OAuth Login
4. Password Reset

**Itinerary Management Sequences**:
5. Create Custom Itinerary
6. Start Tour and Mark Site as Visited
7. Browse and View Itinerary Details

**Review System Sequences**:
8. Write Review with Photos
9. Edit and Delete Review

**Admin Management Sequences**:
10. Admin - Add New Site
11. Admin - Manage User Roles
12. Admin - Manage Photobooth Filters
13. Admin - Manage Chatbot Knowledge
14. Admin - View System Logs

**User Feature Sequences**:
15. Tourist - Use Photobooth
16. User - Interact with AI Chatbot

**Diagram Format**: PlantUML with actors, frontend, backend, database, and external services

---

### 6. [Database Diagram](./04_DATABASE_DIAGRAM.md)
**Purpose**: Complete database schema and relationships

**Contents**:
- Entity Relationship Diagram (ERD) in PlantUML
- 13 MongoDB collections with detailed schemas
- Relationship mappings (1:N, M:N, embedded)
- Indexes and performance optimization
- Data integrity rules
- Database size estimates

**Collections**:
1. **User** - User accounts and profiles
2. **Pin** - Tourist sites/locations
3. **Itinerary** - Tour itineraries
4. **VisitedSite** - Site visit tracking
5. **Review** - User reviews and ratings
6. **PhotoboothFilter** - Photobooth assets
7. **BotEntry** - Chatbot knowledge base
8. **Tag** - Categorization tags
9. **EmergencyContact** - Emergency information
10. **Log** - Admin activity logs
11. **PendingUser** - Temporary registration data
12. **Mask** - Face mask overlays (legacy)
13. **Filter** - Photo filters (legacy)

**Key Features**:
- Compound unique indexes for data integrity
- Foreign key relationships
- Embedded documents for performance
- Validation rules and constraints

---

### 7. [Web Hosting & Deployment](./05_WEB_HOSTING_DEPLOYMENT.md)
**Purpose**: Complete deployment and hosting guide

**Contents**:

**System Architecture**:
- 4-layer architecture diagram
- Technology stack (Frontend & Backend)
- External services integration

**Hosting Options**:
1. **Render.com** (Current/Recommended)
2. **Vercel + Render/Railway**
3. **Netlify + Backend Hosting**
4. **Self-Hosted VPS**

**Deployment Guides**:
- Frontend deployment (Render)
- Backend deployment (Render)
- Database setup (MongoDB Atlas)
- File storage configuration (Local/Cloud)
- PWA configuration
- SSL/HTTPS setup

**Additional Topics**:
- Performance optimization strategies
- Monitoring and maintenance
- Cost estimation (Free to Enterprise tiers)
- Deployment checklist
- Troubleshooting guide
- Security best practices

**Current Deployment**:
- Frontend: `https://juander.onrender.com`
- Backend: `https://juander-dbd5.onrender.com`
- Database: MongoDB Atlas

---

## 🎯 System Summary

### System Name
**Intramuros Tourism System**

### System Type
Progressive Web Application (PWA)

### Primary Purpose
Enhance tourist experience in Intramuros through digital tour management, interactive maps, AR content, reviews, and AI assistance.

### Target Users
- **Guests**: Unauthenticated visitors exploring the system
- **Tourists**: Registered users planning and documenting visits
- **Administrators**: System managers maintaining content and users

### Core Features
1. **Multi-role Authentication** - Email, Google OAuth, OTP verification
2. **Custom Itinerary Creation** - Personalized tour planning
3. **Interactive 3D Maps** - Mapbox-powered navigation with AR
4. **Trip Archives & Reviews** - Post-visit documentation with photos
5. **Cultural Photobooth** - Photo capture with themed filters
6. **AI Chatbot** - Multi-language tourist assistance
7. **Emergency Services** - Quick access to emergency contacts
8. **Offline Support** - PWA with service workers
9. **Admin Dashboard** - Comprehensive content management
10. **Multi-language** - English and Filipino support

### Technology Stack
- **Frontend**: React 18, Vite, Tailwind CSS, Mapbox GL JS
- **Backend**: Node.js, Express.js, MongoDB, JWT
- **Deployment**: Render.com, MongoDB Atlas
- **PWA**: Service Workers, Web App Manifest

### Database
- **Type**: MongoDB (NoSQL)
- **Collections**: 13
- **Total Use Cases**: 77
- **Sequence Diagrams**: 16

---

## 📊 Documentation Statistics

| Category | Count |
|----------|-------|
| Total Use Cases | 77 |
| Actor Types | 3 |
| Modules | 16 |
| Sequence Diagrams | 16 |
| Database Collections | 13 |
| Documentation Files | 7 |
| Total Pages | ~100+ |

---

## 🔍 How to Use This Documentation

### For Developers
1. Start with **Use Case Diagram** to understand system scope
2. Review **Sequence Diagrams** for implementation details
3. Study **Database Diagram** for data modeling
4. Follow **Deployment Guide** for hosting setup

### For Project Managers
1. Review **Use Case Descriptions** for feature requirements
2. Check **System Summary** for project overview
3. Refer to **Cost Estimation** for budget planning

### For Stakeholders
1. Read **System Summary** for high-level understanding
2. Review **Core Features** for system capabilities
3. Check **Deployment Options** for hosting strategies

### For QA/Testers
1. Use **Use Case Descriptions** as test scenarios
2. Follow **Use Case Steps** for test case creation
3. Verify **Post-Conditions** for expected outcomes

---

## 🛠️ Tools Required to View Diagrams

### PlantUML Diagrams
The documentation contains PlantUML diagrams that need to be rendered:

**Option 1: VS Code Extension**
- Install "PlantUML" extension
- Preview diagrams directly in VS Code

**Option 2: Online Viewer**
- Visit: http://www.plantuml.com/plantuml/uml/
- Copy and paste PlantUML code

**Option 3: Local PlantUML**
- Install Java and Graphviz
- Install PlantUML JAR
- Generate PNG/SVG from command line

---

## 📝 Document Maintenance

### Version History
- **v1.0** (2025-10-29): Initial comprehensive documentation
  - Complete use case diagrams and descriptions
  - All sequence diagrams
  - Database schema
  - Deployment guide

### Update Guidelines
1. Update use cases when features change
2. Regenerate diagrams for architectural changes
3. Keep deployment guide current with hosting changes
4. Document all major system modifications

### Contact Information
For documentation updates or questions:
- Review the system codebase at: `d:\Desktop\Juander`
- Check existing documentation files
- Refer to inline code comments

---

## 🎓 Additional Resources

### External Documentation
- [React Documentation](https://react.dev/)
- [Express.js Guide](https://expressjs.com/)
- [MongoDB Manual](https://docs.mongodb.com/)
- [Mapbox GL JS](https://docs.mapbox.com/mapbox-gl-js/)
- [PWA Documentation](https://web.dev/progressive-web-apps/)

### Related Files in Project
- `FEATURE_FLOW_DIAGRAM.md` - Feature implementation flows
- `PWA_IMPLEMENTATION_GUIDE.md` - PWA setup details
- `OFFLINE_DETECTION_GUIDE.md` - Offline functionality
- `PHOTOBOOTH_BORDER_ASSET_STANDARD.md` - Photobooth guidelines

---

## ✅ Documentation Completeness Checklist

- [x] Use Case Diagram with all actors and use cases
- [x] Detailed use case descriptions with steps
- [x] System and subsystem sequence diagrams
- [x] Complete database schema and ERD
- [x] Web hosting and deployment guide
- [x] Technology stack documentation
- [x] Security and performance guidelines
- [x] Cost estimation and hosting options
- [x] Troubleshooting guide
- [x] Maintenance procedures

---

## 🚀 Quick Start Guide

### For New Developers
1. Read this README first
2. Review Use Case Diagram (01)
3. Study 2-3 key Sequence Diagrams (03)
4. Understand Database Schema (04)
5. Set up local development environment
6. Follow Deployment Guide (05) for production

### For System Administrators
1. Review Admin use cases (Part 3)
2. Study Admin sequence diagrams
3. Understand database structure
4. Follow deployment and hosting guide
5. Set up monitoring and backups

### For End Users
1. Review Guest/Tourist use cases
2. Understand available features
3. Check PWA installation guide
4. Explore offline capabilities

---

## 📄 License & Copyright

**System**: Intramuros Tourism System  
**Organization**: Intramuros Administration  
**Year**: 2025  
**Documentation**: All rights reserved

---

## 🎉 Conclusion

This comprehensive documentation package provides everything needed to understand, develop, deploy, and maintain the Intramuros Tourism System. The documentation follows industry standards and includes:

✅ **Visual Diagrams** - Use case and sequence diagrams  
✅ **Detailed Descriptions** - Step-by-step use case flows  
✅ **Technical Specifications** - Database and architecture  
✅ **Deployment Guides** - Complete hosting instructions  
✅ **Best Practices** - Security and performance guidelines  

**Total Documentation**: 7 comprehensive files covering all aspects of the system.

For any questions or clarifications, please refer to the specific documentation files or review the system codebase.

---

**Last Updated**: October 29, 2025  
**Documentation Version**: 1.0  
**System Version**: Production Ready

