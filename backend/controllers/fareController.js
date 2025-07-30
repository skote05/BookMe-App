import Vehicle from '../models/Vehicle.js';

const calculateFare = (distance, serviceType, appName) => {
  const distanceKm = distance / 1000;
  
  // Different base fares and rates for each app with specializations
  const appRates = {
    'Uber': {
      base: 30,
      perKm: 12,
      multiplier: 1.0,
      // Uber specializes in cabs
      specializations: {
        'cab': 0.9, // 10% cheaper cabs
        'auto': 1.0, // 10% more expensive autos
        'bike': 1.2, // 20% more expensive bikes
      }
    },
    'Ola': {
      base: 35,
      perKm: 12,
      multiplier: 0.95,
      // Ola specializes in autos
      specializations: {
        'auto': 0.8, // 20% cheaper autos
        'cab': 1.1, // 10% more expensive cabs
        'bike': 1.1, // 10% more expensive bikes
      }
    },
    'Rapido': {
      base: 35,
      perKm: 10,
      multiplier: 0.85,
      // Rapido specializes in bikes
      specializations: {
        'bike': 0.7, // 30% cheaper bikes
        'auto': 1.1, // 20% more expensive autos
        'cab': 1.3, // 30% more expensive cabs
      }
    },
    'BlaBlaCar': {
      base: 30,
      perKm: 10,
      multiplier: 0.9,
      // BlaBlaCar specializes in cabs (carpooling)
      specializations: {
        'cab': 0.8, // 20% cheaper cabs
        'auto': 1.3, // 30% more expensive autos
        'bike': 1.4, // 40% more expensive bikes
      }
    }
  };

  const rates = appRates[appName] || appRates['Uber'];
  
  // Service type multipliers
  const serviceMultipliers = {
    'bike': 0.6,
    'auto': 0.8,
    'cab': 1.0
  };

  const serviceMultiplier = serviceMultipliers[serviceType] || 1.0;
  const specializationMultiplier = rates.specializations[serviceType] || 1.0;
  
  // Calculate fare with specialization
  const baseFare = rates.base;
  const distanceFare = distanceKm * rates.perKm;
  const totalFare = (baseFare + distanceFare) * rates.multiplier * serviceMultiplier * specializationMultiplier;
  
  return Math.round(totalFare);
};

const calculatePersonalVehicleCost = (distance, mileage, fuelType) => {
  const distanceKm = distance / 1000;
  
  // Fuel prices (per liter)
  const fuelPrices = {
    'petrol': 96,
    'diesel': 89,
    'electric': 8 // per kWh
  };
  
  const fuelPrice = fuelPrices[fuelType] || 96;
  const mileageKmpl = parseFloat(mileage) || 15;
  
  // Calculate fuel cost
  const fuelConsumed = distanceKm / mileageKmpl;
  const cost = fuelConsumed * fuelPrice;
  
  return Math.round(cost);
};

const getAllServiceFares = (distance) => {
  const apps = [
    { id: 1, name: 'Uber', logo: '🚗' },
    { id: 2, name: 'Ola', logo: '🚕' },
    { id: 3, name: 'Rapido', logo: '🏍️' },
    { id: 4, name: 'BlaBlaCar', logo: '🚙' }
  ];

  return apps.map(app => ({
    id: app.id,
    name: app.name,
    logo: app.logo,
    services: {
      bike: {
        price: calculateFare(distance, 'bike', app.name),
        eta: '5-8 min'
      },
      auto: {
        price: calculateFare(distance, 'auto', app.name),
        eta: '8-12 min'
      },
      cab: {
        price: calculateFare(distance, 'cab', app.name),
        eta: '10-15 min'
      }
    }
  }));
};

const rideServices = [
  { id: 1, name: 'Uber', logo: '🚗' },
  { id: 2, name: 'Ola', logo: '🚕' },
  { id: 3, name: 'Rapido', logo: '🏍️' },
  { id: 4, name: 'BlaBlaCar', logo: '🚙' }
];

const updateServicePrices = (distance) => {
  return rideServices.map(service => ({
    ...service,
    services: {
      bike: {
        price: calculateFare(distance, 'bike', service.name),
        eta: '5-8 min'
      },
      auto: {
        price: calculateFare(distance, 'auto', service.name),
        eta: '8-12 min'
      },
      cab: {
        price: calculateFare(distance, 'cab', service.name),
        eta: '10-15 min'
      }
    }
  }));
};

export const calculateFares = async (req, res) => {
  try {
    const { distance, source, destination } = req.body;

    if (!distance || distance <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Distance is required and must be greater than 0'
      });
    }

    // Get user's vehicle information
    let vehicle = null;
    try {
      const vehicleResponse = await Vehicle.findOne({ user: req.user.id });
      vehicle = vehicleResponse;
    } catch (error) {
      console.error('Error fetching vehicle:', error);
    }

    // Calculate ride service fares
    const rideServices = getAllServiceFares(distance);

    // Calculate personal vehicle cost
    let personalVehicleCost = 0;
    if (vehicle) {
      personalVehicleCost = calculatePersonalVehicleCost(
        distance,
        vehicle.mileage,
        vehicle.fuelType
      );
    }

    res.json({
      success: true,
      data: {
        rideServices,
        personalVehicle: {
          cost: personalVehicleCost,
          vehicle: vehicle
        },
        distance,
        source,
        destination
      }
    });
  } catch (error) {
    console.error('Error calculating fares:', error);
    res.status(500).json({
      success: false,
      message: 'Error calculating fares'
    });
  }
};

export const getFareRates = async (req, res) => {
  try {
    res.json({
      success: true,
      data: {
        apps: rideServices,
        baseRates: {
          'Uber': { base: 40, perKm: 12 },
          'Ola': { base: 35, perKm: 11 },
          'Rapido': { base: 30, perKm: 10 },
          'BlaBlaCar': { base: 25, perKm: 8 }
        }
      }
    });
  } catch (error) {
    console.error('Error getting fare rates:', error);
    res.status(500).json({
      success: false,
      message: 'Error getting fare rates'
    });
  }
}; 