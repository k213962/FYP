const Driver = require('../models/driver.model');
const Emergency = require('../models/emergency.model');
const { calculateDistance } = require('../utils/locationUtils');

class EmergencyDispatchService {
  // Step 1 & 2: Analyze emergency request and determine required services
  static analyzeEmergencyDetails(description) {
    const services = new Set();
    const descriptionLower = description.toLowerCase();

    // Check for fire-related keywords
    if (descriptionLower.includes('fire') || descriptionLower.includes('burning') || 
        descriptionLower.includes('smoke') || descriptionLower.includes('flame')) {
      services.add('fire');
    }

    // Check for medical-related keywords
    if (descriptionLower.includes('injured') || descriptionLower.includes('bleeding') || 
        descriptionLower.includes('unconscious') || descriptionLower.includes('medical') ||
        descriptionLower.includes('ambulance') || descriptionLower.includes('emergency')) {
      services.add('ambulance');
    }

    // Check for police-related keywords
    if (descriptionLower.includes('robbery') || descriptionLower.includes('violence') || 
        descriptionLower.includes('gun') || descriptionLower.includes('crime') ||
        descriptionLower.includes('police') || descriptionLower.includes('theft')) {
      services.add('police');
    }

    return Array.from(services);
  }

  // Step 3 & 4: Find nearest available drivers for each service
  static async findNearestDrivers(emergencyLocation, requiredServices) {
    const nearestDrivers = {};

    for (const service of requiredServices) {
      // Find all available drivers for this service
      const availableDrivers = await Driver.find({
        serviceType: service,
        status: 'available',
        isActive: true
      });

      if (availableDrivers.length === 0) {
        nearestDrivers[service] = null;
        continue;
      }

      // Calculate distance for each driver and find the nearest
      const driversWithDistance = availableDrivers.map(driver => ({
        driver,
        distance: calculateDistance(
          emergencyLocation.latitude,
          emergencyLocation.longitude,
          driver.currentLocation.latitude,
          driver.currentLocation.longitude
        )
      }));

      // Sort by distance and get the nearest driver
      driversWithDistance.sort((a, b) => a.distance - b.distance);
      nearestDrivers[service] = driversWithDistance[0].driver;
    }

    return nearestDrivers;
  }

  // Step 5: Assign drivers and create dispatch tasks
  static async assignDrivers(emergencyId, nearestDrivers) {
    const dispatchResults = {
      assigned: [],
      failed: []
    };

    for (const [service, driver] of Object.entries(nearestDrivers)) {
      if (!driver) {
        dispatchResults.failed.push(service);
        continue;
      }

      try {
        // Update driver status
        await Driver.findByIdAndUpdate(driver._id, {
          status: 'busy',
          currentEmergency: emergencyId
        });

        // Create dispatch record
        const dispatch = await Emergency.findByIdAndUpdate(
          emergencyId,
          {
            $push: {
              assignedDrivers: {
                driverId: driver._id,
                serviceType: service,
                assignedAt: new Date()
              }
            }
          },
          { new: true }
        );

        dispatchResults.assigned.push({
          service,
          driverId: driver._id,
          dispatchId: dispatch._id
        });

      } catch (error) {
        console.error(`Failed to assign ${service} driver:`, error);
        dispatchResults.failed.push(service);
      }
    }

    return dispatchResults;
  }

  // Main dispatch function that orchestrates the entire process
  static async handleEmergencyDispatch(emergencyData) {
    try {
      // Step 1 & 2: Analyze emergency details
      const requiredServices = this.analyzeEmergencyDetails(emergencyData.description);
      
      if (requiredServices.length === 0) {
        throw new Error('No emergency services identified from the description');
      }

      // Step 3 & 4: Find nearest drivers
      const nearestDrivers = await this.findNearestDrivers(
        emergencyData.location,
        requiredServices
      );

      // Step 5: Assign drivers and create dispatch tasks
      const dispatchResults = await this.assignDrivers(
        emergencyData._id,
        nearestDrivers
      );

      // Step 6 & 7: Handle results and return status
      return {
        success: true,
        requiredServices,
        dispatchResults,
        message: this.generateDispatchSummary(dispatchResults)
      };

    } catch (error) {
      console.error('Emergency dispatch failed:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Helper function to generate dispatch summary
  static generateDispatchSummary(dispatchResults) {
    const { assigned, failed } = dispatchResults;
    
    let summary = 'Emergency dispatch summary:\n';
    
    if (assigned.length > 0) {
      summary += `Successfully assigned: ${assigned.map(a => a.service).join(', ')}\n`;
    }
    
    if (failed.length > 0) {
      summary += `Failed to assign: ${failed.join(', ')}`;
    }

    return summary;
  }
}

module.exports = EmergencyDispatchService; 