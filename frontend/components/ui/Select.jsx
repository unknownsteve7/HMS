import React from 'react';

const Select = ({ label, id, children, ...props }) => {
  return (
    <div className="w-full">
      {label && <label htmlFor={id} className="block text-sm font-medium text-text-medium mb-1.5">{label}</label>}
      <select
        id={id}
        className="w-full px-4 py-3 bg-slate-100 rounded-xl shadow-soft-ui-inset appearance-none focus:outline-none focus:ring-2 focus:ring-primary-purple transition-all"
        {...props}
      >
        {children}
      </select>
    </div>
  );
};

export default Select;