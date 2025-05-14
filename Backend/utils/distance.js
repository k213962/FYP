// Calculate distance between two points using Haversine formula
function calculateDistance(coords1, coords2) {
    const R = 6371; // Earth's radius in kilometers
    const lat1 = coords1[1] * Math.PI / 180;
    const lat2 = coords2[1] * Math.PI / 180;
    const deltaLat = (coords2[1] - coords1[1]) * Math.PI / 180;
    const deltaLon = (coords2[0] - coords1[0]) * Math.PI / 180;

    const a = Math.sin(deltaLat/2) * Math.sin(deltaLat/2) +
              Math.cos(lat1) * Math.cos(lat2) *
              Math.sin(deltaLon/2) * Math.sin(deltaLon/2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c;

    return distance;
}

module.exports = calculateDistance; 