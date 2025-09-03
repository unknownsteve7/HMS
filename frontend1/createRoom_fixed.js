// API URL - should match your current backend
const API_URL = 'https://derek-invited-cook-mills.trycloudflare.com';

// Helper function to get all facilities
const getAllFacilities = async (authToken) => {
  const headers = {
    'Content-Type': 'application/json'
  };
  if (authToken) {
    headers['Authorization'] = `Bearer ${authToken}`;
  }

  const response = await fetch(`${API_URL}/facilities`, {
    method: 'GET',
    headers
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch facilities: ${response.status}`);
  }

  return await response.json();
};

// Fixed createRoom function that matches exact POST format
export const createRoom = async (roomData, authToken = null) => {
  console.log('🔍 RAW roomData received by createRoom:', roomData);
  console.log('🔍 roomData keys:', Object.keys(roomData));
  console.log('🔍 roomData values breakdown:');
  Object.entries(roomData).forEach(([key, value]) => {
    console.log(`    ${key}:`, value, `(type: ${typeof value})`);
  });

  const headers = {
    'Content-Type': 'application/json'
  };
  if (authToken) {
    headers['Authorization'] = `Bearer ${authToken}`;
  }

  // Transform cots data to match backend format
  const cotsData = roomData.cots || roomData.customCots || [];
  console.log('🛏️ Cots data before transformation:', cotsData);

  if (!Array.isArray(cotsData)) {
    console.error('❌ Cots data is not an array:', cotsData);
    throw new Error('Invalid cots data format');
  }

  const transformedCots = cotsData.map((cot, index) => {
    if (!cot || typeof cot.number !== 'number') {
      console.error(`❌ Invalid cot at index ${index}:`, cot);
      throw new Error(`Invalid cot data at index ${index}`);
    }

    const cotData = {
      cot_number: cot.number,
      pos_x: typeof cot.x === 'number' ? cot.x : 0, // Column position
      pos_y: typeof cot.y === 'number' ? cot.y : 0  // Row position
    };
    console.log(`🛏️ Cot ${cot.number}: Column ${cot.x}, Row ${cot.y} → pos_x: ${cotData.pos_x}, pos_y: ${cotData.pos_y}`);
    return cotData;
  });

  console.log('🛏️ Transformed cots with coordinates:', transformedCots);

  // Fetch facilities dynamically from API to create name-to-ID mapping
  let facilityNameToId = {};
  try {
    console.log('🏢 Fetching facilities from API...');
    const facilities = await getAllFacilities(authToken);
    
    if (Array.isArray(facilities)) {
      // Create mapping from facility_name to facility_id
      facilityNameToId = facilities.reduce((mapping, facility) => {
        if (facility.facility_name && facility.facility_id) {
          mapping[facility.facility_name] = facility.facility_id;
        }
        return mapping;
      }, {});
      
      console.log('🏢 Dynamic facility mapping created:', facilityNameToId);
    } else {
      console.warn('⚠️ Facilities API returned non-array data:', facilities);
    }
  } catch (error) {
    console.error('❌ Failed to fetch facilities, using empty mapping:', error);
    // Continue with empty mapping - will warn about unknown facilities later
  }

  // Convert facility names to facility IDs
  let facilitiesArray = [];
  if (roomData.facilities) {
    if (Array.isArray(roomData.facilities)) {
      // Map facility names to IDs
      facilitiesArray = roomData.facilities
        .map(facilityName => {
          // If it's already an ID (UUID format), use it directly
          if (typeof facilityName === 'string' && facilityName.includes('-')) {
            return facilityName;
          }
          // Otherwise, map name to ID
          const facilityId = facilityNameToId[facilityName];
          if (!facilityId) {
            console.warn(`⚠️ Unknown facility name: ${facilityName}`);
            return null;
          }
          return facilityId;
        })
        .filter(Boolean); // Remove null values
    } else if (typeof roomData.facilities === 'object') {
      // If it's an object with facility IDs as keys or values
      facilitiesArray = Object.values(roomData.facilities)
        .map(facilityName => facilityNameToId[facilityName] || facilityName)
        .filter(Boolean);
    }
  }
  
  console.log('🏢 Facilities processing:', {
    original: roomData.facilities,
    nameToIdMapping: facilityNameToId,
    processed: facilitiesArray,
    isArray: Array.isArray(facilitiesArray)
  });

  // Create JSON payload matching the EXACT required format
  const payload = {
    room_number: roomData.roomNumber,
    floor: roomData.floor,
    room_type: roomData.type,
    price_per_year: parseFloat(roomData.pricePerYear),
    gender_preference: roomData.genderPreference,
    room_dimensions: roomData.roomDimensions || `${roomData.dimensions?.width || 12}x${roomData.dimensions?.height || 8} ft`,
    description: roomData.description || '',
    layout_rows: parseInt(roomData.layoutRows) || 2,
    layout_cols: parseInt(roomData.layoutCols) || 2,
    total_cots: transformedCots.length, // Calculate from cots array
    cots: transformedCots,
    facilities: facilitiesArray  // Use processed facility IDs, not raw roomData.facilities
  };

  console.log('⚠️ PAYLOAD VALIDATION:');
  console.log('  ✓ room_number:', payload.room_number || '❌ MISSING');
  console.log('  ✓ floor:', payload.floor || '❌ MISSING');
  console.log('  ✓ room_type:', payload.room_type || '❌ MISSING');
  console.log('  ✓ price_per_year:', payload.price_per_year || '❌ MISSING');
  console.log('  ✓ gender_preference:', payload.gender_preference || '❌ MISSING');
  console.log('  ✓ room_dimensions:', payload.room_dimensions || '❌ MISSING');
  console.log('  ✓ description:', payload.description !== undefined ? payload.description : '❌ MISSING');
  console.log('  ✓ layout_rows:', payload.layout_rows || '❌ MISSING');
  console.log('  ✓ layout_cols:', payload.layout_cols || '❌ MISSING');
  console.log('  ✓ total_cots:', payload.total_cots || '❌ MISSING');
  console.log('  ✓ cots array length:', payload.cots?.length || '❌ MISSING');
  console.log('  ✓ facilities array length:', payload.facilities?.length || '❌ MISSING');

  console.log('📋 Final Payload for POST /rooms:');
  console.log('  Room Number:', payload.room_number);
  console.log('  Floor:', payload.floor);
  console.log('  Room Type:', payload.room_type);
  console.log('  Price per Year:', payload.price_per_year);
  console.log('  Gender Preference:', payload.gender_preference);
  console.log('  Room Dimensions:', payload.room_dimensions);
  console.log('  Description:', payload.description);
  console.log('  Layout (Cols x Rows):', `${payload.layout_cols} x ${payload.layout_rows}`);
  console.log('  Total Cots:', payload.total_cots);
  console.log('  Facilities (IDs):', payload.facilities);
  console.log('  Cots Array:', payload.cots);
  console.log('🚀 Sending POST to:', `${API_URL}/rooms`);

  try {
    const response = await fetch(`${API_URL}/rooms`, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }

    const result = await response.json();
    console.log('✅ Room created successfully:', result);
    return result;
  } catch (error) {
    console.error('❌ Failed to create room:', error);
    throw error;
  }
};
