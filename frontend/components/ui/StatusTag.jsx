import React from 'react';

const StatusTag = ({ status }) => {
  const statusStyles = {
    'Active': 'bg-green-100 text-green-800',
    'Pending Check-in': 'bg-blue-100 text-blue-800',
    'Pending': 'bg-orange-100 text-orange-800',
    'Completed': 'bg-slate-200 text-slate-700',
    'Cancelled': 'bg-red-100 text-red-800',
    'Successful': 'bg-green-100 text-green-800',
    'Failed': 'bg-red-100 text-red-800',
    'Reversed': 'bg-yellow-100 text-yellow-800',
    'Full': 'bg-red-100 text-red-800',
    'Partially Occupied': 'bg-orange-100 text-orange-800',
    'Available': 'bg-green-100 text-green-800',
    'Advance Paid': 'bg-blue-100 text-blue-800',
    'Balance Due': 'bg-orange-100 text-orange-800',
    'Fully Paid': 'bg-green-100 text-green-800',
    'Under Maintenance': 'bg-purple-100 text-purple-800',
    // Room types
    'Normal': 'bg-blue-100 text-blue-800',
    'Deluxe': 'bg-purple-100 text-purple-800',
    'Super Deluxe': 'bg-indigo-100 text-indigo-800',
    'default': 'bg-slate-200 text-slate-700'
  };

  const style = statusStyles[status] || statusStyles['default'];

  return (
    <span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${style}`}>
      {status}
    </span>
  );
};

export default StatusTag;