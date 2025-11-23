import React from 'react';

export const Table = ({ headers, children }) => {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm text-left text-text-medium">
        <thead className="text-xs text-text-dark uppercase bg-slate-100">
          <tr>
            {headers.map((header) => (
              <th key={header} scope="col" className="px-6 py-4">
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {children}
        </tbody>
      </table>
    </div>
  );
};

export const TableRow = ({children}) => {
    return (
        <tr className="bg-white border-b border-slate-100 hover:bg-slate-50 transition-colors">
            {children}
        </tr>
    );
};

export const TableCell = ({children, className=""}) => {
    return (
        <td className={`px-6 py-4 ${className}`}>
            {children}
        </td>
    );
};