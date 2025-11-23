import React, { useEffect, useState } from 'react';
import Card from '../ui/Card';
import Input from '../ui/Input';
import Checkbox from '../ui/Checkbox';
import Button from '../ui/Button';
import PillButton from './PillButton';
import { useAppContext } from '../../context/AppContext';
import { Fan, Wifi, Bath, BookOpenCheck, University, SlidersHorizontal, Home, Layers } from 'lucide-react';

// Default facilities in case API call fails
const defaultFacilities = [
    { facility_id: 'ac', facility_name: 'AC', icon: '❄️' },
    { facility_id: 'fan', facility_name: 'Fan', icon: '💨' },
    { facility_id: 'wifi', facility_name: 'WiFi', icon: '📶' },
    { facility_id: 'bathroom', facility_name: 'Attached Bathroom', icon: '🚿' },
    { facility_id: 'desk', facility_name: 'Study Desk', icon: '📚' },
];

const FilterSidebar = ({ filters, setFilters }) => {
    const { currentUser, getFacilities, facilities: contextFacilities } = useAppContext();
    const [facilities, setFacilities] = useState(defaultFacilities);

    // Load facilities on component mount
    useEffect(() => {
        const loadFacilities = async () => {
            try {
                const fetchedFacilities = await getFacilities();
                if (fetchedFacilities && fetchedFacilities.length > 0) {
                    setFacilities(fetchedFacilities);
                }
            } catch (error) {
                console.error('Error loading facilities:', error);
                // Fallback to default facilities
                setFacilities(defaultFacilities);
            }
        };

        // Only load if we don't have facilities from context
        if (!contextFacilities || contextFacilities.length === 0) {
            loadFacilities();
        } else {
            setFacilities(contextFacilities);
        }
    }, [getFacilities, contextFacilities]);

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
        setFilters(prev => ({
            ...prev,
            [field]: prev[field] === value ? '' : value
        }));
    };

    const handleFacilityChange = (e) => {
        const { name, value, checked } = e.target;
        setFilters(prev => {
            const currentFacilities = Array.isArray(prev.facilities) ? [...prev.facilities] : [];
            const facilityName = (value || name).toString().trim();
            
            // Normalize for case-insensitive comparison
            const normalizedFacilityName = facilityName.toLowerCase();
            
            // Check if facility is already selected (case-insensitive)
            const isAlreadySelected = currentFacilities.some(facility => {
                if (!facility) return false;
                
                // Handle both string and object facilities
                let facilityToCheck = facility;
                if (typeof facility === 'object') {
                    facilityToCheck = facility.facility_name || facility.name || '';
                }
                
                return facilityToCheck.toString().toLowerCase().trim() === normalizedFacilityName;
            });
            
            let updatedFacilities;
            if (checked && !isAlreadySelected) {
                // Add the facility as a string for consistency
                updatedFacilities = [...currentFacilities, facilityName];
            } else if (!checked && isAlreadySelected) {
                // Remove the facility (case-insensitive match)
                updatedFacilities = currentFacilities.filter(facility => {
                    if (!facility) return false;
                    
                    let facilityToCheck = facility;
                    if (typeof facility === 'object') {
                        facilityToCheck = facility.facility_name || facility.name || '';
                    }
                    
                    return facilityToCheck.toString().toLowerCase().trim() !== normalizedFacilityName;
                });
            } else {
                // No change needed
                updatedFacilities = currentFacilities;
            }
            
            return { ...prev, facilities: updatedFacilities };
        });
    };

    const handlePriceChange = (e) => {
        const { name, value } = e.target;
        setFilters(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const clearFilters = () => {
        setFilters({
            floor: '',
            roomType: '',
            facilities: [],
            minPrice: '',
            maxPrice: '',
            searchQuery: ''
        });
    };
    
    // Check if a facility is in the selected filters
    const isFacilityChecked = (facilityName) => {
        if (!Array.isArray(filters.facilities) || !facilityName) return false;
        
        // Normalize the input facility name for comparison
        const normalizedInput = facilityName.toString().toLowerCase().trim();
        
        return filters.facilities.some(selectedFacility => {
            if (!selectedFacility) return false;
            
            // Handle both string and object facilities
            let facilityToCheck = selectedFacility;
            if (typeof selectedFacility === 'object') {
                facilityToCheck = selectedFacility.facility_name || selectedFacility.name || '';
            }
            
            return facilityToCheck.toString().toLowerCase().trim() === normalizedInput;
        });
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
                                    key={facility.facility_id}
                                    label={facility.facility_name}
                                    name={facility.facility_name}
                                    value={facility.facility_name}
                                    checked={isFacilityChecked(facility.facility_name)}
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
