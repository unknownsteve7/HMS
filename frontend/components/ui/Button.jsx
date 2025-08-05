import React from 'react';

const Button = ({ children, variant = 'primary', className = '', leftIcon, rightIcon, ...props }) => {
  const baseStyle = 'px-6 py-3 rounded-xl font-semibold text-sm transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed';
  
  const variantStyles = {
    primary: 'bg-primary-purple text-white shadow-soft-ui hover:shadow-md active:shadow-soft-ui-sm-inset',
    secondary: 'bg-white text-primary-purple shadow-soft-ui hover:shadow-md active:shadow-soft-ui-sm-inset',
    destructive: 'bg-red-500 text-white shadow-soft-ui hover:shadow-md hover:bg-red-600 active:shadow-soft-ui-sm-inset',
  };

  return (
    <button className={`${baseStyle} ${variantStyles[variant]} ${className}`} {...props}>
      {leftIcon}
      {children}
      {rightIcon}
    </button>
  );
};

export default Button;