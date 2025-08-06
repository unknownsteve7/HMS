import React from 'react';

const StatCard = ({ label, value, icon, color = 'text-primary-purple' }) => {
  return (
    <div className="bg-white p-6 rounded-3xl shadow-soft-ui transition-shadow hover:shadow-lg">
      <div className="flex justify-between items-start">
        <div className="flex flex-col">
          <p className="text-text-medium font-semibold">{label}</p>
          <p className="text-3xl font-bold text-text-dark mt-1">{value}</p>
        </div>
        <div className={`p-3 rounded-full bg-slate-100 shadow-soft-ui-sm-inset ${color}`}>
          {icon}
        </div>
      </div>
    </div>
  );
};

export default StatCard;