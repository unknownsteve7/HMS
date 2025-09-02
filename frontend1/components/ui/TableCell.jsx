import React from 'react';

const TableCell = ({ children, className = '', ...props }) => {
    return (
        <td
            className={`px-4 py-3 text-sm text-text-dark ${className}`}
            {...props}
        >
            {children}
        </td>
    );
};

export default TableCell;