import React, { useState, useMemo, useEffect } from 'react';
import Card from '../components/ui/Card';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import { Table, TableRow, TableCell } from '../components/ui/Table';
import StatusTag from '../components/ui/StatusTag';
import Button from '../components/ui/Button';
import { useAppContext } from '../context/AppContext';
import { useToast } from '../context/ToastContext';
import { initiatePayUPayment, redirectToPayU, API_URL } from '../apiService';
import {
  Eye, Edit, Ban, PlusCircle, ArrowRight, User, Bed, ListChecks, CreditCard, Loader2
} from 'lucide-react';

const BookingManagement = () => {
  const { bookings, students, rooms, addBooking, addPayment, fetchBookings, fetchStudents, fetchRooms, authToken } = useAppContext();
  const { showSuccess } = useToast ? useToast() : { showSuccess: console.log };
  const [step, setStep] = useState(0); // 0 for list, 1-4 for wizard
  const [isDataLoading, setIsDataLoading] = useState(true);

  // Check for payment success query parameter
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const paymentSuccess = urlParams.get('payment_success');
    if (paymentSuccess === 'true') {
      showSuccess('Payment completed successfully! The booking has been created.');

      // Remove the query parameter from URL without reload
      const newUrl = window.location.pathname;
      window.history.replaceState({}, document.title, newUrl);

      // Refresh bookings list
      fetchBookings?.();
    }
  }, [showSuccess, fetchBookings]);

  // Enhanced logging for debugging
  useEffect(() => {
    console.log('🔍 BookingManagement - Current data state:', {
      bookings: {
        isArray: Array.isArray(bookings),
        length: bookings?.length,
        sample: bookings?.[0]
      },
      students: {
        isArray: Array.isArray(students),
        length: students?.length,
        sample: students?.[0]
      },
      rooms: {
        isArray: Array.isArray(rooms),
        length: rooms?.length,
        sample: rooms?.[0]
      }
    });
  }, [bookings, students, rooms]);

  // Always fetch the latest data when component mounts
  useEffect(() => {
    console.log('📋 BookingManagement - Component mounted');
    setIsDataLoading(true);

    const fetchAllData = async () => {
      try {
        // Fetch all necessary data in parallel
        const promises = [];

        if (fetchBookings) {
          console.log('📋 BookingManagement - Fetching bookings...');
          promises.push(fetchBookings());
        }

        if (fetchStudents) {
          console.log('📋 BookingManagement - Fetching students...');
          promises.push(fetchStudents());
        }

        if (fetchRooms) {
          console.log('📋 BookingManagement - Fetching rooms...');
          promises.push(fetchRooms());
        }

        await Promise.all(promises);
        console.log('✅ BookingManagement - All data fetched successfully');
      } catch (error) {
        console.error('❌ Error fetching data:', error);
      } finally {
        setIsDataLoading(false);
      }
    };

    fetchAllData();
  }, [fetchBookings, fetchStudents, fetchRooms]);

  // Wizard State
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [selectedCot, setSelectedCot] = useState(null);
  const [bookingDetails, setBookingDetails] = useState({});
  const [temporaryBookingId, setTemporaryBookingId] = useState(null);

  // Helper functions to handle different property naming conventions
  const getStudentName = (studentId) => {
    if (!students || !Array.isArray(students)) return 'N/A';
    const student = students.find(s =>
      (s.id === studentId) ||
      (s.student_id === studentId) ||
      (s._id === studentId)
    );
    return student?.full_name || student?.name || student?.fullName || 'N/A';
  };

  const getRoomInfo = (roomId) => {
    if (!rooms || !Array.isArray(rooms)) return null;
    return rooms.find(r =>
      (r.id === roomId) ||
      (r.room_id === roomId) ||
      (r._id === roomId)
    ) || null;
  };

  const startBooking = () => setStep(1);

  const handleSelectStudent = (student) => {
    setSelectedStudent(student);
    setStep(2);
  };

  const handleSelectRoomAndCot = async (room, cot) => {
    setSelectedRoom(room);
    setSelectedCot(cot);

    try {
      // Generate a temporary booking ID that will be used for payment
      const bookingId = `BOOK_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
      setTemporaryBookingId(bookingId);
      console.log('🆔 Generated temporary booking ID:', bookingId);

      // Create a preliminary booking record on the server
      const preliminaryBooking = {
        booking_id: bookingId,
        student_id: selectedStudent?.id || selectedStudent?.student_id || selectedStudent?._id,
        room_id: room?.id || room?.room_id || room?._id,
        cot_id: cot?.id || cot?.cot_id,
        cot_number: cot?.number || cot?.cot_number,
        status: 'Draft',
        created_at: new Date().toISOString()
      };

      console.log('📝 Creating preliminary booking record:', preliminaryBooking);

      // Send the preliminary booking to the backend
      const response = await fetch(`${API_URL}/admin/bookings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify(preliminaryBooking)
      });

      if (!response.ok) {
        throw new Error(`Failed to create preliminary booking: ${response.statusText}`);
      }

      const result = await response.json();
      console.log('✅ Created preliminary booking:', result);

      // Update the temporary booking ID if the server provides one
      if (result.id || result.booking_id) {
        setTemporaryBookingId(result.id || result.booking_id);
      }

    } catch (error) {
      console.error('❌ Failed to create preliminary booking:', error);
      // Continue with local booking ID as fallback
    }

    setStep(3);
  };

  const handleBookingDetailsSubmit = (details) => {
    setBookingDetails({
      studentId: selectedStudent.id || selectedStudent.student_id || selectedStudent._id,
      roomId: selectedRoom.id || selectedRoom.room_id || selectedRoom._id,
      cotId: selectedCot.id || selectedCot.cot_id || selectedCot._id,
      cotNumber: selectedCot.number || selectedCot.cot_number,
      checkInDate: details.checkInDate,
      checkOutDate: details.checkOutDate,
      emergencyContactName: details.emergencyContactName,
      emergencyContactMobile: details.emergencyContactMobile,
      academicYear: details.academicYear,
      totalAmount: selectedRoom.pricePerYear || selectedRoom.price_per_year,
    });
    setStep(4);
  };

  const handleCreateBooking = (paymentDetails) => {
    // If this is an offline payment (cash, bank transfer), create booking directly
    if (paymentDetails.paymentMethod !== 'Online Payment') {
      const finalBookingData = {
        ...bookingDetails,
        status: 'Pending Check-in',
        paymentStatus: paymentDetails.amount >= bookingDetails.totalAmount ? 'Fully Paid' : 'Advance Paid',
        amountPaid: paymentDetails.amount,
        balance: bookingDetails.totalAmount - paymentDetails.amount,
      };

      addBooking(finalBookingData);
      addPayment({
        bookingId: `B${Date.now()}`,
        studentId: finalBookingData.studentId,
        amount: paymentDetails.amount,
        type: paymentDetails.paymentType,
        method: paymentDetails.paymentMethod,
        status: 'Successful',
        date: new Date().toISOString()
      });
    }
    // For online payments, the booking will be created by PaymentStatus component after successful payment
    // using the data stored in sessionStorage

    // Reset wizard
    setStep(0);
    setSelectedStudent(null);
    setSelectedRoom(null);
    setSelectedCot(null);
    setBookingDetails({});
  };

  // Function to process direct JSON data for booking creation
  const processDirectBookingData = async (bookingData) => {
    try {
      console.log('📝 Processing direct booking data:', bookingData);

      // Find student by student_id
      const student = students.find(s =>
        (s.id == bookingData.student_id) ||
        (s.student_id == bookingData.student_id) ||
        (s._id == bookingData.student_id)
      );

      if (!student) {
        console.error('❌ Student not found with ID:', bookingData.student_id);
        return { success: false, message: 'Student not found' };
      }

      // Use the provided booking_id or generate a new one if not provided
      const bookingId = bookingData.booking_id || `BOOK_${Date.now()}_${Math.floor(Math.random() * 1000)}`;

      // Find room and cot
      let targetRoom = null;
      let targetCot = null;

      for (const room of rooms) {
        const cots = room?.cots || [];
        const matchingCot = cots.find(c =>
          (c.id == bookingData.cot_id) ||
          (c.cot_id == bookingData.cot_id) ||
          (c._id == bookingData.cot_id)
        );

        if (matchingCot) {
          targetRoom = room;
          targetCot = matchingCot;
          break;
        }
      }

      if (!targetRoom || !targetCot) {
        console.error('❌ Room or cot not found with ID:', bookingData.cot_id);
        return { success: false, message: 'Room or cot not found' };
      }

      // Create booking
      const finalBookingData = {
        booking_id: bookingId, // Use the booking ID
        studentId: student.id || student.student_id || student._id,
        roomId: targetRoom.id || targetRoom.room_id || targetRoom._id,
        cotId: targetCot.id || targetCot.cot_id || targetCot._id,
        cotNumber: targetCot.number || targetCot.cot_number,
        checkInDate: bookingData.check_in_date,
        checkOutDate: bookingData.check_out_date,
        emergencyContactName: bookingData.emergency_contact_name,
        emergencyContactMobile: bookingData.emergency_contact_mobile,
        academicYear: bookingData.academic_year,
        totalAmount: targetRoom.pricePerYear || targetRoom.price_per_year || 0,
        status: 'Pending Check-in',
        paymentStatus: bookingData.payment_amount >= (targetRoom.pricePerYear || targetRoom.price_per_year || 0) ?
          'Fully Paid' : 'Advance Paid',
        amountPaid: bookingData.payment_amount,
        balance: (targetRoom.pricePerYear || targetRoom.price_per_year || 0) - bookingData.payment_amount,
        notes: bookingData.notes
      };

      let result;

      // Try to create the booking directly with the API first
      try {
        console.log('📝 Sending booking data to API:', finalBookingData);

        // Send the booking to the backend
        const response = await fetch(`${API_URL}/admin/bookings`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`
          },
          body: JSON.stringify(finalBookingData)
        });

        if (!response.ok) {
          throw new Error(`Failed to create booking via API: ${response.statusText}`);
        }

        const apiResult = await response.json();
        console.log('✅ Created booking via API:', apiResult);
        result = apiResult;

      } catch (apiError) {
        console.warn('⚠️ API direct booking failed, falling back to local handling:', apiError);
        // Fallback to the local addBooking function
        result = await addBooking(finalBookingData);
      }

      // Add payment record
      await addPayment({
        bookingId: result?.id || result?.booking_id || bookingId,
        studentId: finalBookingData.studentId,
        amount: bookingData.payment_amount,
        type: bookingData.payment_type,
        method: bookingData.payment_method,
        status: 'Successful',
        date: new Date().toISOString()
      });

      console.log('✅ Direct booking created successfully');
      return { success: true, booking: result };
    } catch (error) {
      console.error('❌ Failed to create direct booking:', error);
      return { success: false, message: error.message };
    }
  }; const wizardSteps = [
    { name: 'Select Student', icon: User },
    { name: 'Select Room', icon: Bed },
    { name: 'Booking Details', icon: ListChecks },
    { name: 'Payment', icon: CreditCard },
  ];

  const renderWizard = () => {
    return (
      <Card>
        <div className="mb-8">
          <h2 className="text-xl font-bold text-center mb-2">Create New Booking</h2>
          <div className="flex justify-center items-center">
            {wizardSteps.map((s, index) => (
              <React.Fragment key={s.name}>
                <div className="flex flex-col items-center">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 ${index + 1 <= step ? 'bg-primary-purple text-white shadow-soft-ui' : 'bg-slate-200 text-text-medium'}`}>
                    <s.icon className="w-6 h-6" />
                  </div>
                  <p className={`mt-2 text-xs font-semibold ${index + 1 <= step ? 'text-primary-purple' : 'text-text-medium'}`}>{s.name}</p>
                </div>
                {index < wizardSteps.length - 1 && <div className={`flex-auto border-t-2 transition-all duration-300 mx-4 ${index + 1 < step ? 'border-primary-purple' : 'border-slate-200'}`}></div>}
              </React.Fragment>
            ))}
          </div>
        </div>

        {step === 1 && <SelectStudentStep onSelect={handleSelectStudent} />}
        {step === 2 && <SelectRoomStep student={selectedStudent} onSelect={handleSelectRoomAndCot} onBack={() => setStep(1)} />}
        {step === 3 && <BookingDetailsStep student={selectedStudent} room={selectedRoom} cot={selectedCot} onSubmit={handleBookingDetailsSubmit} onBack={() => setStep(2)} />}
        {step === 4 && <PaymentStep room={selectedRoom} student={selectedStudent} bookingId={temporaryBookingId} onSubmit={handleCreateBooking} onBack={() => setStep(3)} />}
      </Card>
    );
  };

  // Function to demonstrate direct booking with the provided JSON data
  const handleDirectJsonBooking = async () => {
    // Generate a booking ID
    const generatedBookingId = `BOOK_${Date.now()}_${Math.floor(Math.random() * 1000)}`;

    // Create the booking data with the generated ID
    const bookingData = {
      booking_id: generatedBookingId,  // Add the booking ID directly
      student_id: 1,
      cot_id: "your_available_cot_id_from_the_database", // Replace with an actual cot ID if needed
      academic_year: "2025-2026",
      check_in_date: "2025-09-01",
      check_out_date: "2026-06-01",
      emergency_contact_name: "Ramesh Kumar (Guardian)",
      emergency_contact_mobile: "9876543210",
      payment_amount: 5000.00,
      payment_method: "Cash",
      payment_type: "Advance",
      notes: "Booking created by admin in person."
    };

    console.log('🆔 Generated booking ID:', generatedBookingId);
    console.log('📝 Initiating booking with data:', bookingData);

    const result = await processDirectBookingData(bookingData);

    if (result.success) {
      showSuccess('Booking created successfully!');
      // Refresh bookings list
      fetchBookings?.();
    } else {
      // Using console.error as fallback if showError is not available
      const showErrorFn = useToast?.()?.showError || console.error;
      showErrorFn(`Failed to create booking: ${result.message}`);
    }
  };

  return (
    <div className="space-y-6">
      {step === 0 ? (
        <>
          <Card>
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold text-text-dark">Booking List</h2>
              <div className="flex gap-2">
               
                <Button onClick={startBooking} leftIcon={<PlusCircle className="w-4 h-4" />}>
                  Create Booking
                </Button>
              </div>
            </div>
          </Card>
          <Card>
            <Table headers={['Booking Ref', 'Student', 'Room/Cot', 'Check-in', 'Check-out', 'Status']}>
              {bookings.map(booking => {
                const room = getRoomInfo(booking.roomId);
                return (
                  <TableRow key={booking.id}>
                    <TableCell className="font-mono text-xs">{booking.booking_id}</TableCell>
                    <TableCell>{getStudentName(booking.studentId)}</TableCell>
                    <TableCell>{room ? `${room.room_number} / ${booking.cot_number}` : 'N/A'}</TableCell>
                    <TableCell>{new Date(booking.check_in_date).toLocaleDateString()}</TableCell>
                    <TableCell>{new Date(booking.check_out_date).toLocaleDateString()}</TableCell>
                    <TableCell><StatusTag status={booking.status} /></TableCell>

                  </TableRow>
                );
              })}
            </Table>
          </Card>
        </>
      ) : renderWizard()}
    </div>
  );
};


