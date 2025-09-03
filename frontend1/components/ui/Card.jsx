import React from 'react';

const Card = ({ children, className = '', onClick }) => {
  return (
    <div
      onClick={onClick}
      className={`bg-white rounded-3xl shadow-soft-ui p-6 transition-all duration-300 ${className}`}
    >
      {children}
    </div>
  );
};

export default Card;