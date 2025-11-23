# Sanskrithi Hostel Management Portal

A comprehensive hostel management system for students and administrators.

## Features

- **Student Portal**: Browse rooms, make bookings, view payment history
- **Admin Portal**: Manage students, rooms, bookings, and payments
- **Responsive Design**: Works on desktop and mobile devices
- **Real-time Updates**: Live data synchronization

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

4. Open your browser and navigate to `http://localhost:5174`

## Login System

### Login Credentials

Use the credentials configured in your backend system:

#### Admin Login
- Use admin credentials from your backend
- **Access**: Full administrative dashboard

#### Student Login
- Use student credentials from your backend
- **Access**: Student portal with booking capabilities

**Note**: The test credentials shown in the login form are for demonstration only. Use actual credentials from your backend system.

### Login Flow

1. **Select User Type**: Choose between "Student" or "Admin" tab
2. **Enter Credentials**: Use the test credentials above
3. **Automatic Navigation**: After successful login, you'll be redirected to the appropriate dashboard
4. **Session Persistence**: Your login state is saved and restored on page refresh

### Features by User Type

#### Admin Dashboard
- View total students, rooms, and bookings
- Manage student registrations
- Create and manage rooms
- Handle booking requests
- Track payments and revenue

#### Student Dashboard
- Browse available rooms
- Make room bookings
- View booking history
- Track payment status
- Update profile information

## Development

### API Integration

The application is configured to use real APIs:
- API base URL: `http://192.168.31.148:8000` (configured in `apiService.js`)
- All data is fetched from the backend server
- Authentication tokens are managed automatically

### Backend Requirements

The application expects the following API endpoints:
- `POST /login` - User authentication
- `GET /rooms` - Fetch all rooms
- `GET /students` - Fetch all students
- `GET /profile` - Get current user profile
- Additional endpoints for bookings and payments (to be implemented)

## Troubleshooting

### Blank Screen Issues
- Check browser console for errors (F12)
- Clear browser cache and localStorage
- Use the "Reset Application" button on the login page

### Login Problems
- Verify you're using the correct test credentials
- Check that the development server is running
- Ensure no network connectivity issues

## Project Structure

```
├── components/          # Reusable UI components
├── context/            # React context providers
├── data/              # Mock data files
├── pages/             # Page components
│   ├── student/       # Student-specific pages
│   └── ...           # Admin pages
├── apiService.js      # API integration
└── App.jsx           # Main application component
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.