// Wizard Steps Components (defined within the same file for simplicity)

const SelectStudentStep = ({ onSelect }) => {
  const { students, fetchStudents } = useAppContext();
  const [searchTerm, setSearchTerm] = useState('');

  // Use useEffect to log student data for debugging
  React.useEffect(() => {
    console.log('🔍 SelectStudentStep - Student data:', {
      studentsArray: students,
      isArray: Array.isArray(students),
      length: students?.length,
      firstStudent: students?.[0]
    });

    if (!students || students.length === 0) {
      console.log('🔍 No students found, triggering fetch...');
      fetchStudents?.().catch(error => console.error('Failed to fetch students:', error));
    }
  }, [students, fetchStudents]);

  // Handle different property names that might come from the API
  const getStudentName = (student) => {
    return student?.full_name || student?.name || student?.fullName || 'Unknown';
  };

  const getRegistrationNumber = (student) => {
    return student?.Registration_number || student?.registration_number || student?.registrationNumber || 'N/A';
  };

  const getBranch = (student) => {
    return student?.Branch || student?.branch || 'N/A';
  };

  const getYear = (student) => {
    return student?.Year || student?.year || 'N/A';
  };

  const getStudentId = (student) => {
    return student?.id || student?.student_id || student?._id;
  };

  // More defensive filtering logic
  const filteredStudents = useMemo(() => {
    console.log('🔎 Filtering students with search term:', searchTerm);

    if (!students || !Array.isArray(students)) {
      console.log('❌ Students data is not an array');
      return [];
    }

    if (searchTerm.length < 2) {
      const limited = students.slice(0, 5);
      console.log(`🔍 Showing first ${limited.length} students`);
      return limited;
    }

    const filtered = students.filter(s => {
      if (!s) return false;

      const name = getStudentName(s).toLowerCase();
      const regNum = getRegistrationNumber(s).toLowerCase();
      const searchLower = searchTerm.toLowerCase();

      return name.includes(searchLower) || regNum.includes(searchLower);
    });

    console.log(`🔍 Found ${filtered.length} students matching "${searchTerm}"`);
    return filtered;
  }, [students, searchTerm]);

  return <div>
    <h3 className="font-bold text-lg mb-4 text-center">Step 1: Select Student</h3>
    <Input placeholder="Search by name or registration no... (min 2 chars)" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
    <p className="text-xs text-text-medium mt-1 mb-4">Showing {filteredStudents.length} students</p>

    {students && students.length > 0 ? (
      <div className="max-h-96 overflow-y-auto">
        <Table headers={['Name', 'Registration No', 'Branch', 'Year', 'Action']}>
          {filteredStudents.map(s => (
            <TableRow key={getStudentId(s) || Math.random().toString()}>
              <TableCell>{getStudentName(s)}</TableCell>
              <TableCell>{getRegistrationNumber(s)}</TableCell>
              <TableCell>{getBranch(s)}</TableCell>
              <TableCell>{getYear(s)}</TableCell>
              <TableCell><Button variant="primary" onClick={() => onSelect(s)}>Select</Button></TableCell>
            </TableRow>
          ))}
        </Table>
      </div>
    ) : (
      <div className="text-center p-8 bg-slate-100 rounded-lg">
        <p className="text-text-medium mb-4">No students found or still loading...</p>
        <Button onClick={() => fetchStudents?.().catch(error => console.error('Failed to fetch students:', error))}>
          Refresh Student List
        </Button>
      </div>
    )}
  </div>;
};

