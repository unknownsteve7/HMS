import React from 'react';

const TableRow = ({ children, className = '', ...props }) => {
    return (
        <tr
            className={`border-b border-subtle-border hover:bg-slate-50 transition-colors ${className}`}
            {...props}
        >
            {children}
        </tr>
    );
};

export default TableRow;