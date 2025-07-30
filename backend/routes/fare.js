import express from 'express';
import { body } from 'express-validator';
import {
  calculateFares,
  getFareRates
} from '../controllers/fareController.js';
import { protect } from '../middleware/auth.js';
import validate from '../middleware/validate.js';

const router = express.Router();

// Fare calculation validation
const fareCalculationValidation = [
  body('distance')
    .isFloat({ min: 0 })
    .withMessage('Distance must be a positive number'),
  body('source')
    .optional()
    .isString()
    .withMessage('Source must be a string'),
  body('destination')
    .optional()
    .isString()
    .withMessage('Destination must be a string')
];

router.post('/calculate', protect, fareCalculationValidation, validate, calculateFares);
router.get('/rates', getFareRates);

export default router; 