const SelectRoomStep = ({ student, onSelect, onBack }) => {
  const { rooms } = useAppContext();
  const [isLoading, setIsLoading] = useState(false);

  // Handle different property names that might come from the API
  const getStudentName = (student) => {
    return student?.full_name || student?.name || student?.fullName || 'Unknown';
  };

  const getRegistrationNumber = (student) => {
    return student?.Registration_number || student?.registration_number || student?.registrationNumber || 'N/A';
  };

  const getGender = (student) => {
    return student?.gender || 'Any';
  };

  // Filter rooms based on student gender or show all if no student selected
  const availableRooms = useMemo(() => {
    if (!rooms || !Array.isArray(rooms)) {
      console.log('❌ No rooms data available');
      return [];
    }

    // Default to showing all rooms that aren't full
    let filtered = rooms.filter(r => r.status !== 'Full');

    // If we have a student with gender, filter by gender preference
    if (student) {
      const gender = getGender(student);
      console.log('🔍 Filtering rooms for gender:', gender);

      if (gender === 'male' || gender === 'Male') {
        filtered = filtered.filter(r =>
          r.genderPreference === 'Mixed' ||
          r.genderPreference === 'Male' ||
          r.gender_preference === 'Mixed' ||
          r.gender_preference === 'Male'
        );
      } else if (gender === 'female' || gender === 'Female') {
        filtered = filtered.filter(r =>
          r.genderPreference === 'Mixed' ||
          r.genderPreference === 'Female' ||
          r.gender_preference === 'Mixed' ||
          r.gender_preference === 'Female'
        );
      }
    }

    console.log(`🏠 Found ${filtered.length} available rooms`);
    return filtered;
  }, [rooms, student]);

  // Room helper functions
  const getRoomNumber = (room) => {
    return room?.roomNumber || room?.room_number || 'Unknown';
  };

  const getRoomType = (room) => {
    return room?.type || room?.room_type || 'Standard';
  };

  const getFloor = (room) => {
    return room?.floor || '1st Floor';
  };

  const getPrice = (room) => {
    return room?.pricePerYear || room?.price_per_year || 0;
  };

  const getAdvanceAmount = (room) => {
    return room?.advanceAmount || room?.advance_amount || 0;
  };

  const getCots = (room) => {
    return room?.cots || [];
  };

  const getCotNumber = (cot) => {
    return cot?.number || cot?.cot_number || '?';
  };

  const isCotAvailable = (cot) => {
    return cot?.status === 'Available' || cot?.status === 'available';
  };

  return <div>
    <h3 className="font-bold text-lg mb-2 text-center">Step 2: Select Room & Cot</h3>
    {student && (
      <div className="p-4 rounded-xl mb-4 bg-primary-purple/10 text-primary-purple">
        Selected Student: <span className="font-bold">{getStudentName(student)} ({getRegistrationNumber(student)})</span>
      </div>
    )}

    {availableRooms.length > 0 ? (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-[60vh] overflow-y-auto p-1">
        {availableRooms.map((r, index) => (
          <Card key={r.id || r.room_id || r._id || index}>
            <h4 className="font-bold">{getRoomNumber(r)} - {getRoomType(r)}</h4>
            <p className="text-sm text-text-medium">{getFloor(r)}</p>
            <p className="text-sm mt-2">Price: <span className="font-semibold">₹{getPrice(r).toLocaleString()}/year</span></p>
            <div className="mt-4">
              <p className="text-xs font-semibold mb-2">Available Cots:</p>
              <div className="flex gap-2 flex-wrap">
                {getCots(r).map((cot, cotIndex) => {
                  const isAvailable = isCotAvailable(cot);
                  return (
                    <Button
                      key={cot.id || cot.cot_id || cotIndex}
                      onClick={() => onSelect(r, cot)}
                      disabled={!isAvailable}
                      variant="secondary"
                      className={`!px-4 !py-2 ${!isAvailable ? '!bg-slate-300 !text-slate-500 !shadow-none' : ''}`}
                    >
                      Cot {getCotNumber(cot)}
                    </Button>
                  );
                })}
              </div>
            </div>
          </Card>
        ))}
      </div>
    ) : (
      <div className="text-center p-8 bg-slate-100 rounded-lg">
        <p className="text-text-medium mb-4">No available rooms found for this student.</p>
      </div>
    )}

    <div className="mt-8 flex justify-between">
      <Button onClick={onBack} variant="secondary" leftIcon={<ArrowRight className="w-4 h-4" />}>Back</Button>
    </div>
  </div>;
};

