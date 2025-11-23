import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { debounce } from 'lodash';
import Card from '../../components/ui/Card';
import { useAppContext } from '../../context/AppContext';
import RoomCard from '../../components/student/RoomCard';
import FilterSidebar from '../../components/student/FilterSidebar';

// A helper function to normalize floor names for consistent filtering
const normalizeFloor = (floor) => {
    if (typeof floor === 'string') {
        const lowerCaseFloor = floor.toLowerCase();
        if (lowerCaseFloor.includes('ground') || lowerCaseFloor === '0' || lowerCaseFloor === 'g') return 'ground floor';
        if (lowerCaseFloor.includes('1st') || lowerCaseFloor.includes('first') || lowerCaseFloor === '1') return '1st floor';
        if (lowerCaseFloor.includes('2nd') || lowerCaseFloor.includes('second') || lowerCaseFloor === '2') return '2nd floor';
        if (lowerCaseFloor.includes('3rd') || lowerCaseFloor.includes('third') || lowerCaseFloor === '3') return '3rd floor';
        if (lowerCaseFloor.includes('4th') || lowerCaseFloor.includes('fourth') || lowerCaseFloor === '4') return '4th floor';
        return lowerCaseFloor;
    }
    if (typeof floor === 'number') {
        if (floor === 0) return 'ground floor';
        if (floor === 1) return '1st floor';
        if (floor === 2) return '2nd floor';
        if (floor === 3) return '3rd floor';
        if (floor === 4) return '4th floor';
    }
    return '';
};

