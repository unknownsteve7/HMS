# SSE Hostel Management System

A comprehensive hostel management system built with React.js for managing student bookings, room allocations, payments, and administrative operations.

##  Features

### For Students
- **User Registration & Authentication**
  - Email-based registration with OTP verification
  - Secure login with JWT authentication
  - Password reset functionality
  
- **Room Browsing & Booking**
  - Browse available rooms with detailed information
  - View room layouts with cot positions
  - Filter rooms by type, gender preference, and facilities
  - Book specific cots within rooms
  - One active booking per student policy enforcement
  
- **Payment Management**
  - Integrated PayU payment gateway
  - Flexible payment options (partial/full payments)
  - Real-time payment status tracking
  - Payment history with transaction details
  - Support for concessions/custom pricing
  
- **Dashboard & Analytics**
  - Personal booking history
  - Payment statistics
  - Balance due tracking
  - Concession amount visibility

### For Admins
- **Student Management**
  - View all registered students
  - Filter by branch, year, and gender
  - Edit student information
  - Apply custom pricing/concessions
  - View student booking and payment details
  
- **Room Management**
  - Create and manage rooms
  - Configure room layouts with custom cot arrangements
  - Set pricing and facilities
  - Track room occupancy
  
- **Booking Management**
  - View all bookings
  - Track booking statuses
  - Monitor payment progress
  - Cancel bookings if needed
  
- **Payment Tracking**
  - Monitor all transactions
  - Track pending balances
  - View payment gateway responses
  - Generate payment reports

##  Tech Stack

- **Frontend Framework:** React 18.3.1
- **Routing:** React Router DOM 6.28.0
- **Styling:** Tailwind CSS 4.1.17
- **Icons:** Lucide React 0.536.0
- **Build Tool:** Vite 6.2.0
- **HTTP Client:** Fetch API
- **PDF Generation:** jsPDF 3.0.2
- **Canvas:** html2canvas 1.4.1
- **Payment Gateway:** PayU Integration

##  Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn package manager
- Backend API server running

### Installation

1. Clone the repository

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure environment variables - Create a `.env` file in the root directory:
   ```env
   VITE_API_URL=http://localhost:8000
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

5. Open your browser and navigate to `http://localhost:5173`

### Build for Production

```bash
npm run build
```

The production-ready files will be in the `dist` directory.

### Preview Production Build

```bash
npm run preview
```

##  Authentication

### Registration Flow
1. Student fills registration form with personal and academic details
2. System sends OTP to registered email
3. Student enters OTP to verify email
4. Account is created upon successful verification

### Login Credentials

Use the credentials configured in your backend system:

#### Admin Login
- Email and password from backend admin accounts
- **Access**: Full administrative dashboard
- **Features**: Student management, room management, booking oversight, payment tracking

#### Student Login
- Email and password from registered student accounts
- **Access**: Student portal with booking capabilities
- **Features**: Browse rooms, make bookings, manage payments, view history

### Password Reset
1. Click "Forgot Password" on login page
2. Enter registered email address
3. Receive OTP via email
4. Enter OTP and set new password

### Login Flow
1. **Select User Type**: Choose between "Student" or "Admin" tab
2. **Enter Credentials**: Use your registered email and password
3. **Automatic Navigation**: After successful login, you'll be redirected to the appropriate dashboard
4. **Session Persistence**: Your login state is saved and restored on page refresh

### Features by User Type

#### Admin Dashboard
- View total students, rooms, and bookings
- Manage student registrations and apply concessions
- Create and manage rooms with custom layouts
- Handle booking requests and cancellations
- Track payments, transactions, and revenue
- Generate reports

#### Student Dashboard
- Browse available rooms with filters
- Make room bookings (one active booking limit)
- Make payments via PayU gateway
- View booking and payment history
- Track payment status and pending balance
- Update profile information

##  Project Structure

```
frontend1/
├── components/
│   ├── auth/              # Authentication components
│   │   ├── AuthLayout.jsx
│   │   └── ProtectedRoute.jsx
│   ├── layout/            # Layout components
│   │   ├── Header.jsx
│   │   ├── Sidebar.jsx
│   │   ├── PageWrapper.jsx
│   │   └── StudentHeader.jsx
│   ├── payu/              # Payment gateway components
│   │   ├── PayUPayment.jsx
│   │   └── PaymentStatus.jsx
│   ├── student/           # Student-specific components
│   │   ├── BookingCard.jsx
│   │   ├── RoomCard.jsx
│   │   ├── FilterSidebar.jsx
│   │   └── StudentLayout.jsx
│   └── ui/                # Reusable UI components
│       ├── Button.jsx
│       ├── Card.jsx
│       ├── Input.jsx
│       ├── Modal.jsx
│       └── ...
├── context/               # React Context providers
│   ├── AppContext.jsx     # Global app state
│   └── ToastContext.jsx   # Toast notifications
├── hooks/                 # Custom React hooks
│   └── useFacilities.js
├── pages/                 # Page components
│   ├── student/           # Student pages
│   │   ├── Dashboard.jsx
│   │   ├── BrowseRooms.jsx
│   │   ├── MyBookings.jsx
│   │   └── ...
│   ├── Dashboard.jsx      # Admin dashboard
│   ├── RoomManagement.jsx
│   ├── StudentManagement.jsx
│   └── ...
├── apiService.js          # API communication layer
├── constants.jsx          # App constants
├── App.jsx               # Main app component
└── index.jsx             # App entry point
```

