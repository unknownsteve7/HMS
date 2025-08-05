import React from 'react';
import { Bed } from 'lucide-react';

const RoomLayout = ({ room, selectedCot, onSelectCot }) => {
  const getCotStyle = (cot) => {
    const baseStyle = 'border-2 rounded-lg flex flex-col items-center justify-center p-1 transition-all duration-200';
    const status = cot.status ? cot.status.toLowerCase() : 'unavailable';
    const cotId = cot.cot_id || cot.id;
    const selectedCotId = selectedCot ? (selectedCot.cot_id || selectedCot.id) : null;

    if (selectedCotId && selectedCotId === cotId && status === 'available') {
      return `${baseStyle} bg-blue-100 border-blue-500 text-blue-700 shadow-lg scale-105 cursor-pointer`;
    }

    switch (status) {
      case 'available':
        return `${baseStyle} bg-green-50 border-green-500 text-green-700 hover:bg-green-100 hover:shadow-md cursor-pointer`;
      case 'occupied':
        return `${baseStyle} bg-red-50 border-red-400 text-red-500 opacity-60 cursor-not-allowed`;
      case 'maintenance':
      case 'locked':
        return `${baseStyle} bg-yellow-50 border-yellow-400 text-yellow-600 opacity-80 cursor-not-allowed`;
      default:
        return `${baseStyle} bg-gray-100 border-gray-400 text-gray-500 cursor-not-allowed`;
    }
  };

  const handleCotClick = (cot) => {
    const status = cot.status ? cot.status.toLowerCase() : '';
    if (status === 'available') {
      onSelectCot(cot);
    }
  };

  return (
    <div className="w-full overflow-x-auto sm:overflow-visible scroll-visible px-2 sm:px-0">
      <div
        className="bg-slate-100 p-4 rounded-xl border border-subtle-border inline-block sm:block"
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${room.layout_cols || 6}, minmax(40px, 1fr))`,
          gridTemplateRows: `repeat(${room.layout_rows || 2}, minmax(60px, auto))`,
          gap: '8px',
          minWidth: 'max-content', // ensures cots don’t shrink below natural width
        }}
      >

        {room.cots.map(cot => {
          const cotId = cot.cot_id || cot.id;
          return (
            <div
              key={cotId}
              onClick={() => handleCotClick(cot)}
              className={getCotStyle(cot)}
              style={{
                gridColumnStart: cot.pos_x + 1,
                gridRowStart: cot.pos_y + 1,
                gridColumnEnd: cot.pos_x + 2,
                gridRowEnd: cot.pos_y + 2,
                minHeight: '40px',
                width: '40px',
                margin: 'auto',
              }}
            >
              <Bed size={16}
              />
              <span className="text-xs font-bold mt-1">{cot.number || cot.cot_number}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default RoomLayout;
