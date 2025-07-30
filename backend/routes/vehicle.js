import express from 'express';
import { body } from 'express-validator';
import {
  getVehicle,
  createVehicle,
  updateVehicle,
  deleteVehicle
} from '../controllers/vehicleController.js';
import { protect } from '../middleware/auth.js';
import validate from '../middleware/validate.js';

const router = express.Router();

// Vehicle validation
const vehicleValidation = [
  body('model')
    .isString()
    .withMessage('Model must be a string'),
  body('mileage')
    .isFloat({ min: 0 })
    .withMessage('Mileage must be a positive number'),
  body('fuelType')
    .isIn(['petrol', 'diesel', 'electric', 'cng'])
    .withMessage('Fuel type must be petrol, diesel, electric, or cng')
];

router.get('/', protect, getVehicle);
router.post('/', protect, vehicleValidation, validate, createVehicle);
router.put('/', protect, vehicleValidation, validate, updateVehicle);
router.delete('/', protect, deleteVehicle);

export default router; 