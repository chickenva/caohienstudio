# Cao Hien Studio

Cao Hien Studio is a comprehensive web application designed for a photography studio. It provides a customer-facing website for viewing galleries, booking services, and an administrative dashboard for managing the studio's operations including orders, galleries, services, and content.

## Features

*   **Customer Portal:**
    *   View photography galleries and portfolios.
    *   Browse available services and pricing.
    *   Online booking system with automated contract generation.
    *   Secure online payments via PayOS.
    *   AI Chatbot for customer support and FAQs.
*   **Admin Dashboard:**
    *   Manage customer bookings and orders.
    *   Upload and manage portfolio galleries (integrated with Google Drive).
    *   Manage services and website content.
    *   View statistics and reports.

## Technology Stack

The project is structured as a monorepo containing both the frontend and backend applications.

### Frontend
*   **Framework:** React 19 (Vite)
*   **Routing:** React Router v7
*   **UI Component Library:** Ant Design (antd)
*   **Styling:** Vanilla CSS with custom Ant Design themes
*   **Data Fetching:** Axios
*   **Real-time Communication:** Socket.io-client
*   **Charts:** Recharts
*   **Utilities:** Dayjs, dnd-kit

### Backend
*   **Runtime:** Node.js
*   **Framework:** Express.js
*   **Database:** MongoDB (Mongoose)
*   **Authentication:** JWT (jsonwebtoken), bcrypt
*   **Payment Gateway:** PayOS
*   **Cloud Storage:** Google Drive API
*   **AI Integration:** Google Generative AI (Gemini)
*   **File Processing:** Multer, PDFKit
*   **Other Tools:** Nodemailer, Node-cron, Socket.io, Redis

## Getting Started

### Prerequisites
*   Node.js installed
*   MongoDB instance running
*   Google Service Account credentials for Drive API
*   Gemini API Key
*   PayOS Account

### Installation

1.  Clone the repository.
2.  Install dependencies for both frontend and backend:
    ```bash
    cd frontend
    npm install
    cd ../backend
    npm install
    ```

### Configuration

You will need to create `.env` files in both the `frontend` and `backend` directories. 

**Backend `.env` Requirements (Example):**
*   `PORT=5000`
*   `MONGODB_URI=...`
*   `JWT_SECRET=...`
*   `GOOGLE_APPLICATION_CREDENTIALS=./google-service-account.json`
*   `GEMINI_API_KEY=...`
*   `PAYOS_CLIENT_ID=...`
*   `PAYOS_API_KEY=...`
*   `PAYOS_CHECKSUM_KEY=...`
*   `REDIS_URL=...`

**Frontend `.env` Requirements (Example):**
*   `VITE_API_URL=http://localhost:5000/api`

### Running the Application

Start the backend server:
```bash
cd backend
npm run dev
```

Start the frontend development server:
```bash
cd frontend
npm run dev
```

The frontend will typically be accessible at `http://localhost:5173` and the backend API at `http://localhost:5000`.

## Project Structure

*   `/frontend`: Contains the React application.
    *   `src/components/`: Reusable UI components.
    *   `src/pages/`: Page components organized by roles (customer, admin, auth).
    *   `src/utils/`: Utility functions.
*   `/backend`: Contains the Node.js/Express API.
    *   `controllers/`: Request handling and business logic.
    *   `routes/`: API endpoint definitions.
    *   `models/`: MongoDB schema definitions.
    *   `services/`: Integrations with external APIs (Drive, Gemini, etc.).
    *   `jobs/`: Scheduled cron jobs.
