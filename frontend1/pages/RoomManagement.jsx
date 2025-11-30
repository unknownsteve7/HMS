import React, { useState, useMemo, useEffect } from 'react';
import Card from '../components/ui/Card';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import { Table, TableRow, TableCell } from '../components/ui/Table';
import StatusTag from '../components/ui/StatusTag';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import Checkbox from '../components/ui/Checkbox';
import { useAppContext } from '../context/AppContext';
import { useToast } from '../context/ToastContext';
import { updateRoom, deleteRoom } from '../apiService';
import { Eye, Edit, Trash2, PlusCircle, RefreshCw } from 'lucide-react';

const RoomManagement = () => {
  const { rooms, addRoom, fetchRooms, isLoading, isAuthenticated, userRole, authToken, bookings } = useAppContext();
  const { showSuccess, showError } = useToast();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingRoom, setEditingRoom] = useState(null);
  const [newRoomData, setNewRoomData] = useState({ facilities: [] });
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('All');
  const [floorFilter, setFloorFilter] = useState('All');
  const [genderFilter, setGenderFilter] = useState('All');
  const [showDebugPanel, setShowDebugPanel] = useState(false);

  // Debug: Log rooms data
  useEffect(() => {
    console.log('🏠 RoomManagement - Rooms data updated:', rooms);
    console.log('📊 Number of rooms:', rooms?.length);
    console.log('🔐 Authentication status:', { isAuthenticated, userRole, hasToken: !!authToken });
  }, [rooms, isAuthenticated, userRole, authToken]);

  // Fetch rooms on component mount
  useEffect(() => {
    const loadRooms = async () => {
      try {
        console.log('🔄 RoomManagement: Initial room loading...');
        console.log('🔐 Auth status:', { isAuthenticated, userRole, hasToken: !!authToken });

        if (!isAuthenticated) {
          console.log('⏳ Not authenticated yet, skipping room fetch');
          return;
        }

        await fetchRooms();
        console.log('✅ Initial room loading completed');
      } catch (error) {
        console.error('❌ Initial room loading failed:', error);
        console.error('❌ Error details:', {
          message: error.message,
          status: error.status,
          name: error.name
        });
      }
    };

    loadRooms();
  }, [fetchRooms, isAuthenticated, userRole, authToken]); // Added auth dependencies

  const handleRefreshRooms = async () => {
    try {
      console.log('🔄 Manual refresh triggered');
      console.log('🔑 Current auth token:', authToken && typeof authToken === 'string' ? `${authToken.substring(0, 10)}...` : 'null');
      console.log('👤 Current user role:', userRole);
      console.log('🔐 Is authenticated:', isAuthenticated);

      await fetchRooms();
      console.log('✅ Manual refresh completed');
    } catch (error) {
      console.error('❌ Manual refresh failed:', error);
      alert(`Failed to refresh rooms: ${error.message}`);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    console.log(`📝 Form field changed - ${name}:`, value);
    setNewRoomData(prev => {
      const updated = { ...prev, [name]: value };
      console.log('📝 Updated form data:', updated);
      return updated;
    });
  };

  // Parse room dimensions from input (e.g., "10x12" -> {width: 10, height: 12})
  const parseRoomDimensions = (dimensionString) => {
    if (!dimensionString) return { width: 12, height: 8 }; // Default
    const parts = dimensionString.toLowerCase().split('x');
    if (parts.length === 2) {
      const width = parseInt(parts[0]) || 12;
      const height = parseInt(parts[1]) || 8;
      return { width, height };
    }
    return { width: 12, height: 8 };
  };

  // Calculate layout based on room dimensions and total cots
  const calculateLayoutFromDimensions = () => {
    try {
      const totalCots = Number(newRoomData.totalCots) || 0;
      const dimensions = parseRoomDimensions(newRoomData.roomDimensions);

      if (!dimensions || !dimensions.width || !dimensions.height) {
        console.warn('Invalid dimensions:', dimensions);
        return { layoutCols: 3, layoutRows: 2, maxCols: 6, maxRows: 4, dimensions: { width: 12, height: 8 } };
      }

      // Calculate optimal layout based on room dimensions
      // Assume each cot needs about 2x3 units of space
      const maxCols = Math.max(1, Math.floor(dimensions.width / 2));
      const maxRows = Math.max(1, Math.floor(dimensions.height / 3));

      // Calculate actual layout with bounds checking
      const inputLayoutCols = Number(newRoomData.layoutCols) || 0;
      const inputLayoutRows = Number(newRoomData.layoutRows) || 0;

      const layoutCols = inputLayoutCols > 0 ?
        Math.min(maxCols, inputLayoutCols) :
        Math.min(maxCols, Math.max(1, Math.ceil(Math.sqrt(totalCots))));

      const layoutRows = inputLayoutRows > 0 ?
        Math.min(maxRows, inputLayoutRows) :
        Math.max(1, Math.ceil(totalCots / layoutCols));

      return { layoutCols, layoutRows, maxCols, maxRows, dimensions };
    } catch (error) {
      console.error('Error in calculateLayoutFromDimensions:', error);
      return { layoutCols: 3, layoutRows: 2, maxCols: 6, maxRows: 4, dimensions: { width: 12, height: 8 } };
    }
  };

  // Calculate layout preview with editable positions
  const getLayoutPreview = () => {
    try {
      const totalCots = Number(newRoomData.totalCots) || 0;
      if (totalCots === 0 || totalCots > 20) return null; // Add upper limit to prevent performance issues

      const layoutData = calculateLayoutFromDimensions();
      if (!layoutData || !layoutData.layoutCols || !layoutData.layoutRows) {
        console.warn('Invalid layout data:', layoutData);
        return null;
      }

      const { layoutCols, layoutRows, dimensions } = layoutData;

      // Use custom cot positions if available, otherwise generate default positions
      const customCots = newRoomData.customCots || [];
      const cots = [];

      for (let i = 0; i < totalCots; i++) {
        const customCot = customCots.find(cot => cot && cot.number === i + 1);
        if (customCot && typeof customCot.x === 'number' && typeof customCot.y === 'number') {
          cots.push({
            number: i + 1,
            x: customCot.x,
            y: customCot.y
          });
        } else {
          // Default positioning
          const x = i % layoutCols;
          const y = Math.floor(i / layoutCols);
          cots.push({ number: i + 1, x, y });
        }
      }

      return { cots, layoutCols, layoutRows, dimensions };
    } catch (error) {
      console.error('Error in getLayoutPreview:', error);
      return null;
    }
  };

  // Handle cot position changes in the visual editor
  const handleCotPositionChange = (cotNumber, newX, newY) => {
    try {
      if (typeof cotNumber !== 'number' || typeof newX !== 'number' || typeof newY !== 'number') {
        console.warn('Invalid parameters for handleCotPositionChange:', { cotNumber, newX, newY });
        return;
      }

      const layoutData = calculateLayoutFromDimensions();
      if (!layoutData) {
        console.warn('Could not calculate layout dimensions');
        return;
      }

      const { layoutCols, layoutRows } = layoutData;

      // Validate position bounds
      if (newX < 0 || newX >= layoutCols || newY < 0 || newY >= layoutRows) {
        console.log(`🚫 Cot ${cotNumber} position out of bounds: Column ${newX}, Row ${newY} (Max: ${layoutCols - 1}, ${layoutRows - 1})`);
        return;
      }

      console.log(`🛏️ Moving Cot ${cotNumber} to: Column ${newX}, Row ${newY} (pos_x: ${newX}, pos_y: ${newY})`);

      setNewRoomData(prev => {
        if (!prev) return prev;

        const customCots = Array.isArray(prev.customCots) ? prev.customCots : [];
        const existingCotIndex = customCots.findIndex(cot => cot && cot.number === cotNumber);

        const updatedCot = { number: cotNumber, x: newX, y: newY };

        if (existingCotIndex >= 0) {
          customCots[existingCotIndex] = updatedCot;
          console.log(`🔄 Updated existing cot position: Cot ${cotNumber} → Column ${newX}, Row ${newY}`);
        } else {
          customCots.push(updatedCot);
          console.log(`➕ Added new cot position: Cot ${cotNumber} → Column ${newX}, Row ${newY}`);
        }

        console.log('🛏️ All custom cot positions:', customCots.map(c => c ? `Cot ${c.number}: (${c.x}, ${c.y})` : 'Invalid cot'));
        return { ...prev, customCots: [...customCots] };
      });
    } catch (error) {
      console.error('Error in handleCotPositionChange:', error);
    }
  };

  // Reset layout to default positioning
  const resetLayout = () => {
    try {
      console.log('🔄 Resetting room layout to default positions');
      setNewRoomData(prev => ({ ...prev, customCots: [] }));
    } catch (error) {
      console.error('Error in resetLayout:', error);
    }
  };

  // Calculate occupancy for a specific room
  const calculateRoomOccupancy = (room) => {
    try {
      // Get total capacity for this room
      let totalCapacity = 0;
      let occupiedCots = 0;

      // First priority: Use cots array if available (most accurate)
      if (Array.isArray(room.cots) && room.cots.length > 0) {
        totalCapacity = room.cots.length;
        // Count occupied cots based on cot status
        occupiedCots = room.cots.filter(cot =>
          cot && cot.status &&
          (cot.status.toLowerCase() === 'occupied' ||
            cot.status.toLowerCase() === 'booked' ||
            cot.status.toLowerCase() === 'reserved')
        ).length;
      } else {
        // Fallback: Use total_cots or totalCots field
        if (room.total_cots && typeof room.total_cots === 'number') {
          totalCapacity = room.total_cots;
        } else if (room.totalCots && typeof room.totalCots === 'number') {
          totalCapacity = room.totalCots;
        } else if (room.capacity && typeof room.capacity === 'number') {
          totalCapacity = room.capacity;
        } else {
          totalCapacity = 4;
        }

        // Calculate occupied cots from bookings as fallback
        if (Array.isArray(bookings) && bookings.length > 0) {
          const roomId = room.id || room.room_id || room._id;
          const roomNumber = room.roomNumber || room.room_number || room.number;

          const activeBookingsForRoom = bookings.filter(booking => {
            if (!booking) return false;

            const bookingRoomId = booking.roomId || booking.room_id || booking.room;
            const bookingRoomNumber = booking.room_number || booking.roomNumber || booking.room?.room_number;

            const isForThisRoom =
              bookingRoomId === roomId ||
              bookingRoomId === roomNumber ||
              bookingRoomNumber === roomNumber ||
              (booking.room && typeof booking.room === 'object' &&
                (booking.room._id === roomId || booking.room.id === roomId ||
                  booking.room.room_number === roomNumber || booking.room.roomNumber === roomNumber));

            const isActiveBooking = booking.status === 'Active' ||
              booking.status === 'Pending Check-in' ||
              booking.status === 'active' ||
              booking.status === 'confirmed' ||
              booking.status === 'Confirmed';

            return isForThisRoom && isActiveBooking;
          });

          occupiedCots = activeBookingsForRoom.length;
        }
      }

      const availableCots = Math.max(0, totalCapacity - occupiedCots);
      const occupancyRate = totalCapacity > 0 ? (occupiedCots / totalCapacity) * 100 : 0;

      return {
        totalCapacity,
        occupiedCots,
        availableCots,
        occupancyRate: Math.round(occupancyRate)
      };
    } catch (error) {
      console.error('Error calculating room occupancy:', error);
      return {
        totalCapacity: 0,
        occupiedCots: 0,
        availableCots: 0,
        occupancyRate: 0
      };
    }
  };

  // Open edit modal with room data
  const handleEditRoom = (room) => {
    setIsEditMode(true);
    setEditingRoom(room);

    // Populate form with existing room data
    setNewRoomData({
      roomNumber: room.roomNumber || room.room_number || room.number || '',
      floor: room.floor || room.floor_number || '',
      type: room.type || room.room_type || '',
      totalCots: room.totalCots || room.total_cots || '',
      layoutCols: room.layoutCols || room.layout_cols || '',
      layoutRows: room.layoutRows || room.layout_rows || '',
      pricePerYear: room.pricePerYear || room.price_per_year || room.price || '',
      advanceAmount: room.advanceAmount || room.advance_amount || '',
      genderPreference: room.genderPreference || room.gender_preference || room.gender || '',
      roomDimensions: room.dimensions ? `${room.dimensions.width}x${room.dimensions.height}` : '',
      description: room.description || '',
      facilities: room.facilities || [],
      customCots: room.cots || []
    });

    setIsModalOpen(true);
  };

  // Close modal and reset states
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setIsEditMode(false);
    setEditingRoom(null);
    setNewRoomData({ facilities: [] });
  };

  // Handle room deletion with confirmation
  const handleDeleteRoom = async (room) => {
    try {
      const roomNumber = room.roomNumber || room.room_number || room.number || 'Unknown';
      const roomId = room.id || room.room_id || room._id;

      if (!roomId) {
        showError('Cannot delete room: Room ID not found ❌');
        return;
      }

      // Show confirmation dialog
      const confirmDelete = window.confirm(
        `Are you sure you want to delete Room ${roomNumber}?\n\n` +
        `This action cannot be undone and will permanently remove the room from the system.`
      );

      if (!confirmDelete) {
        console.log('🚫 Room deletion cancelled by user');
        return;
      }

      console.log('🗑️ Deleting room:', { roomId, roomNumber });

      // Call the delete API
      await deleteRoom(roomId, authToken);

      // Show success message
      showSuccess(`Room ${roomNumber} deleted successfully! 🗑️✨`, 4000);

      // Refresh the rooms list to remove the deleted room
      await fetchRooms();

    } catch (error) {
      console.error('❌ Failed to delete room:', error);
      showError(`Failed to delete room: ${error.message || 'Unknown error'} ❌`);
    }
  };

  const handleCheckboxChange = (e) => {
    const { name, checked } = e.target;
    console.log(`☑️ Checkbox changed - ${name}:`, checked);
    setNewRoomData(prev => {
      const facilities = prev.facilities || [];
      let updatedFacilities;
      if (checked) {
        updatedFacilities = [...facilities, name];
      } else {
        updatedFacilities = facilities.filter(facility => facility !== name);
      }
      const updated = { ...prev, facilities: updatedFacilities };
      console.log('☑️ Updated facilities:', updatedFacilities);
      console.log('☑️ Updated form data:', updated);
      return updated;
    });
  };

  const handleCreateRoom = async () => {
    console.log('🎛️ FORM SUBMISSION STARTED');
    console.log('🎛️ Current newRoomData:', newRoomData);
    console.log('🎛️ All form fields:');
    console.log('  - roomNumber:', newRoomData.roomNumber);
    console.log('  - floor:', newRoomData.floor);
    console.log('  - type:', newRoomData.type);
    console.log('  - totalCots:', newRoomData.totalCots);
    console.log('  - pricePerYear:', newRoomData.pricePerYear);
    console.log('  - advanceAmount:', newRoomData.advanceAmount);
    console.log('  - genderPreference:', newRoomData.genderPreference);
    console.log('  - roomDimensions:', newRoomData.roomDimensions);
    console.log('  - description:', newRoomData.description);
    console.log('  - facilities:', newRoomData.facilities);
    console.log('  - customCots:', newRoomData.customCots);
    console.log('  - layoutCols:', newRoomData.layoutCols);
    console.log('  - layoutRows:', newRoomData.layoutRows);

    // Basic validation - make advanceAmount optional
    const requiredFields = {
      roomNumber: newRoomData.roomNumber,
      floor: newRoomData.floor,
      type: newRoomData.type,
      totalCots: newRoomData.totalCots,
      pricePerYear: newRoomData.pricePerYear,
      genderPreference: newRoomData.genderPreference
    };

    console.log('🔍 VALIDATION CHECK:');
    const missingFields = [];
    Object.entries(requiredFields).forEach(([key, value]) => {
      if (!value) {
        missingFields.push(key);
        console.log(`  ❌ ${key}: MISSING`);
      } else {
        console.log(`  ✅ ${key}: ${value}`);
      }
    });

    if (missingFields.length > 0) {
      showError(`Please fill all required fields: ${missingFields.join(', ')} ⚠️`);
      return;
    }

    try {
      // Calculate layout dimensions based on total cots and room dimensions
      const totalCots = Number(newRoomData.totalCots);
      const { layoutCols, layoutRows, dimensions } = calculateLayoutFromDimensions();

      // Use custom cot positions if available
      const customCots = newRoomData.customCots || [];
      const finalCots = [];

      console.log('🛏️ Generating final cot positions:');
      console.log('  - Total cots needed:', totalCots);
      console.log('  - Custom positions available:', customCots.length);
      console.log('  - Layout grid:', `${layoutCols} columns × ${layoutRows} rows`);

      for (let i = 0; i < totalCots; i++) {
        const customCot = customCots.find(cot => cot.number === i + 1);
        if (customCot) {
          finalCots.push({
            number: i + 1,
            x: customCot.x, // Column position (pos_x in API)
            y: customCot.y, // Row position (pos_y in API)
            status: customCot.status || 'Available'
          });
          console.log(`  ✅ Cot ${i + 1}: Custom position - Column ${customCot.x}, Row ${customCot.y}`);
        } else {
          // Default positioning
          const x = i % layoutCols; // Column
          const y = Math.floor(i / layoutCols); // Row
          finalCots.push({
            number: i + 1,
            x: x,
            y: y,
            status: 'Available'
          });
          console.log(`  🔄 Cot ${i + 1}: Default position - Column ${x}, Row ${y}`);
        }
      }

      console.log('🛏️ Final cot coordinates summary:');
      finalCots.forEach(cot => {
        console.log(`    Cot ${cot.number}: (Column ${cot.x}, Row ${cot.y}) → API: (pos_x: ${cot.x}, pos_y: ${cot.y})`);
      });

      const roomDataToSubmit = {
        roomNumber: newRoomData.roomNumber,
        floor: newRoomData.floor,
        type: newRoomData.type,
        totalCots: totalCots,
        pricePerYear: Number(newRoomData.pricePerYear),
        advanceAmount: Number(newRoomData.advanceAmount),
        genderPreference: newRoomData.genderPreference,
        facilities: newRoomData.facilities || [],
        description: newRoomData.description || '',
        layoutCols: layoutCols,
        layoutRows: layoutRows,
        roomDimensions: newRoomData.roomDimensions || `${dimensions.width}x${dimensions.height} ft`,
        dimensions: dimensions,
        customCots: finalCots
      };

      if (isEditMode && editingRoom) {
        console.log('🔄 Updating room:', editingRoom.id || editingRoom.room_id, roomDataToSubmit);

        try {
          // Get the room ID (could be 'id' or 'room_id' depending on data structure)
          const roomId = editingRoom.id || editingRoom.room_id || editingRoom.roomId;

          if (!roomId) {
            throw new Error('Room ID not found for update');
          }

          console.log('🏗️ Updating room with ID:', roomId);
          console.log('📝 Room update data:', roomDataToSubmit);

          // Call the updateRoom API function
          const updatedRoom = await updateRoom(roomId, roomDataToSubmit, authToken);

          console.log('✅ Room updated successfully:', updatedRoom);
          showSuccess('Room updated successfully! 🏠✨', 4000);

          // Refresh the rooms list to show updated data
          await fetchRooms();

        } catch (updateError) {
          console.error('❌ Failed to update room:', updateError);
          showError(`Failed to update room: ${updateError.message || 'Unknown error'} ❌`);
          return; // Don't close modal if update failed
        }
      } else {
        console.log('🏗️ Creating new room with form data:');
        console.log('  Form Data:', newRoomData);
        console.log('  Final Cots:', finalCots);
        console.log('  Calculated Dimensions:', dimensions);
        console.log('  Room Data to Submit:', roomDataToSubmit);
        console.log('🔄 Calling addRoom function...');

        await addRoom(roomDataToSubmit);
        showSuccess('Room created successfully! 🏠', 4000);
      }

      handleCloseModal();
    } catch (error) {
      console.error('Failed to create/update room:', error);
      showError('Failed to create/update room. Please try again. ❌');
    }
  };

  const filteredRooms = useMemo(() => {
    if (!rooms || !Array.isArray(rooms)) {
      console.log('Rooms is not an array:', rooms);

      return [];
    }

    return rooms.filter(room => {
      if (!room) return false;

      const roomNumber = room.roomNumber || room.room_number || room.number || '';
      const roomType = room.type || room.room_type || '';
      const roomFloor = room.floor || room.floor_number || '';
      const roomGender = room.gender || room.gender_preference || '';

      const searchMatch = roomNumber.toString().toLowerCase().includes(searchTerm.toLowerCase());
      const typeMatch = typeFilter === 'All' || roomType === typeFilter;
      const genderMatch = genderFilter === 'All' || roomGender.toLowerCase() === genderFilter.toLowerCase();

      // Simplified and corrected floor filtering logic
      const floorFilterMatch = floorFilter === 'All' || roomFloor.toString().toLowerCase() === floorFilter.toLowerCase();

      // Gender-based floor access validation
      let isFloorAllowedForGender = true;
      const roomFloorLower = roomFloor.toString().toLowerCase();

      if (genderFilter === 'Male') {
        const maleAllowedFloors = ['ground', 'first', 'second', '0', '1', '2'];
        isFloorAllowedForGender = maleAllowedFloors.some(floor => roomFloorLower.includes(floor));
      } else if (genderFilter === 'Female') {
        const femaleAllowedFloors = ['ground', 'first', 'second', 'third', 'fourth', '0', '1', '2', '3', '4'];
        isFloorAllowedForGender = femaleAllowedFloors.some(floor => roomFloorLower.includes(floor));
      }

      return searchMatch && typeMatch && genderMatch && floorFilterMatch && isFloorAllowedForGender;
    });
  }, [rooms, searchTerm, typeFilter, floorFilter, genderFilter]);

  const roomTypes = useMemo(() => ['All', 'Normal', 'Deluxe', 'Super Deluxe'], []);

  const floors = useMemo(() => {
    // Gender-based floor restrictions
    if (genderFilter === 'Male') {
      return ['All', 'Ground', 'First', 'Second'];
    } else if (genderFilter === 'Female') {
      return ['All', 'Ground', 'First', 'Second', 'Third', 'Fourth'];
    } else {
      // When no gender filter, show all available floors
      return ['All', 'Ground', 'First', 'Second', 'Third', 'Fourth'];
    }
  }, [genderFilter]);

  const genders = useMemo(() => ['All', 'Male', 'Female'], []);
  const facilitiesList = ['Fan', 'AC', 'Attached Bathroom', 'Shared Bathroom', 'Study Desk', 'Wardrobe', 'Wifi', 'Balcony'];


  return (
    <div className="space-y-6">
      {/* Debug Panel */}


      <Card>
        <div className="flex flex-col lg:flex-row gap-4 mb-4">
          <div className="flex-grow lg:flex-grow-0 lg:w-1/3">
            <Input
              placeholder="Search by room number..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex flex-col sm:flex-row gap-4 lg:flex-grow">
            <div className="flex-1 sm:max-w-48">
              <Select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
                {roomTypes.map(t => <option key={t} value={t}>{t === 'All' ? 'All Types' : t}</option>)}
              </Select>
            </div>
            <div className="flex-1 sm:max-w-48">
              <Select value={genderFilter} onChange={(e) => setGenderFilter(e.target.value)}>
                {genders.map(g => <option key={g} value={g}>{g === 'All' ? 'All Genders' : g}</option>)}
              </Select>
            </div>
            <div className="flex-1 sm:max-w-48">
              <Select value={floorFilter} onChange={(e) => setFloorFilter(e.target.value)}>
                {floors.map(f => <option key={f} value={f}>{f === 'All' ? 'All Floors' : f}</option>)}
              </Select>
            </div>
            <div className="flex flex-col sm:flex-row gap-4 justify-end">
              <Button variant="primary" onClick={() => setIsModalOpen(true)} leftIcon={<PlusCircle className="w-4 h-4" />}>
                Create New Room
              </Button>
              <Button variant="secondary" onClick={handleRefreshRooms} leftIcon={<RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />} disabled={isLoading}>
                {isLoading ? 'Loading...' : 'Refresh'}
              </Button>
            </div>
          </div>
        </div>

      </Card>

      <Card>
        <h2 className="text-lg font-bold text-text-dark mb-4">Room List ({filteredRooms.length})</h2>
        <Table headers={['Room No', 'Type', 'Floor', 'Occupancy', 'Price/Year', 'Gender', 'Status', 'Actions']}>
          {filteredRooms.map((room, index) => (
            <TableRow key={room.id || room._id || index}>
              <TableCell className="font-semibold text-text-dark">
                {room.roomNumber || room.room_number || room.number || 'N/A'}
              </TableCell>
              <TableCell>{room.type || room.room_type || 'N/A'}</TableCell>
              <TableCell>{room.floor || room.floor_number || 'N/A'}</TableCell>
              <TableCell>
                {(() => {
                  const occupancy = calculateRoomOccupancy(room);
                  return (
                    <div className="flex flex-col">
                      <span className="font-medium">
                        {occupancy.occupiedCots}/{occupancy.totalCapacity} cots
                      </span>
                      <span className="text-xs text-gray-500">
                        {occupancy.occupancyRate}% occupied
                      </span>
                    </div>
                  );
                })()
                }
              </TableCell>
              <TableCell>
                ₹{(room.pricePerYear || room.price_per_year || room.price || 0).toLocaleString()}
              </TableCell>
              <TableCell>{room.genderPreference || room.gender_preference || room.gender || 'N/A'}</TableCell>
              <TableCell><StatusTag status={room.status || 'Available'} /></TableCell>
              <TableCell>
                <div className="flex gap-2">
                  <Button
                    variant="secondary"
                    className="!p-2"
                    title="Edit Room"
                    onClick={() => handleEditRoom(room)}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="danger"
                    className="!p-2"
                    title="Delete Room"
                    onClick={() => handleDeleteRoom(room)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </Table>
        {filteredRooms.length === 0 && (
          <div className="text-center p-8">
            {!isAuthenticated ? (
              <p className="text-red-600 font-medium"> Not authenticated. Please log in to view rooms.</p>
            ) : isLoading ? (
              <p className="text-blue-600 font-medium"> Loading rooms...</p>
            ) : !rooms || rooms.length === 0 ? (
              <div className="space-y-2">
                <p className="text-orange-600 font-medium"> No rooms found in the system.</p>
                <p className="text-sm text-gray-500">This could indicate an API connectivity issue or that no rooms have been created yet.</p>
                <Button variant="primary" onClick={handleRefreshRooms} className="mt-2">
                  Retry Loading Rooms
                </Button>
              </div>
            ) : (
              <p className="text-text-medium">No rooms match your current filters.</p>
            )}
          </div>
        )}
      </Card>

      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={isEditMode ? `Edit Room ${editingRoom?.roomNumber || editingRoom?.room_number || ''}` : "Create New Room"}
        footer={
          <>
            <Button variant="secondary" onClick={handleCloseModal}>Cancel</Button>
            <Button variant="primary" onClick={handleCreateRoom}>
              {isEditMode ? 'Update Room' : 'Create Room'}
            </Button>
          </>
        }>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
          <Input
            label="Room Number*"
            name="roomNumber"
            value={newRoomData.roomNumber || ''}
            onChange={handleInputChange}
          />
          <Input
            label="Floor*"
            name="floor"
            value={newRoomData.floor || ''}
            onChange={handleInputChange}
          />
          <Select
            label="Room Type*"
            name="type"
            value={newRoomData.type || ''}
            onChange={handleInputChange}
          >
            <option value="" disabled>Select type</option>
            <option value="Normal">Normal</option>
            <option value="Deluxe">Deluxe</option>
            <option value="Super Deluxe">Super Deluxe</option>
          </Select>
          <Input
            label="Total Cots*"
            name="totalCots"
            type="number"
            min="1"
            max="12"
            value={newRoomData.totalCots || ''}
            onChange={handleInputChange}
          />
          <Input
            label="Layout Columns"
            name="layoutCols"
            type="number"
            min="1"
            max="6"
            value={newRoomData.layoutCols || ''}
            placeholder={`Max: ${calculateLayoutFromDimensions().maxCols} (based on dimensions)`}
            onChange={handleInputChange}
          />
          <Input
            label="Layout Rows"
            name="layoutRows"
            type="number"
            min="1"
            max="4"
            value={newRoomData.layoutRows || ''}
            placeholder={`Max: ${calculateLayoutFromDimensions().maxRows} (based on dimensions)`}
            onChange={handleInputChange}
          />
          <Input
            label="Price per Year*"
            name="pricePerYear"
            type="number"
            value={newRoomData.pricePerYear || ''}
            onChange={handleInputChange}
          />
          <Input
            label="Advance Amount*"
            name="advanceAmount"
            type="number"
            value={newRoomData.advanceAmount || ''}
            onChange={handleInputChange}
          />
          <Select
            label="Gender Preference*"
            name="genderPreference"
            value={newRoomData.genderPreference || ''}
            onChange={handleInputChange}
          >
            <option value="" disabled>Select preference</option>
            <option value="Mixed">Mixed</option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
          </Select>
          <Input
            label="Room Dimensions (e.g. 10x12)"
            name="roomDimensions"
            value={newRoomData.roomDimensions || ''}
            onChange={handleInputChange}
          />
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-text-medium mb-1.5">Facilities</label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 p-4 bg-slate-100 rounded-lg shadow-soft-ui-inset">
              {facilitiesList.map(facility => (
                <Checkbox
                  key={facility}
                  label={facility}
                  name={facility}
                  checked={newRoomData.facilities?.includes(facility) || false}
                  onChange={handleCheckboxChange}
                />
              ))}
            </div>
          </div>
          <div className="md:col-span-2">
            <label htmlFor="description" className="block text-sm font-medium text-text-medium mb-1.5">Description</label>
            <textarea
              id="description"
              name="description"
              rows={3}
              value={newRoomData.description || ''}
              onChange={handleInputChange}
              className="w-full px-4 py-3 bg-slate-100 rounded-xl shadow-soft-ui-inset focus:outline-none focus:ring-2 focus:ring-primary-purple transition-all"
            />
          </div>

          {/* Interactive Room Layout Editor */}
          {(() => {
            try {
              const layoutPreview = getLayoutPreview();
              return layoutPreview && (
                <div className="md:col-span-2">
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-medium text-text-medium">Room Layout Editor</label>
                    <Button variant="secondary" onClick={resetLayout} className="text-xs !py-1 !px-2">
                      Reset Layout
                    </Button>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-lg border">
                    {/* Room dimensions info */}
                    <div className="mb-3 text-xs text-gray-600">
                      <p>Room: {layoutPreview.dimensions.width}×{layoutPreview.dimensions.height} units</p>
                      <p>Grid: {layoutPreview.layoutCols} columns × {layoutPreview.layoutRows} rows</p>
                      <p className="text-blue-600 font-medium">💡 Click and drag cots to reposition them</p>
                      <p className="text-purple-600 font-medium">📍 Position format: (Column, Row) → API: (pos_x, pos_y)</p>
                    </div>

                    {/* Interactive grid */}
                    <div
                      className="grid gap-1 mx-auto bg-white border-2 border-dashed border-gray-300 p-2 rounded relative"
                      style={{
                        gridTemplateColumns: `repeat(${getLayoutPreview().layoutCols}, 50px)`,
                        gridTemplateRows: `repeat(${getLayoutPreview().layoutRows}, 50px)`,
                        width: 'fit-content'
                      }}
                      onDragOver={(e) => {
                        e.preventDefault();
                        e.dataTransfer.dropEffect = 'move';
                      }}
                      onDrop={(e) => {
                        try {
                          e.preventDefault();
                          const dataString = e.dataTransfer.getData('text/plain');
                          if (!dataString) {
                            console.warn('No drag data received');
                            return;
                          }

                          const data = JSON.parse(dataString);
                          if (!data || typeof data.cotNumber !== 'number') {
                            console.warn('Invalid drag data:', data);
                            return;
                          }

                          const gridRect = e.currentTarget.getBoundingClientRect();

                          // Calculate new position based on drop location
                          const cellWidth = 52; // 50px + 2px gap
                          const cellHeight = 52;
                          const newX = Math.floor((e.clientX - gridRect.left - 8) / cellWidth);
                          const newY = Math.floor((e.clientY - gridRect.top - 8) / cellHeight);

                          const layoutPreview = getLayoutPreview();
                          if (!layoutPreview) {
                            console.warn('No layout preview available');
                            return;
                          }

                          // Ensure position is within bounds
                          const clampedX = Math.max(0, Math.min(newX, layoutPreview.layoutCols - 1));
                          const clampedY = Math.max(0, Math.min(newY, layoutPreview.layoutRows - 1));

                          console.log(`🎯 Drag & Drop: Cot ${data.cotNumber} from (${data.fromX}, ${data.fromY}) to (${clampedX}, ${clampedY})`);

                          if (clampedX !== data.fromX || clampedY !== data.fromY) {
                            // Check if position is already occupied
                            const isOccupied = layoutPreview.cots.some(cot =>
                              cot && cot.x === clampedX && cot.y === clampedY && cot.number !== data.cotNumber
                            );

                            if (!isOccupied) {
                              console.log(`✅ Position (${clampedX}, ${clampedY}) is available for Cot ${data.cotNumber}`);
                              handleCotPositionChange(data.cotNumber, clampedX, clampedY);
                            } else {
                              console.log(`❌ Position (${clampedX}, ${clampedY}) is already occupied!`);
                            }
                          } else {
                            console.log(`↩️ Cot ${data.cotNumber} dropped at same position`);
                          }
                        } catch (error) {
                          console.error('Error in onDrop handler:', error);
                        }
                      }}
                    >
                      {/* Grid cells as drop zones */}
                      {Array.from({ length: getLayoutPreview().layoutCols * getLayoutPreview().layoutRows }).map((_, index) => {
                        const x = index % getLayoutPreview().layoutCols;
                        const y = Math.floor(index / getLayoutPreview().layoutCols);
                        const hasCot = getLayoutPreview().cots.some(cot => cot.x === x && cot.y === y);

                        return (
                          <div
                            key={`cell-${x}-${y}`}
                            className={`border border-gray-200 rounded transition-colors ${!hasCot ? 'bg-gray-50 hover:bg-blue-50 cursor-pointer' : 'bg-transparent'
                              }`}
                            style={{
                              gridColumn: x + 1,
                              gridRow: y + 1,
                              minHeight: '48px',
                              minWidth: '48px'
                            }}
                            onClick={() => {
                              try {
                                if (!hasCot) {
                                  const layoutPreview = getLayoutPreview();
                                  if (!layoutPreview) return;

                                  // Find first available cot to place here
                                  const availableCots = [];
                                  const totalCots = Number(newRoomData.totalCots) || 0;

                                  for (let i = 1; i <= totalCots; i++) {
                                    const cotAtDefaultPos = layoutPreview.cots.find(c => c && c.number === i);
                                    if (!cotAtDefaultPos || (cotAtDefaultPos.x === undefined && cotAtDefaultPos.y === undefined)) {
                                      availableCots.push(i);
                                    }
                                  }

                                  if (availableCots.length > 0) {
                                    handleCotPositionChange(availableCots[0], x, y);
                                  }
                                }
                              } catch (error) {
                                console.error('Error in cell click handler:', error);
                              }
                            }}
                          />
                        );
                      })}

                      {/* Draggable cots */}
                      {getLayoutPreview().cots.map(cot => (
                        <div
                          key={`cot-${cot.number}`}
                          className="bg-green-100 border-2 border-green-400 rounded flex flex-col items-center justify-center text-xs font-bold text-green-700 cursor-move hover:bg-green-200 hover:shadow-md transition-all z-10"
                          style={{
                            gridColumn: cot.x + 1,
                            gridRow: cot.y + 1,
                            minHeight: '48px',
                            minWidth: '48px'
                          }}
                          draggable={true}
                          onDragStart={(e) => {
                            try {
                              e.dataTransfer.effectAllowed = 'move';
                              const dragData = {
                                cotNumber: cot.number,
                                fromX: cot.x,
                                fromY: cot.y
                              };
                              e.dataTransfer.setData('text/plain', JSON.stringify(dragData));
                              e.currentTarget.style.opacity = '0.5';
                            } catch (error) {
                              console.error('Error in onDragStart handler:', error);
                            }
                          }}
                          onDragEnd={(e) => {
                            try {
                              e.currentTarget.style.opacity = '1';
                            } catch (error) {
                              console.error('Error in onDragEnd handler:', error);
                            }
                          }}
                          title={`Cot ${cot.number} - Position: Column ${cot.x}, Row ${cot.y} (pos_x: ${cot.x}, pos_y: ${cot.y}) - Click and drag to move`}
                        >
                          <span className="text-lg">🛏️</span>
                          <span className="text-xs font-bold">{cot.number}</span>
                        </div>
                      ))}
                    </div>

                    {/* Layout stats */}
                    <div className="mt-3 text-xs text-gray-600 flex justify-between">
                      <span>Total Cots: {layoutPreview.cots.length}</span>
                      <span>Available Spaces: {(layoutPreview.layoutCols * layoutPreview.layoutRows) - layoutPreview.cots.length}</span>
                    </div>
                  </div>
                </div>
              );
            } catch (error) {
              console.error('Error rendering layout preview:', error);
              return (
                <div className="md:col-span-2">
                  <div className="p-4 bg-red-50 rounded-lg border border-red-200">
                    <p className="text-red-600 text-sm">Error loading room layout editor. Please check your room settings.</p>
                  </div>
                </div>
              );
            }
          })()}
        </div>
      </Modal>
    </div>
  );
};

export default RoomManagement;
