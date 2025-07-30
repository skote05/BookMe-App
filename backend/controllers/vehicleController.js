import Vehicle from '../models/Vehicle.js';

// @desc    Create vehicle
// @route   POST /api/vehicle
// @access  Private
export const createVehicle = async (req, res) => {
  try {
    const { model, mileage, fuelType } = req.body;

    // Check if user already has a vehicle
    const existingVehicle = await Vehicle.findOne({ user: req.user.id });
    if (existingVehicle) {
      return res.status(400).json({
        success: false,
        message: 'User already has a vehicle. Use update instead.'
      });
    }

    const vehicle = await Vehicle.create({
      user: req.user.id,
      model,
      mileage,
      fuelType
    });

    res.status(201).json({
      success: true,
      data: vehicle
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server Error'
    });
  }
};

// @desc    Get user's vehicle
// @route   GET /api/vehicle
// @access  Private
export const getVehicle = async (req, res) => {
  try {
    const vehicle = await Vehicle.findOne({ user: req.user.id });

    if (!vehicle) {
      return res.status(404).json({
        success: false,
        message: 'No vehicle found for this user'
      });
    }

    res.status(200).json({
      success: true,
      data: vehicle
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server Error'
    });
  }
};

// @desc    Update vehicle
// @route   PUT /api/vehicle
// @access  Private
export const updateVehicle = async (req, res) => {
  try {
    const { model, mileage, fuelType } = req.body;

    let vehicle = await Vehicle.findOne({ user: req.user.id });

    if (!vehicle) {
      // Create vehicle if it doesn't exist
      vehicle = await Vehicle.create({
        user: req.user.id,
        model,
        mileage,
        fuelType
      });
    } else {
      // Update existing vehicle
      vehicle = await Vehicle.findOneAndUpdate(
        { user: req.user.id },
        { model, mileage, fuelType },
        { new: true, runValidators: true }
      );
    }

    res.status(200).json({
      success: true,
      data: vehicle
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server Error'
    });
  }
};

// @desc    Delete vehicle
// @route   DELETE /api/vehicle
// @access  Private
export const deleteVehicle = async (req, res) => {
  try {
    const vehicle = await Vehicle.findOneAndDelete({ user: req.user.id });
    
    if (!vehicle) {
      return res.status(404).json({
        success: false,
        message: 'No vehicle found'
      });
    }

    res.json({
      success: true,
      message: 'Vehicle deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting vehicle:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting vehicle'
    });
  }
}; 