const BrowseRooms = () => {
    const { rooms, fetchRooms, isLoading, currentUser } = useAppContext();
    const [filterState, setFilterState] = useState({
        floor: '',
        roomType: '',
        facilities: [],
        minPrice: '',
        maxPrice: '',
        searchQuery: ''
    });

    // Debounced filters to prevent too many re-renders
    const [filters, setFilters] = useState(filterState);
    
    // Handle filter changes with debouncing
    const handleFilterChange = useCallback((update) => {
        setFilterState(prev => {
            const newFilters = typeof update === 'function' ? update(prev) : { ...prev, ...update };
            return newFilters;
        });
    }, []);

    // Debounce filter updates
    useEffect(() => {
        const debouncedUpdate = debounce((state) => {
            setFilters(state);
        }, 300);
        
        debouncedUpdate(filterState);
        
        // Cleanup
        return () => {
            debouncedUpdate.cancel();
        };
    }, [filterState]);

    const [sortOption, setSortOption] = useState('Relevance');
    const [searchTerm, setSearchTerm] = useState('');

    const userGender = currentUser?.gender || currentUser?.Gender;
    const isMale = userGender && userGender.toLowerCase() === 'male';
    const isFemale = userGender && userGender.toLowerCase() === 'female';

    useEffect(() => {
        if (!rooms || rooms.length === 0) {
            fetchRooms().catch(error => {
                console.error('Failed to fetch rooms for student:', error);
            });
        }
    }, [rooms, fetchRooms]);

    const filteredAndSortedRooms = useMemo(() => {
        if (!rooms || !Array.isArray(rooms)) {
            return [];
        }

        let filtered = rooms.filter(room => room.status !== 'Full');

        // Apply gender-based filtering automatically based on user profile
        if (userGender) {
            filtered = filtered.filter(room => {
                const roomGender = (room.genderPreference || room.gender_preference || room.gender || '').toLowerCase();
                if (isMale) {
                    return roomGender.includes('male') || roomGender.includes('boy') || roomGender === 'mixed';
                }
                if (isFemale) {
                    return roomGender.includes('female') || roomGender.includes('girl') || roomGender === 'mixed';
                }
                return true; // If user gender is unknown, show all
            });
        }

        // Apply user-selected filters
        if (filters.floor) {
            const normalizedFilterFloor = normalizeFloor(filters.floor);
            filtered = filtered.filter(room => {
                const normalizedRoomFloor = normalizeFloor(room.floor || room.floor_number);
                return normalizedRoomFloor === normalizedFilterFloor;
            });
        }

        if (filters.roomType) {
            filtered = filtered.filter(room => {
                const roomType = (room.type || room.room_type || '');
                return roomType === filters.roomType;
            });
        }

        if (filters.facilities.length > 0) {
            // Normalize selected facility filters to lowercase for case-insensitive comparison
            const normalizedSelectedFacilities = filters.facilities
                .filter(Boolean)
                .map(f => f.toString().toLowerCase().trim());
            
            filtered = filtered.filter(room => {
                // Get all facility names from the room, handling different data structures
                const roomFacilities = (room.facilities || []).map(f => {
                    if (!f) return '';
                    if (typeof f === 'string') return f.toLowerCase().trim();
                    if (typeof f === 'object') return (f.name || f.facility_name || '').toString().toLowerCase().trim();
                    return '';
                }).filter(Boolean);
                
                // Check if any of the room's facilities match any of the selected filters
                return roomFacilities.some(roomFacility => 
                    normalizedSelectedFacilities.includes(roomFacility)
                );
            });
        }


        if (filters.minPrice) {
            filtered = filtered.filter(room =>
                (room.pricePerYear || room.price_per_year || room.price || 0) >= parseInt(filters.minPrice, 10)
            );
        }

        if (filters.maxPrice) {
            filtered = filtered.filter(room =>
                (room.pricePerYear || room.price_per_year || room.price || 0) <= parseInt(filters.maxPrice, 10)
            );
        }

        // Apply search term filtering
        if (searchTerm.trim()) {
            const searchLower = searchTerm.toLowerCase().trim();
            filtered = filtered.filter(room => {
                const roomNumber = (room.roomNumber || room.room_number || room.number || '').toString().toLowerCase();
                const roomType = (room.type || room.room_type || '').toLowerCase();
                const roomFloor = normalizeFloor(room.floor || room.floor_number);
                const facilities = (room.facilities || []).join(' ').toLowerCase();

                return roomNumber.includes(searchLower) ||
                    roomType.includes(searchLower) ||
                    roomFloor.includes(searchLower) ||
                    facilities.includes(searchLower);
            });
        }

        // Apply sorting
        switch (sortOption) {
            case 'Price':
                filtered.sort((a, b) =>
                    (a.pricePerYear || a.price_per_year || a.price || 0) - (b.pricePerYear || b.price_per_year || b.price || 0)
                );
                break;
            case 'Availability':
                filtered.sort((a, b) => {
                    const aSeatsLeft = (a.totalCots || a.total_cots || 0) - (a.occupiedCots || a.occupied_cots || 0);
                    const bSeatsLeft = (b.totalCots || b.total_cots || 0) - (b.occupiedCots || b.occupied_cots || 0);
                    return bSeatsLeft - aSeatsLeft;
                });
                break;
            case 'Floor':
                filtered.sort((a, b) => {
                    const aFloor = normalizeFloor(a.floor || a.floor_number);
                    const bFloor = normalizeFloor(b.floor || b.floor_number);
                    return aFloor.localeCompare(bFloor, undefined, { numeric: true, sensitivity: 'base' });
                });
                break;
            default:
                break;
        }

        return filtered;
    }, [rooms, filters, sortOption, searchTerm, userGender, isMale, isFemale]);

    const sortOptions = ["Relevance", "Price", "Availability", "Floor"];

    if (isLoading) {
        return (
            <div className="flex justify-center items-center min-h-64">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-purple mx-auto"></div>
                    <p className="mt-4 text-text-medium">Loading rooms...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col lg:flex-row gap-8">
            <FilterSidebar filters={filters} setFilters={handleFilterChange} />
            <div className="flex-1">
                <Card className="mb-6">
                    <div className="flex flex-col md:flex-row justify-between items-center">
                        <div>
                            <h1 className="text-2xl font-bold text-text-dark">Room Booking - Academic Year 2024-2025</h1>
                            <p className="text-text-medium mt-1">Choose your preferred room and book your accommodation.</p>
                        </div>
                        <div className="flex items-center gap-2 mt-4 md:mt-0">
                            <span className="text-sm font-semibold text-text-medium whitespace-nowrap">
                                {filteredAndSortedRooms.length} rooms found
                            </span>
                        </div>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-4 sm:items-center justify-between mt-4 border-t border-subtle-border pt-4">
                        <div className="flex flex-col sm:flex-row gap-4 sm:items-center justify-between mt-4 border-t border-subtle-border pt-4">
                            {/* Sort Label and Buttons Group */}
                            <div className="flex flex-col sm:flex-row gap-2 sm:items-center w-full sm:w-auto">
                                <span className="text-sm font-semibold shrink-0">Sort by:</span>

                                {/* Buttons Wrap on Small Screens */}
                                <div className="flex flex-wrap gap-2">
                                    {sortOptions.map(opt => (
                                        <button
                                            key={opt}
                                            onClick={() => setSortOption(opt)}
                                            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${sortOption === opt
                                                ? 'bg-primary-purple text-white shadow-md'
                                                : 'bg-slate-100 text-text-medium hover:bg-slate-200'
                                                }`}
                                        >
                                            {opt}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <input
                                type="text"
                                placeholder="Search rooms..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-purple focus:border-transparent transition-all min-w-64"
                            />
                            {searchTerm && (
                                <button
                                    onClick={() => setSearchTerm('')}
                                    className="text-gray-400 hover:text-gray-600 transition-colors"
                                    title="Clear search"
                                >
                                    ✕
                                </button>
                            )}
                        </div>
                    </div>
                </Card>

                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                    {filteredAndSortedRooms.map(room => (
                        <RoomCard key={room.id || room._id} room={room} />
                    ))}
                    {filteredAndSortedRooms.length === 0 && !isLoading && (
                        <Card className="xl:col-span-2 text-center py-16">
                            <h3 className="text-xl font-semibold text-text-dark">No Rooms Found</h3>
                            <p className="text-text-medium mt-2">Try adjusting your filters to find available rooms.</p>
                        </Card>
                    )}
                </div>
            </div>
        </div>
    );
};

export default BrowseRooms;