##  UI Components

### Core Components
- **Button**: Customizable button with variants (primary, secondary, destructive)
- **Card**: Container component for content sections
- **Input**: Form input with label and validation
- **Select**: Dropdown select component
- **Modal**: Reusable modal dialog
- **Table**: Data table with sorting and filtering
- **Toast**: Notification system for user feedback
- **StatusTag**: Visual status indicators

##  Key Features Implementation

### One Active Booking Per Student
- Students can only have one active booking at a time
- Enforced at the application level during booking creation
- Cancelled and completed bookings don't count toward the limit

### Concession Management
- Admins can set custom pricing for students via Student Management
- Concession amount displayed only when greater than ₹0
- Automatically reflected in payment calculations
- Visible in student dashboard and booking details
- Reduces the pending balance automatically

### Payment Validation
- Prevents overpayment beyond pending balance
- Real-time balance calculation considering concessions
- Support for partial and full payments
- Validation before payment gateway redirect
- Maximum payment limited to pending balance

##  API Integration

### Backend Requirements

The application expects the following API endpoints:

**Authentication**
- `POST /students/register` - Student registration
- `POST /api/auth/send-otp` - Send OTP for verification
- `POST /api/auth/student/login` - Student login
- `POST /api/auth/admin/login` - Admin login
- `POST /api/auth/reset-password` - Reset password

**Rooms**
- `GET /rooms` - Get all rooms
- `GET /rooms/:id` - Get room by ID
- `POST /rooms` - Create room (admin)
- `PUT /rooms/:id` - Update room (admin)
- `DELETE /rooms/:id` - Delete room (admin)

**Bookings**
- `GET /bookings/me` - Get user bookings
- `POST /bookings/me` - Create booking
- `PUT /bookings/:id/cancel` - Cancel booking
- `GET /bookings` - Get all bookings (admin)

**Payments**
- `POST /api/payments/initiate` - Initiate PayU payment
- `GET /api/payments/transaction/:txnid` - Get transaction details
- `GET /payments/student/transactions` - Get student transactions

**Students (Admin)**
- `GET /students` - Get all students
- `PUT /students/:id` - Update student (includes concession_amount)
- `DELETE /students/:id` - Delete student

**Facilities**
- `GET /facilities` - Get all facilities

**Dashboard**
- `GET /students/dashboard/me` - Get student dashboard stats

##  User Roles

### Student
- Browse and book rooms with advanced filters
- Make payments via PayU gateway
- View booking history and status
- Track payment status and balance
- View concessions (if applicable)
- Update profile information

### Admin
- Manage students (view, edit, delete)
- Apply concessions to individual students
- Manage rooms and facilities
- View all bookings across the system
- Track all payments and transactions
- Monitor system statistics
- Generate and export reports

##  Error Handling

- Global error boundary for React errors
- API error handling with user-friendly messages
- Toast notifications for all operations
- Form validation with inline error messages
- Network error detection and fallback mechanisms
- Payment gateway error handling
- OTP validation and resend functionality

##  Performance Optimizations

- React.memo for component optimization
- useMemo and useCallback for expensive calculations
- Lazy loading for routes (if implemented)
- Code splitting
- Debounced search inputs
- Efficient state management with Context API
- Conditional rendering to reduce DOM operations

##  Configuration

### Environment Variables
The application uses environment variables for configuration:
```env
VITE_API_URL=http://localhost:8000
```

### API Service
- Centralized error handling
- Authentication token management
- Automatic token inclusion from localStorage
- Request/response interceptors

##  Future Enhancements

- [ ] Real-time notifications using WebSockets
- [ ] Advanced reporting and analytics dashboard
- [ ] Mobile app version (React Native)
- [ ] Multi-language support
- [ ] Automated email notifications for bookings
- [ ] Room maintenance tracking
- [ ] Feedback and complaints system
- [ ] QR code for check-in/check-out
- [ ] Biometric integration
- [ ] Bulk operations for admin
- [ ] Export data to Excel/PDF

##  Troubleshooting

### Common Issues

**Login Problems**
- Verify credentials are correct
- Check that backend server is running
- Clear browser cache and localStorage
- Check network connectivity

**Payment Issues**
- Ensure PayU credentials are configured in backend
- Check callback URLs are correctly set
- Verify payment amount is within limits
- Check transaction status via transaction ID

**Blank Screen**
- Check browser console for errors (F12)
- Verify API_URL is correctly configured
- Ensure backend server is accessible
- Clear browser cache

##  License

This project is proprietary software for SSE Hostel Management.

##  Support

For support and queries, please contact the development team 
or raise an issue in the repository.

# Developers
- Anand Velpuri
- Naga Mohan Madicharla

# Designer
- Venkata Leeladhar Abburi


**Built with ❤️ for SSE Hostel Management**

