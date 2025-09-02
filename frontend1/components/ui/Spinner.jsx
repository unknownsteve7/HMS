import React from 'react';

const Spinner = ({ size = 'sm', className = '' }) => {
    const sizeClasses = {
        xs: 'w-3 h-3',
        sm: 'w-4 h-4',
        md: 'w-6 h-6',
        lg: 'w-8 h-8',
        xl: 'w-12 h-12'
    };

    return (
        <div className={`inline-block animate-spin rounded-full border-2 border-solid border-current border-r-transparent ${sizeClasses[size]} ${className}`} role="status">
            <span className="sr-only">Loading...</span>
        </div>
    );
};

export default Spinner;
