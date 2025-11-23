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
 
  Object.entries(roomData).forEach(([key, value]) => {
  });

  const headers = {
    'Content-Type': 'application/json'
  };
  if (authToken) {
    headers['Authorization'] = `Bearer ${authToken}`;
  }

  // Transform cots data to match backend format
  const cotsData = roomData.cots || roomData.customCots || [];

  if (!Array.isArray(cotsData)) {
    throw new Error('Invalid cots data format');
  }

  const transformedCots = cotsData.map((cot, index) => {
    if (!cot || typeof cot.number !== 'number') {
      throw new Error(`Invalid cot data at index ${index}`);
    }

    const cotData = {
      cot_number: cot.number,
      pos_x: typeof cot.x === 'number' ? cot.x : 0, // Column position
      pos_y: typeof cot.y === 'number' ? cot.y : 0  // Row position
    };
    return cotData;
  });


  // Fetch facilities dynamically from API to create name-to-ID mapping
  let facilityNameToId = {};
  try {
    const facilities = await getAllFacilities(authToken);
    
    if (Array.isArray(facilities)) {
      // Create mapping from facility_name to facility_id
      facilityNameToId = facilities.reduce((mapping, facility) => {
        if (facility.facility_name && facility.facility_id) {
          mapping[facility.facility_name] = facility.facility_id;
        }
        return mapping;
      }, {});
      
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
    return result;
  } catch (error) {
    throw error;
  }
};
