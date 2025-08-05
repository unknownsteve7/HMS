import React, { useState, useMemo, useEffect } from 'react';
import { useAppContext } from '../../context/AppContext';
import Card from '../../components/ui/Card';
import StatCard from '../../components/ui/StatCard';
import { Table, TableRow, TableCell } from '../../components/ui/Table';
import StatusTag from '../../components/ui/StatusTag';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import { IndianRupee, Landmark, Receipt } from 'lucide-react';

// Helper function to safely format a date string
const safeDateFormatter = (dateString) => {
  if (!dateString) {
    return 'N/A';
  }
  const date = new Date(dateString);
  // Check if the date is valid before formatting
  if (isNaN(date.getTime())) {
    console.error('Invalid date received:', dateString);
    return 'Invalid Date';
  }
  return date.toLocaleString();
};


const PaymentHistory = () => {
  const { payments, fetchPayments, loading } = useAppContext();
  const [filters, setFilters] = useState({
    type: 'All Types',
    startDate: '',
    endDate: '',
  });

  const filteredPayments = useMemo(() => {
    return (payments || []).filter(p => {
      const typeMatch = filters.type === 'All Types' || (p.payment_type || p.type) === filters.type;
      
      const dateString = p.received_date || p.date;
      if (!dateString) return false; // Exclude payments with no date
      const date = new Date(dateString);

      const startDateMatch = !filters.startDate || date >= new Date(filters.startDate);
      const endDateMatch = !filters.endDate || date <= new Date(filters.endDate);
      
      return typeMatch && startDateMatch && endDateMatch;
    });
  }, [payments, filters]);

  const summary = useMemo(() => {
    return (payments || []).reduce((acc, p) => {
      const amount = p.amount || 0;
      const type = p.payment_type || p.type;

      if (type === 'Refund') {
        acc.refunds += amount;
      } else {
        acc.totalPaid += amount;
        if (type === 'Advance') {
          acc.advance += amount;
        } else {
          acc.balance += amount;
        }
      }
      return acc;
    }, { totalPaid: 0, advance: 0, balance: 0, refunds: 0 });
  }, [payments]);

  useEffect(() => {
    fetchPayments();
  }, []);

  const handleFilterChange = (e) => {
    setFilters(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const paymentTypes = ['All Types', 'Advance', 'Full Payment', 'Partial Payment', 'Refund'];

  if (loading && loading.payments) {
    return (
      <div className="flex justify-center items-center h-64">
        <p className="text-text-medium">Loading payment history...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <Card>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
          <Select label="Payment Type" name="type" value={filters.type} onChange={handleFilterChange}>
            {paymentTypes.map(pt => <option key={pt} value={pt}>{pt}</option>)}
          </Select>
          <Input label="Start Date" name="startDate" type="date" value={filters.startDate} onChange={handleFilterChange} />
          <Input label="End Date" name="endDate" type="date" value={filters.endDate} onChange={handleFilterChange} />
        </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard label="Total Paid" value={`₹${summary.totalPaid.toLocaleString()}`} icon={<IndianRupee />} color="text-primary-purple" />
        <StatCard label="Advance Payments" value={`₹${summary.advance.toLocaleString()}`} icon={<Landmark />} color="text-accent-orange" />
        <StatCard label="Balance Payments" value={`₹${summary.balance.toLocaleString()}`} icon={<Receipt />} color="text-accent-cyan" />
        <StatCard label="Total Refunds" value={`₹${summary.refunds.toLocaleString()}`} icon={<IndianRupee />} color="text-red-500" />
      </div>

      <Card>
        <h2 className="text-xl font-bold text-text-dark mb-4">Payment Records ({filteredPayments.length})</h2>
        <Table headers={['Receipt No.', 'Room', 'Amount', 'Type', 'Method', 'Status', 'Date', 'Booking Ref']}>
          {filteredPayments.map(p => (
            <TableRow key={p.payment_id || p.id}>
              <TableCell className="font-mono text-xs">{p.receipt_number || p.payment_id}</TableCell>
              <TableCell>{p.room_number || 'N/A'}</TableCell>
              <TableCell className="font-semibold text-text-dark">₹{(p.amount || 0).toLocaleString()}</TableCell>
              <TableCell><StatusTag status={p.payment_type || p.type} /></TableCell>
              <TableCell>{p.payment_method || p.method}</TableCell>
              <TableCell><StatusTag status={p.status || 'Paid'} /></TableCell>
              <TableCell>{safeDateFormatter(p.received_date || p.date)}</TableCell>
              <TableCell className="font-mono text-xs">{p.booking_id || p.bookingId}</TableCell>
            </TableRow>
          ))}
        </Table>
        {filteredPayments.length === 0 && <p className="text-center p-8 text-text-medium">No payments match your filters.</p>}
      </Card>
    </div>
  );
};

export default PaymentHistory;
