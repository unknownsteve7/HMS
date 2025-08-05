import React from 'react';
import Card from '../ui/Card';
import Input from '../ui/Input';
import Checkbox from '../ui/Checkbox';
import Button from '../ui/Button';
import PillButton from './PillButton';
import { useAppContext } from '../../context/AppContext';
import { Fan, Wifi, Bath, BookOpenCheck, University, SlidersHorizontal, Home, Layers } from 'lucide-react';

const facilities = [
    { name: 'AC', value: 'AC', icon: <Fan size={16} /> },
    { name: 'Fan', value: 'Fan', icon: <Fan size={16} /> },
    { name: 'Wifi', value: 'Wifi', icon: <Wifi size={16} /> },
    { name: 'Attached Bathroom', value: 'Attached Bathroom', icon: <Bath size={16} /> },
    { name: 'Study Desk', value: 'Study Desk', icon: <BookOpenCheck size={16} /> },
];

const FilterSidebar = ({ filters, setFilters }) => {
    const { currentUser } = useAppContext();

    const userGender = currentUser?.gender || currentUser?.Gender;

    const floors = [
        { label: 'Ground Floor', value: 'Ground Floor' },
        { label: '1st Floor', value: '1st Floor' },
        { label: '2nd Floor', value: '2nd Floor' },
        { label: '3rd Floor', value: '3rd Floor' },
        { label: '4th Floor', value: '4th Floor' },
    ];

    const roomTypes = [
        { label: 'Normal', value: 'Normal' },
        { label: 'Deluxe', value: 'Deluxe' },
        { label: 'Super Deluxe', value: 'Super Deluxe' },
        { label: 'Ultra Deluxe', value: 'Ultra Deluxe' },
    ];

    const handlePillChange = (field, value) => {
        setFilters((prev) => ({
            ...prev,
            [field]: prev[field] === value ? null : value,
        }));
    };

    const handleFacilityChange = (e) => {
        const { name, checked } = e.target;
        setFilters((prev) => {
            const currentFacilities = prev.facilities || [];
            if (checked) {
                return { ...prev, facilities: [...currentFacilities, name] };
            }
            return { ...prev, facilities: currentFacilities.filter((f) => f !== name) };
        });
    };

    const handlePriceChange = (e) => {
        setFilters((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const clearFilters = () => {
        setFilters({ floor: null, roomType: null, facilities: [], minPrice: '', maxPrice: '' });
    };

    return (
        <aside className="w-full lg:w-80 xl:w-96 flex-shrink-0">
            <Card className="sticky top-8">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold flex items-center gap-2"><SlidersHorizontal size={20} /> Filters</h2>
                    <button onClick={clearFilters} className="text-sm font-semibold text-primary-purple hover:underline">CLEAR ALL</button>
                </div>

                <div className="space-y-6">
                    {userGender && (
                        <div className="p-3 bg-gradient-to-r from-primary-purple/10 to-primary-purple-light/10 rounded-lg border border-primary-purple/20">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h4 className="font-semibold text-sm text-primary-purple">Your Profile</h4>
                                    <p className="text-xs text-gray-600 mt-1">
                                        Gender: <span className="font-medium">{userGender.toLowerCase() === 'male' ? 'Male' : 'Female'}</span>
                                    </p>
                                </div>
                                <div className="text-primary-purple">
                                    <University size={20} />
                                </div>
                            </div>
                            <p className="text-xs text-gray-500 mt-2">
                                Showing rooms available for your gender only
                            </p>
                        </div>
                    )}

                    <div>
                        <h3 className="font-semibold mb-3 flex items-center gap-1"><Layers size={16} /> Floor</h3>
                        <div className="flex flex-wrap gap-2">
                            {floors.map(floor => (
                                <PillButton
                                    key={floor.value}
                                    active={filters.floor === floor.value}
                                    onClick={() => handlePillChange('floor', floor.value)}
                                >
                                    {floor.label}
                                </PillButton>
                            ))}
                        </div>
                    </div>

                    <div>
                        <h3 className="font-semibold mb-3 flex items-center gap-1"><Home size={16} /> Room Type</h3>
                        <div className="flex flex-wrap gap-2">
                            {roomTypes.map(type => (
                                <PillButton
                                    key={type.value}
                                    active={filters.roomType === type.value}
                                    onClick={() => handlePillChange('roomType', type.value)}
                                >
                                    {type.label}
                                </PillButton>
                            ))}
                        </div>
                    </div>

                    <div>
                        <h3 className="font-semibold mb-3 flex items-center gap-1"><Fan size={16} /> Facilities</h3>
                        <div className="space-y-2">
                            {facilities.map(facility => (
                                <Checkbox
                                    key={facility.name}
                                    label={facility.name}
                                    name={facility.value}
                                    checked={filters.facilities.includes(facility.value)}
                                    onChange={handleFacilityChange}
                                />
                            ))}
                        </div>
                    </div>

                    <div>
                        <h3 className="font-semibold mb-3 flex items-center gap-1"><span className="font-bold">₹</span> Price Range (₹)</h3>
                        <div className="flex items-center gap-2">
                            <Input name="minPrice" placeholder="Min" type="number" value={filters.minPrice} onChange={handlePriceChange} />
                            <span className="text-text-medium">-</span>
                            <Input name="maxPrice" placeholder="Max" type="number" value={filters.maxPrice} onChange={handlePriceChange} />
                        </div>
                    </div>
                </div>

                <Button className="w-full mt-8">Apply Filters</Button>
            </Card>
        </aside>
    );
};

export default FilterSidebar;