const BookingDetailsStep = ({ student, room, cot, onSubmit, onBack }) => {
  const [details, setDetails] = useState({ academicYear: '2024-2025', checkInDate: '', checkOutDate: '', emergencyContactName: '', emergencyContactMobile: '' });
  const handleChange = (e) => setDetails({ ...details, [e.target.name]: e.target.value });

  // Helper functions to handle different property formats
  const getStudentName = (student) => {
    return student?.full_name || student?.name || student?.fullName || 'Unknown';
  };

  const getRoomNumber = (room) => {
    return room?.roomNumber || room?.room_number || 'Unknown';
  };

  const getCotNumber = (cot) => {
    return cot?.number || cot?.cot_number || '?';
  };

  return <div>
    <h3 className="font-bold text-lg mb-2 text-center">Step 3: Booking Details</h3>
    <div className="p-4 rounded-xl mb-4 bg-primary-purple/10 text-primary-purple">
      Booking for <span className="font-bold">{getStudentName(student)}</span> in Room <span className="font-bold">{getRoomNumber(room)} (Cot {getCotNumber(cot)})</span>
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <Select label="Academic Year*" name="academicYear" value={details.academicYear} onChange={handleChange}>
        <option>2024-2025</option>
        <option>2025-2026</option>
      </Select>
      <Input label="Check-in Date*" name="checkInDate" type="date" value={details.checkInDate} onChange={handleChange} />
      <Input label="Check-out Date*" name="checkOutDate" type="date" value={details.checkOutDate} onChange={handleChange} />
      <div className="md:col-span-2" />
      <Input label="Emergency Contact Name*" name="emergencyContactName" value={details.emergencyContactName} onChange={handleChange} />
      <Input label="Emergency Contact Mobile*" name="emergencyContactMobile" type="tel" value={details.emergencyContactMobile} onChange={handleChange} />
    </div>
    <div className="mt-8 flex justify-between">
      <Button onClick={onBack} variant="secondary" leftIcon={<ArrowRight className="w-4 h-4" />}>Back</Button>
      <Button
        onClick={() => onSubmit(details)}
        rightIcon={<ArrowRight className="w-4 h-4" />}
        disabled={!details.checkInDate || !details.checkOutDate || !details.emergencyContactName || !details.emergencyContactMobile}
      >
        Continue
      </Button>
    </div>
  </div>
}

