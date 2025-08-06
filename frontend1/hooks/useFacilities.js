import { useState, useEffect } from 'react';
import { getAllFacilities } from '../apiService';

// Custom hook to manage facility data and provide ID-to-name mapping
export const useFacilities = () => {
  const [facilities, setFacilities] = useState([]);
  const [facilityIdToName, setFacilityIdToName] = useState({});
  const [facilityNameToId, setFacilityNameToId] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchFacilities = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const authToken = localStorage.getItem('authToken');
        if (!authToken) {
          console.warn('No auth token found, skipping facilities fetch');
          setLoading(false);
          return;
        }

        console.log('🏢 Fetching facilities for mapping...');
        const facilitiesData = await getAllFacilities(authToken);
        
        if (Array.isArray(facilitiesData)) {
          setFacilities(facilitiesData);
          
          // Create ID-to-name mapping
          const idToName = {};
          const nameToId = {};
          
          facilitiesData.forEach(facility => {
            if (facility.facility_id && facility.facility_name) {
              idToName[facility.facility_id] = facility.facility_name;
              nameToId[facility.facility_name] = facility.facility_id;
            }
          });
          
          setFacilityIdToName(idToName);
          setFacilityNameToId(nameToId);
          
          console.log('✅ Facility mappings created:', {
            totalFacilities: facilitiesData.length,
            idToNameCount: Object.keys(idToName).length,
            nameToIdCount: Object.keys(nameToId).length,
            sampleMapping: Object.entries(idToName).slice(0, 3)
          });
        } else {
          console.warn('⚠️ Facilities API returned non-array data:', facilitiesData);
        }
      } catch (err) {
        console.error('❌ Failed to fetch facilities:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchFacilities();
  }, []);

  // Helper function to get facility name from ID
  const getFacilityName = (facilityId) => {
    if (!facilityId) return null;
    return facilityIdToName[facilityId] || facilityId; // Fallback to ID if name not found
  };

  // Helper function to get facility ID from name
  const getFacilityId = (facilityName) => {
    if (!facilityName) return null;
    return facilityNameToId[facilityName] || facilityName; // Fallback to name if ID not found
  };

  // Helper function to map array of facility IDs to names
  const mapFacilityIdsToNames = (facilityIds) => {
    if (!Array.isArray(facilityIds)) return [];
    return facilityIds.map(id => getFacilityName(id)).filter(Boolean);
  };

  // Helper function to map array of facility names to IDs
  const mapFacilityNamesToIds = (facilityNames) => {
    if (!Array.isArray(facilityNames)) return [];
    return facilityNames.map(name => getFacilityId(name)).filter(Boolean);
  };

  return {
    facilities,
    facilityIdToName,
    facilityNameToId,
    loading,
    error,
    getFacilityName,
    getFacilityId,
    mapFacilityIdsToNames,
    mapFacilityNamesToIds
  };
};

export default useFacilities;
