/**
 * Route Optimization Utility
 * Uses nearest-neighbor algorithm to create an efficient tour route
 */

/**
 * Calculate Haversine distance between two coordinates
 * @param {Object} coord1 - {latitude, longitude}
 * @param {Object} coord2 - {latitude, longitude}
 * @returns {number} Distance in meters
 */
export const calculateDistance = (coord1, coord2) => {
  const EARTH_RADIUS = 6371000; // meters
  const dLat = ((coord2.latitude - coord1.latitude) * Math.PI) / 180;
  const dLng = ((coord2.longitude - coord1.longitude) * Math.PI) / 180;
  
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((coord1.latitude * Math.PI) / 180) *
      Math.cos((coord2.latitude * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return EARTH_RADIUS * c;
};

/**
 * Optimize route using nearest-neighbor algorithm
 * Starts from user location and finds the nearest unvisited site at each step
 * 
 * @param {Object} userLocation - {latitude, longitude}
 * @param {Array} sites - Array of site objects with latitude/longitude
 * @param {Set} visitedSites - Set of visited site IDs
 * @returns {Array} Optimized array of sites with original indices
 */
export const optimizeRoute = (userLocation, sites, visitedSites = new Set()) => {
  if (!userLocation || !sites || sites.length === 0) {
    return sites.map((site, index) => ({ ...site, originalIndex: index }));
  }

  // Filter out visited sites
  const unvisitedSites = sites
    .map((site, index) => ({ ...site, originalIndex: index }))
    .filter(site => !visitedSites.has(site._id));

  if (unvisitedSites.length === 0) {
    return sites.map((site, index) => ({ ...site, originalIndex: index }));
  }

  const optimizedRoute = [];
  let currentLocation = userLocation;
  const remainingSites = [...unvisitedSites];

  // Nearest-neighbor algorithm
  while (remainingSites.length > 0) {
    let nearestIndex = 0;
    let minDistance = Infinity;

    // Find nearest site from current location
    remainingSites.forEach((site, index) => {
      const distance = calculateDistance(currentLocation, {
        latitude: site.latitude,
        longitude: site.longitude
      });

      if (distance < minDistance) {
        minDistance = distance;
        nearestIndex = index;
      }
    });

    // Add nearest site to route
    const nearestSite = remainingSites[nearestIndex];
    optimizedRoute.push(nearestSite);

    // Update current location to the site we just added
    currentLocation = {
      latitude: nearestSite.latitude,
      longitude: nearestSite.longitude
    };

    // Remove from remaining sites
    remainingSites.splice(nearestIndex, 1);
  }

  // Add visited sites at the end (maintaining their original order)
  const visitedSitesArray = sites
    .map((site, index) => ({ ...site, originalIndex: index }))
    .filter(site => visitedSites.has(site._id))
    .sort((a, b) => a.originalIndex - b.originalIndex);

  return [...optimizedRoute, ...visitedSitesArray];
};

/**
 * Get the next unvisited site from the optimized route
 * 
 * @param {Array} optimizedSites - Array of optimized sites
 * @param {Set} visitedSites - Set of visited site IDs
 * @returns {Object|null} Next site object or null if all visited
 */
export const getNextSite = (optimizedSites, visitedSites = new Set()) => {
  return optimizedSites.find(site => !visitedSites.has(site._id)) || null;
};

/**
 * Calculate total route distance
 * 
 * @param {Object} userLocation - {latitude, longitude}
 * @param {Array} sites - Array of site objects
 * @returns {number} Total distance in meters
 */
export const calculateTotalDistance = (userLocation, sites) => {
  if (!userLocation || !sites || sites.length === 0) return 0;

  let totalDistance = 0;
  let currentLocation = userLocation;

  sites.forEach(site => {
    const distance = calculateDistance(currentLocation, {
      latitude: site.latitude,
      longitude: site.longitude
    });
    totalDistance += distance;
    currentLocation = {
      latitude: site.latitude,
      longitude: site.longitude
    };
  });

  return totalDistance;
};
