import mongoose from 'mongoose';

const vehicleSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  model: {
    type: String,
    required: [true, 'Please provide vehicle model'],
    trim: true,
    maxlength: [100, 'Model name cannot be more than 100 characters']
  },
  mileage: {
    type: Number,
    required: [true, 'Please provide vehicle mileage'],
    min: [1, 'Mileage must be greater than 0'],
    max: [100, 'Mileage cannot exceed 100 km/l']
  },
  fuelType: {
    type: String,
    enum: ['petrol', 'diesel', 'electric', 'hybrid'],
    default: 'petrol',
    required: [true, 'Please provide fuel type']
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update the updatedAt field before saving
vehicleSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

export default mongoose.model('Vehicle', vehicleSchema); 