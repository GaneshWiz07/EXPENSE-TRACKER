
**LIVE SITE:**(https://expense-tracker-m31t.onrender.com)[https://expense-tracker-m31t.onrender.com]

# Expense Tracker

A comprehensive web application for tracking personal expenses with features for expense management, visualization, and detailed financial analytics.

## Overview

Expense Tracker is a full-stack web application built with the MERN (MongoDB, Express.js, React, Node.js) stack that helps users manage their personal finances. It provides a secure and intuitive interface for tracking expenses, visualizing spending patterns, and managing financial data.

## Features

- **User Authentication**: Secure login and registration using Firebase Authentication
- **Expense Management**: Add, edit, and delete expense records with details like amount, category, date, and description
- **Dashboard Analytics**: Visual representation of spending patterns and financial trends
- **Category Management**: Organize expenses by categories and subcategories
- **Payment Method Tracking**: Track different payment methods used for expenses
- **Monthly Reports**: View and analyze monthly expense summaries
- **Responsive Design**: Full mobile and desktop compatibility

## Tech Stack

### Frontend

- React.js
- React Router for navigation
- Chart.js for data visualization
- Firebase Authentication
- Axios for API communication

### Backend

- Node.js
- Express.js
- MongoDB with Mongoose
- Firebase Admin SDK for authentication
- CORS for cross-origin resource sharing

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- MongoDB
- Firebase account

### Installation

1. Clone the repository:

```bash
git clone https://github.com/yourusername/expense-tracker.git
cd expense-tracker
```

2. Install backend dependencies:

```bash
cd backend
npm install
```

3. Install frontend dependencies:

```bash
cd ../frontend
npm install
```

4. Set up environment variables:

Create `.env` files in both backend and frontend directories with the following variables:

Backend `.env`:

```
MONGODB_URI=your_mongodb_connection_string
PORT=5000
```

Frontend `.env`:

```
REACT_APP_API_URL=http://localhost:5000
REACT_APP_FIREBASE_CONFIG=your_firebase_config
```

5. Start the application:

Backend:

```bash
cd backend
npm start
```

Frontend:

```bash
cd frontend
npm start
```

## Usage

1. Register or log in using your credentials
2. Add expenses through the "Add Expense" form
3. View your expenses in the dashboard
4. Analyze spending patterns through charts and graphs
5. Manage and categorize expenses as needed

## Deployment

The application can be deployed using various platforms:

- Frontend: Vercel, Netlify, or Firebase Hosting
- Backend: Heroku, DigitalOcean, or AWS
- Database: MongoDB Atlas

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request
