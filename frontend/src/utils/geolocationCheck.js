import booleanPointInPolygon from '@turf/boolean-point-in-polygon';
import { point } from '@turf/helpers';

/**
 * Check if a user's location is within the Intramuros boundaries
 * @param {Object} userLocation - User's current location {latitude, longitude}
 * @param {Object} maskGeometry - The Intramuros polygon geometry from the database
 * @returns {boolean} - True if user is inside Intramuros, false otherwise
 */
export const isUserWithinIntramuros = (userLocation, maskGeometry) => {
  if (!userLocation || !maskGeometry) {
    return false;
  }

  try {
    // Create a point from user's location
    const userPoint = point([userLocation.longitude, userLocation.latitude]);
    
    // Create polygon from mask geometry
    const intramurosPoly = {
      type: 'Feature',
      geometry: maskGeometry
    };
    
    // Check if point is inside polygon
    return booleanPointInPolygon(userPoint, intramurosPoly);
  } catch (error) {
    console.error('Error checking if user is within Intramuros:', error);
    return false;
  }
};
