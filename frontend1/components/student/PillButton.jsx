import React from 'react';

const PillButton = ({ children, active, ...props }) => {
  const baseStyle = "px-4 py-2 rounded-full text-sm font-semibold transition-all duration-200 border-2";
  const activeStyle = "bg-primary-purple text-white border-primary-purple shadow-md";
  const inactiveStyle = "bg-white text-text-medium border-subtle-border hover:border-primary-purple hover:text-primary-purple";

  return (
    <button className={`${baseStyle} ${active ? activeStyle : inactiveStyle}`} {...props}>
      {children}
    </button>
  );
};

export default PillButton;