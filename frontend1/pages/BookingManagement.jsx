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
  Eye, Edit, Ban, PlusCircle, ArrowRight, User, Bed, ListChecks, CreditCard, Loader2,
  ArrowLeft
} from 'lucide-react';

const BookingManagement = () => {
  const {
    bookings,
    students,
    rooms,
    fetchBookings,
    fetchStudents,
    fetchRooms,
    authToken,
  } = useAppContext();

  const { showSuccess, showError } = useToast ? useToast() : { showSuccess: () => { }, showError: () => { } };
  const [step, setStep] = useState(0); // 0 for list, 1-4 for wizard
  const [isDataLoading, setIsDataLoading] = useState(true);

  // Helper function to format dates from YYYY-MM-DD format
  const formatDate = (dateString) => {
    if (!dateString) return 'No Date';
    try {
      const dateStr = String(dateString).trim();

      if (dateStr.includes('-') && dateStr.length >= 8) {
        const parts = dateStr.split('-');
        if (parts.length >= 3) {
          const year = parseInt(parts[0]);
          const month = parseInt(parts[1]);
          const day = parseInt(parts[2]);
          if (year > 1900 && year < 2100 && month >= 1 && month <= 12 && day >= 1 && day <= 31) {
            const date = new Date(year, month - 1, day);
            if (!isNaN(date.getTime())) {
              return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
            }
          }
        }
      }

      const fallbackDate = new Date(dateStr);
      if (!isNaN(fallbackDate.getTime())) {
        return fallbackDate.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
      }

      if (dateStr.includes('-') || dateStr.includes('/')) return dateStr;
      return 'Invalid Date';
    } catch {
      return 'Error';
    }
  };

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

  useEffect(() => {
  }, [bookings, students, rooms]);

  // Always fetch the latest data when component mounts
  useEffect(() => {
    setIsDataLoading(true);
    const fetchAllData = async () => {
      try {
        const promises = [];
        if (fetchBookings) promises.push(fetchBookings());
        if (fetchStudents) promises.push(fetchStudents());
        if (fetchRooms) promises.push(fetchRooms());
        await Promise.all(promises);
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

  const getStudentNameById = (studentId) => {
    if (!Array.isArray(students)) return 'N/A';
    const s = students.find(x => (x.id === studentId) || (x.student_id === studentId) || (x._id === studentId));
    return s?.full_name || s?.name || s?.fullName || 'N/A';
  };

  const getRoomById = (roomId) => {
    if (!Array.isArray(rooms)) return null;
    return rooms.find(r => (r.id === roomId) || (r.room_id === roomId) || (r._id === roomId)) || null;
  };

  const startBooking = () => setStep(1);

  const handleSelectStudent = (student) => {
    setSelectedStudent(student);
    setStep(2);
  };

  /**
   * IMPORTANT: We DO NOT POST anything here.
   * We just save selection and proceed.
   */
  const handleSelectRoomAndCot = async (room, cot) => {
    setSelectedRoom(room);
    setSelectedCot(cot);
    const bookingId = `BOOK_${Date.now()}_${Math.floor(Math.random() * 1000)}`; // purely local temp id for UI
    setTemporaryBookingId(bookingId);
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
      notes: details.notes,
    });
    setStep(4);
  };

  /**
   * Admin helper to post a booking with "offline" payment (Cash/Bank/…).
   * Backend will store booking + payment in one call.
   */
  const createOfflineBooking = async ({ amount, paymentType, paymentMethod }) => {
    const payload = {
      student_id: bookingDetails.studentId,
      cot_id: bookingDetails.cotId,
      academic_year: bookingDetails.academicYear,
      check_in_date: bookingDetails.checkInDate,
      emergency_contact_name: bookingDetails.emergencyContactName,
      emergency_contact_mobile: bookingDetails.emergencyContactMobile,
      payment_amount: Number(amount),
      payment_method: paymentMethod,          // 'Cash' | 'Bank Transfer' | 'Cheque'
      payment_type: paymentType,              // 'Advance' | 'Full Payment'
      notes: bookingDetails.notes || 'Booking created by admin (offline payment).'
    };

    const res = await fetch(`${API_URL}/admin/bookings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${authToken}` },
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      const errTxt = await res.text();
      throw new Error(`Failed to create booking (offline): ${errTxt}`);
    }
    return res.json();
  };

  /**
   * Admin helper to post a booking (with required fields) and then start PayU.
   * NOTE: exact strings matter ('Online Payment').
   */
  const createBookingThenStartPayU = async ({ amount }) => {
    // 1) Create the booking (no preliminary draft)
    const bookingPayload = {
      student_id: bookingDetails.studentId,
      cot_id: bookingDetails.cotId,
      academic_year: bookingDetails.academicYear,                      // REQUIRED
      check_in_date: bookingDetails.checkInDate,                       // REQUIRED (YYYY-MM-DD)
      emergency_contact_name: bookingDetails.emergencyContactName,     // REQUIRED
      emergency_contact_mobile: bookingDetails.emergencyContactMobile, // REQUIRED
      payment_amount: Number(amount),                                  // REQUIRED
      payment_method: 'Online Payment',                                // REQUIRED exact string per backend
      payment_type: 'Advance',                                         // or pass from UI if needed
      notes: bookingDetails.notes || 'Booking created by admin (online).',
    };

    const bookingRes = await fetch(`${API_URL}/admin/bookings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${authToken}` },
      body: JSON.stringify(bookingPayload)
    });

    if (!bookingRes.ok) {
      const errTxt = await bookingRes.text();
      throw new Error(`Failed to create booking: ${errTxt}`);
    }

    const booking = await bookingRes.json();
    const finalBookingId = booking.booking_id || booking.id;
    if (!finalBookingId) throw new Error('No booking_id returned from server');

    // 2) Initiate PayU
    const payuResp = await initiatePayUPayment(
      { booking_id: finalBookingId, amount: Number(amount) }, // correct signature
      authToken,
      showToast // Pass the showToast function to show the redirect message
    );

    if (payuResp?.payment_data) {
      // persist context for after-return
      sessionStorage.setItem('admin_creating_booking', 'true');
      sessionStorage.setItem('admin_booking_details', JSON.stringify({
        bookingId: finalBookingId,
        studentId: bookingDetails.studentId,
        roomId: bookingDetails.roomId,
        amount: Number(amount),
        paymentType: 'Advance',
      }));
      redirectToPayU(payuResp.payment_data);
      return;
    }

  };

  /**
   * Old debug helper fixed to map fields to backend shape
   */
  const processDirectBookingData = async (bookingData) => {
    try {
      // student exists?
      const student = (students || []).find(s =>
        (s.id == bookingData.student_id) || (s.student_id == bookingData.student_id) || (s._id == bookingData.student_id)
      );
      if (!student) return { success: false, message: 'Student not found' };

      // cot exists?
      let targetRoom = null, targetCot = null;
      for (const r of rooms || []) {
        const m = (r.cots || []).find(c => (c.id == bookingData.cot_id) || (c.cot_id == bookingData.cot_id) || (c._id == bookingData.cot_id));
        if (m) { targetRoom = r; targetCot = m; break; }
      }
      if (!targetRoom || !targetCot) return { success: false, message: 'Room or cot not found' };

      // Build exact payload for /admin/bookings
      const payload = {
        student_id: bookingData.student_id,
        cot_id: bookingData.cot_id,
        academic_year: bookingData.academic_year,
        check_in_date: bookingData.check_in_date,
        emergency_contact_name: bookingData.emergency_contact_name,
        emergency_contact_mobile: bookingData.emergency_contact_mobile,
        payment_amount: Number(bookingData.payment_amount),
        payment_method: bookingData.payment_method,   // 'Cash' | 'Online Payment' | ...
        payment_type: bookingData.payment_type,       // 'Advance' | 'Full Payment'
        notes: bookingData.notes || 'Direct admin booking',
      };

      const res = await fetch(`${API_URL}/admin/bookings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${authToken}` },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const errTxt = await res.text();
        throw new Error(`Failed to create booking: ${errTxt}`);
      }

      const created = await res.json();
      // optional: add a payment UI toast
      showSuccess('Booking created successfully!');
      await fetchBookings?.();

      return { success: true, booking: created };
    } catch (error) {
      console.error('❌ Failed to create direct booking:', error);
      return { success: false, message: error.message };
    }
  };

  const wizardSteps = [
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
        {step === 4 && (
          <PaymentStep
            room={selectedRoom}
            student={selectedStudent}
            cot={selectedCot}
            bookingDetails={bookingDetails}
            bookingId={temporaryBookingId}
            onBack={() => setStep(3)}
            onDone={async () => {
              // after any successful path, reset + refresh
              setStep(0);
              setSelectedStudent(null);
              setSelectedRoom(null);
              setSelectedCot(null);
              setBookingDetails({});
              await fetchBookings?.();
            }}
            createOfflineBooking={createOfflineBooking}
            createBookingThenStartPayU={createBookingThenStartPayU}
          />
        )}
      </Card>
    );
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
            <Table headers={['Booking Ref', 'Student', 'Room/Cot', 'Check-in', 'Status']}>
              {(bookings || []).map((booking) => {
                const room = getRoomById(booking.roomId);
                return (
                  <TableRow key={booking.id || booking.booking_id}>
                    <TableCell className="font-mono text-xs">{booking.booking_id || booking.id}</TableCell>
                    <TableCell>{getStudentNameById(booking.studentId)}</TableCell>
                    <TableCell>{room ? `${room.room_number || room.roomNumber} / ${booking.cot_number || booking.cotNumber}` : 'N/A'}</TableCell>
                    <TableCell>{formatDate(booking.check_in_date || booking.checkInDate)}</TableCell>
                    <TableCell><StatusTag status={booking.status || 'Pending'} /></TableCell>
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

/* ------------------------- Wizard Step Components ------------------------- */

const SelectStudentStep = ({ onSelect }) => {
  const { students, fetchStudents } = useAppContext();
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (!students || students.length === 0) {
      fetchStudents?.().catch(error => console.error('Failed to fetch students:', error));
    }
  }, [students, fetchStudents]);

  const getStudentName = (student) => student?.full_name || student?.name || student?.fullName || 'Unknown';
  const getRegistrationNumber = (student) => student?.Registration_number || student?.registration_number || student?.registrationNumber || 'N/A';
  const getBranch = (student) => student?.Branch || student?.branch || 'N/A';
  const getYear = (student) => student?.Year || student?.year || 'N/A';
  const getStudentId = (student) => student?.id || student?.student_id || student?._id;

  const filteredStudents = useMemo(() => {
    if (!Array.isArray(students)) return [];
    if (searchTerm.length < 2) return students.slice(0, 5);
    const searchLower = searchTerm.toLowerCase();
    return students.filter(s => {
      const name = getStudentName(s).toLowerCase();
      const regNum = getRegistrationNumber(s).toLowerCase();
      return name.includes(searchLower) || regNum.includes(searchLower);
    });
  }, [students, searchTerm]);

  return (
    <div>
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
    </div>
  );
};

const SelectRoomStep = ({ student, onSelect, onBack }) => {
  const { rooms } = useAppContext();

  const getStudentName = (s) => s?.full_name || s?.name || s?.fullName || 'Unknown';
  const getRegistrationNumber = (s) => s?.Registration_number || s?.registration_number || s?.registrationNumber || 'N/A';
  const getGender = (s) => s?.gender || 'Any';

  const availableRooms = useMemo(() => {
    if (!Array.isArray(rooms)) return [];
    let filtered = rooms.filter(r => r.status !== 'Full');
    if (student) {
      const gender = getGender(student);
      if (gender?.toLowerCase() === 'male') {
        filtered = filtered.filter(r =>
          r.genderPreference === 'Mixed' || r.genderPreference === 'Male' ||
          r.gender_preference === 'Mixed' || r.gender_preference === 'Male'
        );
      } else if (gender?.toLowerCase() === 'female') {
        filtered = filtered.filter(r =>
          r.genderPreference === 'Mixed' || r.genderPreference === 'Female' ||
          r.gender_preference === 'Mixed' || r.gender_preference === 'Female'
        );
      }
    }
    return filtered;
  }, [rooms, student]);

  const getRoomNumber = (r) => r?.roomNumber || r?.room_number || 'Unknown';
  const getRoomType = (r) => r?.type || r?.room_type || 'Standard';
  const getFloor = (r) => r?.floor || '1st Floor';
  const getPrice = (r) => r?.pricePerYear || r?.price_per_year || 0;
  const getCots = (r) => r?.cots || [];
  const getCotNumber = (c) => c?.number || c?.cot_number || '?';
  const isCotAvailable = (c) => c?.status === 'Available' || c?.status === 'available';

  return (
    <div>
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
    </div>
  );
};

const BookingDetailsStep = ({ student, room, cot, onSubmit, onBack }) => {
  const [details, setDetails] = useState({
    academicYear: '2025-2026',
    checkInDate: '',
    checkOutDate: '',
    emergencyContactName: '',
    emergencyContactMobile: '',
    notes: ''
  });
  const handleChange = (e) => setDetails({ ...details, [e.target.name]: e.target.value });

  const getStudentName = (s) => s?.full_name || s?.name || s?.fullName || 'Unknown';
  const getRoomNumber = (r) => r?.roomNumber || r?.room_number || 'Unknown';
  const getCotNumber = (c) => c?.number || c?.cot_number || '?';

  return (
    <div>
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
        <div className="md:col-span-2" />
        <Input label="Emergency Contact Name*" name="emergencyContactName" value={details.emergencyContactName} onChange={handleChange} />
        <Input label="Emergency Contact Mobile*" name="emergencyContactMobile" type="tel" value={details.emergencyContactMobile} onChange={handleChange} />
        <Input label="Notes (optional)" name="notes" value={details.notes} onChange={handleChange} />
      </div>
      <div className="mt-8 flex justify-between">
        <Button onClick={onBack} variant="secondary" leftIcon={<ArrowLeft className="w-4 h-4" />}>Back</Button>
        <Button
          onClick={() => onSubmit(details)}
          rightIcon={<ArrowRight className="w-4 h-4" />}
          disabled={!details.checkInDate || !details.emergencyContactName || !details.emergencyContactMobile}
        >
          Continue
        </Button>
      </div>
    </div>
  );
};

const PaymentStep = ({
  room,
  onBack,
  student,
  cot,
  bookingDetails,
  bookingId,
  onDone,
  createOfflineBooking,
  createBookingThenStartPayU
}) => {
  const { authToken } = useAppContext();
  const { showSuccess, showError } = useToast ? useToast() : { showSuccess: () => { }, showError: () => { } };

  const getPrice = (r) => r?.pricePerYear || r?.price_per_year || 0;
  const getAdvanceAmount = (r) => r?.advanceAmount || r?.advance_amount || 0;

  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [details, setDetails] = useState({
    amount: getAdvanceAmount(room) || Math.round(getPrice(room) * 0.2),
    paymentMethod: 'Online Payment',
    paymentType: 'Advance'
  });

  const handleChange = (e) => setDetails({ ...details, [e.target.name]: e.target.value });

  const handleLocalPaymentSubmit = async () => {
    try {
      setIsProcessingPayment(true);
      const result = await createOfflineBooking({
        amount: details.amount,
        paymentType: details.paymentType,
        paymentMethod: details.paymentMethod
      });
      showSuccess('Booking created successfully (offline).');
      await onDone?.(result);
    } catch (e) {
      showError(e.message || 'Failed to create booking.');
    } finally {
      setIsProcessingPayment(false);
    }
  };

  const handlePayUInitiation = async () => {
    try {
      setIsProcessingPayment(true);
      showSuccess('Securing your booking...');
      await createBookingThenStartPayU({ amount: details.amount });
      // redirectToPayU is called inside helper; nothing else here
    } catch (e) {
      showError(e.message);
    } finally {
      setIsProcessingPayment(false);
    }
  };

  const handlePaymentSubmit = () => {
    if (details.paymentMethod === 'Online Payment') {
      handlePayUInitiation();
    } else {
      handleLocalPaymentSubmit();
    }
  };

  return (
    <div>
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
                You’ll be redirected to PayU to complete the payment securely.
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="mt-8 flex justify-between">
        <Button onClick={onBack} variant="secondary" leftIcon={<ArrowLeft className="w-4 h-4" />}>Back</Button>
        <Button
          onClick={handlePaymentSubmit}
          disabled={!details.amount || details.amount <= 0 || isProcessingPayment}
          leftIcon={isProcessingPayment ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
        >
          {isProcessingPayment ? 'Processing...' : details.paymentMethod === 'Online Payment' ? 'Proceed to Payment' : 'Create Booking'}
        </Button>
      </div>
    </div>
  );
};

export default BookingManagement;
