# Cao Hien Studio - AI Context & Project Overview

This file (`AI_README.md`) is written specifically for AI coding assistants to quickly understand the architecture, tech stack, and structure of the **Cao Hien Studio** project.

## 1. Project Overview
Cao Hien Studio is a web application for a photography studio. It includes a customer-facing website for viewing galleries, services, and making bookings, and an administrative dashboard for managing orders, galleries, services, customers, and website content.

The project is structured as a monorepo with two main folders:
- `/frontend`: React application (Vite).
- `/backend`: Node.js/Express REST API.

## 2. Tech Stack

### Frontend
- **Framework:** React 19 (via Vite)
- **Routing:** React Router v7
- **UI Library:** Ant Design (antd)
- **State/Data Fetching:** Axios (REST), Socket.io-client (Realtime)
- **Charts:** Recharts
- **Styling:** Vanilla CSS & Ant Design custom themes
- **Utils:** Dayjs (date parsing), dnd-kit (drag & drop)

### Backend
- **Runtime:** Node.js (CommonJS)
- **Framework:** Express.js
- **Database:** MongoDB (via Mongoose)
- **Authentication:** JWT (jsonwebtoken), bcrypt/bcryptjs
- **Payment Gateway:** PayOS (`@payos/node`)
- **Cloud Storage:** Google Drive API (`googleapis`)
- **AI Integration:** Google Generative AI (`@google/generative-ai`) for AI Chat
- **File Processing:** Multer (uploads), PDFKit (generating contracts)
- **Other Services:** Nodemailer (emails), Node-cron (scheduled jobs), Socket.io (realtime), Redis, QRCode.

## 3. Directory Structure

### `/backend`
- `controllers/`: Request handlers containing business logic.
- `routes/`: Express route definitions.
  - `authRoutes`, `bookingRoutes`, `galleryRoutes`, `serviceRoutes`, `userRoutes`, `dashboardRoutes`, `driveRoutes`, `aiChatRoutes`, `websiteRoutes`, etc.
- `models/`: Mongoose schemas.
  - `Booking`, `Category`, `Contact`, `OTP`, `Order`, `Payment`, `PublicGallery`, `Service`, `SiteLock`, `User`, `WebsiteImage`.
- `services/`: Encapsulated external service calls (e.g., mailer, drive API, AI).
- `jobs/`: Cron jobs (e.g., scheduled email reminders for bookings).
- `middleware/`: Express middlewares (Auth, Uploads, Error Handling).
- `config/`: Database or environment configuration.
- `server.js`: Application entry point.

### `/frontend/src`
- `components/`: Reusable React components (e.g., layouts, buttons).
- `pages/`: Route components divided by access level.
  - `customer/`: Home, About, Galleries, Services, Booking, Profile, MyBookings, etc.
  - `admin/`: Dashboard, AdminOrders, AdminGalleries, AdminServices, AdminCustomers, AdminWebsiteImages, etc.
  - `auth/`: Login, Register, ForgotPassword.
  - `policies/`: RefundPolicy, Contract.
- `assets/`: Static assets (images, icons).
- `utils/`: Helper functions (formatting, date utilities).
- `config/`: Frontend configuration (e.g., Axios setup).
- `App.jsx`: Main routing configuration mapping URLs to pages.
- `main.jsx`: React rendering entry point.

## 4. Key Business Flows

### Booking System
- Customers can view services and make a booking.
- A contract is generated dynamically (via PDFKit) for the booking.
- Customers can review the contract (`/contract-review/:bookingId`).
- Payments are processed via **PayOS**.
- Status updates (Pending, Confirmed, Cancelled, Completed) are managed by the admin.

### Gallery & Portfolio
- The studio showcases images in Galleries.
- Backend integrates with **Google Drive API** (using `google-service-account.json`) to fetch or store images, avoiding heavy local storage.
- Admins can manage images shown on the Home and About pages via `WebsiteImage` models.

### AI Chatbot
- Integrated using Google's Gemini API (`@google/generative-ai`).
- Located in `aiChatRoutes.js`, likely serving as a customer support assistant for FAQ or service inquiries.

### Authentication & Roles
- Basic JWT-based authentication.
- Users have roles (likely `admin` and `customer/user`). 
- Admin routes are protected and nested under `/admin` in the frontend and have middleware protection in the backend.

## 5. Running the Project

Both frontend and backend rely on `.env` files for configuration.

- **Backend:** `npm run dev` (starts on port 5000 via nodemon).
- **Frontend:** `npm run dev` (starts Vite dev server).

*Note: Ensure MongoDB is running and Google Service Account JSON is properly configured in the backend for full functionality.*

## 6. Guidelines for AI Modifying this Codebase
- **Styling:** Prefer vanilla CSS or Ant Design's built-in styling mechanisms. Avoid adding TailwindCSS unless explicitly requested.
- **Routing:** The app uses React Router v7 components. Maintain the logical separation in `App.jsx` (Customer vs. Admin routes).
- **API Calls:** Use the configured Axios instance in `frontend/src/config` (or similar) to ensure auth headers are passed correctly.
- **Component Design:** Keep components small. If modifying Admin pages, stick to Ant Design tables, forms, and modals to maintain visual consistency.