const PaymentStep = ({ room, onSubmit, onBack, student, bookingId }) => {
  // Helper functions to handle different property formats
  const getPrice = (room) => {
    return room?.pricePerYear || room?.price_per_year || 0;
  };

  const getAdvanceAmount = (room) => {
    return room?.advanceAmount || room?.advance_amount || 0;
  };

  const { authToken, addPayment } = useAppContext();
  const { showSuccess, showError } = useToast ? useToast() : { showSuccess: console.log, showError: console.error };
  const [showPayUModal, setShowPayUModal] = useState(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [details, setDetails] = useState({
    amount: getAdvanceAmount(room),
    paymentMethod: 'Online Payment',
    paymentType: 'Advance'
  });

  const handleChange = (e) => setDetails({ ...details, [e.target.name]: e.target.value });

  // Function to handle local payment submission (cash, transfer, etc.)
  const handleLocalPaymentSubmit = () => {
    onSubmit(details);
  };

  // Function to handle PayU payment initiation
  const handlePayUInitiation = async () => {
    try {
      setIsProcessingPayment(true);
      showSuccess('Preparing payment gateway...');

      // Use the booking ID that was created when selecting the cot
      console.log('📝 Using existing booking ID for payment:', bookingId);

      // Create booking data object
      const bookingData = {
        studentId: student?.id || student?.student_id || student?._id,
        roomId: room?.id || room?.room_id || room?._id,
        cotId: room?.cot?.id || room?.cot_id,
        cotNumber: room?.cot?.number || room?.cot_number,
        status: 'Payment Pending',
        checkInDate: new Date().toISOString(),
        checkOutDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString(),
        totalAmount: getPrice(room),
        amountPaid: 0,
        balance: getPrice(room),
        paymentStatus: 'Pending'
      };

      console.log('� Creating booking record for payment:', bookingData);

      console.log('✅ Using booking ID:', bookingId);

      // Create a booking object to be used by PayU
      const payuBooking = {
        booking_id: bookingId,
        student_id: student?.id || student?.student_id || student?._id,
        room_id: room?.id || room?.room_id || room?._id,
        amount: details.amount,
        pending_balance: details.amount,
        total_amount: getPrice(room)
      };      // Initiate PayU payment using the admin booking endpoint
      const paymentData = {
        booking_id: payuBooking.booking_id,
        amount: details.amount,
        paymentType: details.paymentType
      };

      console.log('💰 Initiating admin payment for booking:', paymentData);

      // Try using the admin-specific payment endpoint first
      let response;
      try {
        const adminPaymentResponse = await fetch(`${API_URL}/admin/bookings/${payuBooking.booking_id}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`
          }
        });

        if (!adminPaymentResponse.ok) {
          throw new Error('Admin payment endpoint failed');
        }

        response = await adminPaymentResponse.json();
        console.log('✅ Admin payment initiated:', response);
      } catch (adminError) {
        // Fallback to the regular payment endpoint
        console.warn('⚠️ Admin payment endpoint failed, falling back to regular payment:', adminError);
        response = await initiatePayUPayment(
          payuBooking.booking_id,
          details.amount,
          authToken
        );  

        response = await adminPaymentResponse.json();
        console.log('✅ Admin payment initiated:', response);
      } 

      if (response.success && response.payment_data) {
        showSuccess('Redirecting to payment gateway...');

        // Ensure URLs include transaction ID
        if (response.payment_data.txnid) {
          const txnid = response.payment_data.txnid;
          // Ensure URLs have the txnid parameter
          if (response.payment_data.surl && !response.payment_data.surl.includes('txnid=')) {
            response.payment_data.surl += (response.payment_data.surl.includes('?') ? '&' : '?') + `txnid=${txnid}`;
          }
          if (response.payment_data.furl && !response.payment_data.furl.includes('txnid=')) {
            response.payment_data.furl += (response.payment_data.furl.includes('?') ? '&' : '?') + `txnid=${txnid}`;
          }
        }

        // Set a flag in localStorage/sessionStorage to identify the booking being created
        sessionStorage.setItem('admin_creating_booking', 'true');
        sessionStorage.setItem('admin_booking_details', JSON.stringify({
          bookingId: payuBooking.booking_id,
          studentId: student?.id || student?.student_id || student?._id,
          roomId: room?.id || room?.room_id || room?._id,
          amount: details.amount,
          paymentType: details.paymentType
        }));

        // Small delay to show success message
        setTimeout(() => {
          // Redirect to PayU gateway
          redirectToPayU(response.payment_data);
        }, 1500);
      } else {
        throw new Error(response.message || 'Failed to initiate payment');
      }
    } catch (error) {
      console.error('Payment initiation failed:', error);
      showError(error.message || 'Failed to initiate payment. Please try again.');

      // Special error handling for common issues
      if (error.message && error.message.includes('Network Error')) {
        showError('Network connection issue. Please check your internet connection and try again.');
      } else if (error.message && error.message.includes('500')) {
        showError('The payment server is currently experiencing issues. Please try again later or use a different payment method.');
      }
    } finally {
      setIsProcessingPayment(false);
    }
  };

  // Function to handle payment submission based on method
  const handlePaymentSubmit = () => {
    if (details.paymentMethod === 'Online Payment') {
      handlePayUInitiation();
    } else {
      handleLocalPaymentSubmit();
    }
  };

  return <div>
    <h3 className="font-bold text-lg mb-2 text-center">Step 4: Payment Details</h3>
    <div className="p-4 rounded-xl mb-4 bg-primary-purple/10 text-primary-purple">
      <h4 className="font-bold mb-2">Payment Summary</h4>
      <div className="flex justify-between text-sm"><span>Total Amount:</span> <span>₹{getPrice(room).toLocaleString()}</span></div>
      <div className="flex justify-between text-sm"><span>Advance Amount:</span> <span className="font-bold">₹{getAdvanceAmount(room).toLocaleString()}</span></div>
    </div>
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <Input label="Payment Amount*" name="amount" type="number" value={details.amount} onChange={handleChange} />
      <Select label="Payment Method*" name="paymentMethod" value={details.paymentMethod} onChange={handleChange}>
        <option>Online Payment</option>
        <option>Cash</option>
        <option>Bank Transfer</option>
        <option>Cheque</option>
      </Select>
      <Select label="Payment Type*" name="paymentType" value={details.paymentType} onChange={handleChange}>
        <option>Advance</option>
        <option>Full Payment</option>
      </Select>
    </div>

    {details.paymentMethod === 'Online Payment' && (
      <div className="mt-4 p-4 bg-blue-50 rounded-lg">
        <div className="flex items-start">
          <div className="mr-3 text-blue-500">
            <CreditCard className="h-5 w-5" />
          </div>
          <div>
            <p className="font-medium text-blue-700">Online Payment via PayU</p>
            <p className="text-sm text-blue-600 mt-1">
              The student will be redirected to the PayU payment gateway to complete the payment securely.
              You will receive a notification once the payment is completed.
            </p>
            <p className="text-xs text-gray-500 mt-2">
              If you encounter any payment gateway issues, you can switch to Cash or Bank Transfer payment method.
            </p>
          </div>
        </div>
      </div>
    )}

    <div className="mt-8 flex justify-between">
      <Button onClick={onBack} variant="secondary" leftIcon={<ArrowRight className="w-4 h-4" />}>Back</Button>
      <Button
        onClick={handlePaymentSubmit}
        disabled={!details.amount || details.amount <= 0 || isProcessingPayment}
        leftIcon={isProcessingPayment ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
      >
        {isProcessingPayment ? 'Processing...' : details.paymentMethod === 'Online Payment' ? 'Proceed to Payment' : 'Create Booking'}
      </Button>
    </div>
  </div>
}

export default BookingManagement;