import React from 'react';
import { Link } from 'react-router-dom';
import Card from '../ui/Card';
import Button from '../ui/Button';
import StatusTag from '../ui/StatusTag';
import { MapPin, Bed, Fan, Wifi, Bath, Users, IndianRupee } from 'lucide-react';

const RoomCard = ({ room }) => {
  // Handle different API data structures
  const roomNumber = room.roomNumber || room.room_number || `Room ${room.id}`;
  const roomType = room.type || room.room_type || 'Standard';
  const floor = room.floor || room.floor_number || 'N/A';
  const totalCots = room.cots?.length || 0;
  const occupiedCots = room.cots?.filter(cot => cot.status?.toLowerCase() === 'occupied').length || 0;
  const seatsLeft = totalCots - occupiedCots;

  const price = room.pricePerYear || room.price_per_year || room.price || 0;
  const advance = room.advanceAmount || room.advance_amount || Math.floor(price * 0.1);
  const facilities = room.facilities || ['AC', 'Fan', 'Wifi', 'Attached Bathroom'];
  const genderPreference = room.genderPreference || room.gender_preference || 'Mixed';

  return (
    <Card className="flex flex-col">
      <div className="flex justify-between items-start">
        <div>
          <h3 className="text-xl font-bold text-text-dark">{roomNumber}</h3>
          <div className="flex items-center gap-1 text-sm text-text-medium mt-1">
            <MapPin size={14} /> {floor === 0 || floor === '0' || floor === 'Ground' ? 'Ground Floor' :
              floor === 1 || floor === '1' ? '1st Floor' :
                floor === 2 || floor === '2' ? '2nd Floor' :
                  floor === 3 || floor === '3' ? '3rd Floor' :
                    floor === 4 || floor === '4' ? '4th Floor' :
                      `${floor} Floor`}
          </div>
        </div>
        <StatusTag status={roomType} />
      </div>

      <div className="my-4 border-t border-subtle-border" />

      <div className="grid grid-cols-2 gap-4 text-sm text-text-medium flex-grow">
        <div className="flex items-center gap-2"><Bed size={16} /> {occupiedCots}/{totalCots} Cots Filled</div>
        <div className="col-span-2">
          <p className="font-semibold mb-2">Facilities:</p>
          <div className="flex flex-wrap gap-x-4 gap-y-2">
            {facilities.map(f => (
              <div key={f} className="flex items-center gap-1.5">
                {f.includes('AC') && <Fan size={14} />}
                {f.includes('Fan') && <Fan size={14} />}
                {f.includes('Wifi') && <Wifi size={14} />}
                {(f.includes('Bath') || f.includes('Bathroom')) && <Bath size={14} />}
                <span>{f}</span>
              </div>
            ))}
          </div>
          <div className="flex flex-wrap gap-x-4 gap-y-2">
            {facilities.map(f => (
              <div key={f} className="flex items-center gap-1.5">
                {f.includes('Fan') && <Fan size={14} />}
                {f.includes('Wifi') && <Wifi size={14} />}
                {(f.includes('Bath') || f.includes('Bathroom')) && <Bath size={14} />}
                <span>{f}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="my-4 border-t border-subtle-border" />

      <div className="flex flex-col sm:flex-row justify-between sm:items-end">
        <div>
          <p className="text-2xl font-bold text-text-dark">₹{price.toLocaleString()}<span className="text-sm font-normal text-text-medium">/year</span></p>
          <p className="text-sm text-text-medium">Advance: ₹{advance.toLocaleString()}</p>
        </div>
        <div className="mt-4 sm:mt-0 text-right">
          <p className={`font-bold ${seatsLeft > 0 ? 'text-green-600' : 'text-red-500'}`}>{seatsLeft} Seat{seatsLeft !== 1 ? 's' : ''} Left</p>
          <Link to={`/student/book-room/${room.room_id || room.id || room._id}`} className={seatsLeft === 0 ? 'pointer-events-none' : ''}>
            <Button className="w-full sm:w-auto mt-2" disabled={seatsLeft === 0}>Book Now</Button>
          </Link>
        </div>
      </div>
    </Card>
  );
};

export default RoomCard;