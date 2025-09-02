import React from 'react';

const Input = ({ label, id, ...props }) => {
  return (
    <div className="w-full">
      {label && <label htmlFor={id} className="block text-sm font-medium text-text-medium mb-1.5">{label}</label>}
      <input
        id={id}
        className="w-full px-4 py-3 bg-slate-100 rounded-xl shadow-soft-ui-inset focus:outline-none focus:ring-2 focus:ring-primary-purple transition-all"
        {...props}
      />
    </div>
  );
};

export default Input;