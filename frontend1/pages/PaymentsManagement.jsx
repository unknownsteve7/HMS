import React, { useState, useMemo } from 'react';
import Card from '../components/ui/Card';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import { Table, TableRow, TableCell } from '../components/ui/Table';
import StatusTag from '../components/ui/StatusTag';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import { useAppContext } from '../context/AppContext';
import { Edit, Printer, PlusCircle, RotateCcw } from 'lucide-react';
import { getAllPayments } from '../apiService';
const PaymentsManagement = () => {
  const { payments, students, addPayment } = useAppContext();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newPaymentData, setNewPaymentData] = useState({ date: new Date().toISOString().split('T')[0] });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewPaymentData(prev => ({ ...prev, [name]: value }));
  };

  const handleRecordPayment = () => {
    if (newPaymentData.bookingId && newPaymentData.amount && newPaymentData.studentId) {
      addPayment({
        ...newPaymentData,
        status: 'Successful',
        type: newPaymentData.type || 'Partial Payment',
        method: newPaymentData.method || 'Cash'
      });
      setIsModalOpen(false);
      setNewPaymentData({ date: new Date().toISOString().split('T')[0] });
    } else {
      alert('Please fill all required fields');
    }
  };

  const getStudentName = (studentId) => {
    if (!students || !Array.isArray(students)) return 'N/A';
    const student = students.find(s => s.id === studentId || s.student_id === studentId);
    return student?.full_name || student?.name || 'N/A';
  };

  return (
    <div className="space-y-6">
      <Card>
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-bold text-text-dark">Payment History</h2>
          
        </div>
      </Card>

      <Card>
        <Table headers={['Receipt No', 'Student', 'Booking Ref', 'Amount', 'Type', 'Method', 'Status', 'Date']}>
          {(payments || []).map(payment => (
            <TableRow key={payment.payment_id || payment.id}>
              <TableCell className="font-mono text-xs">{payment.receipt_number || payment.payment_id || payment.id || 'N/A'}</TableCell>
              <TableCell>{payment.full_name || getStudentName(payment.student_id || payment.studentId)}</TableCell>
              <TableCell className="font-mono text-xs">{payment.booking_id || payment.bookingId || 'N/A'}</TableCell>
              <TableCell>₹{(payment.amount || 0).toLocaleString()}</TableCell>
              <TableCell>{payment.payment_type || payment.type || 'N/A'}</TableCell>
              <TableCell>{payment.payment_method || payment.method || 'N/A'}</TableCell>
              <TableCell><StatusTag status={payment.status || 'Unknown'} /></TableCell>
              <TableCell>{new Date(payment.received_date || payment.payment_date || payment.date || Date.now()).toLocaleString()}</TableCell>
            </TableRow>
          ))}
        </Table>
      </Card>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Record New Payment"
        footer={
          <>
            <Button variant="secondary" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button variant="primary" onClick={handleRecordPayment}>Record Payment</Button>
          </>
        }>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
          <Select label="Student*" name="studentId" defaultValue="" onChange={handleInputChange}>
            <option value="" disabled>Select student</option>
            {students.map(s => <option key={s.id} value={s.id}>{s.name} - {s.registrationNumber}</option>)}
          </Select>
          <Input label="Booking ID*" name="bookingId" onChange={handleInputChange} />
          <Input label="Amount*" name="amount" type="number" onChange={handleInputChange} />
          <Select label="Payment Type*" name="type" defaultValue="Partial Payment" onChange={handleInputChange}>
            <option>Partial Payment</option>
            <option>Full Payment</option>
            <option>Refund</option>
          </Select>
          <Select label="Payment Method*" name="method" defaultValue="Cash" onChange={handleInputChange}>
            <option>Cash</option>
            <option>Bank Transfer</option>
            <option>Online Payment</option>
            <option>Cheque</option>
          </Select>
          <Input label="Received Date*" name="date" type="date" value={newPaymentData.date?.split('T')[0]} onChange={handleInputChange} />
          <div className="md:col-span-2">
            <label htmlFor="notes" className="block text-sm font-medium text-text-medium mb-1.5">Notes</label>
            <textarea id="notes" name="notes" rows={3} onChange={() => { }} className="w-full px-4 py-3 bg-slate-100 rounded-xl shadow-soft-ui-inset focus:outline-none focus:ring-2 focus:ring-primary-purple transition-all" />
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default PaymentsManagement;