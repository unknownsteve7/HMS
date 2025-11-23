import React from 'react';

const Checkbox = ({ label, id, ...props }) => {
  return (
    <label htmlFor={id} className="flex items-center gap-2 cursor-pointer">
      <input
        id={id}
        type="checkbox"
        className="h-4 w-4 rounded border-gray-300 text-primary-purple focus:ring-primary-purple shadow-sm"
        {...props}
      />
      <span className="text-sm text-text-medium">{label}</span>
    </label>
  );
};

export default Checkbox;