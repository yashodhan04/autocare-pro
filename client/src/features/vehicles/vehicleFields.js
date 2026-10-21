import { FUEL_OPTIONS, VEHICLE_TYPE_OPTIONS } from '../../config/options.js';

const thisYear = new Date().getFullYear();

/** Field config shared by every "add / edit vehicle" form. Pass customerOptions to show the owner picker (staff only). */
export function vehicleFields({ customerOptions, editing = false } = {}) {
  return [
    ...(customerOptions && !editing ? [{ name: 'customer', label: 'Owner', type: 'select', required: true, options: customerOptions, span: 2 }] : []),
    { name: 'registrationNumber', label: 'Registration number', required: true, placeholder: 'KA01AB1234', pattern: /^[A-Za-z0-9\s-]{3,20}$/, patternMessage: 'Letters, digits, spaces or hyphens only' },
    { name: 'vehicleType', label: 'Vehicle type', type: 'select', required: true, options: VEHICLE_TYPE_OPTIONS },
    { name: 'make', label: 'Make', required: true, placeholder: 'Maruti' },
    { name: 'model', label: 'Model', required: true, placeholder: 'Swift' },
    { name: 'year', label: 'Manufacturing year', type: 'number', required: true, min: 1950, max: thisYear + 1 },
    { name: 'fuelType', label: 'Fuel type', type: 'select', required: true, options: FUEL_OPTIONS },
    { name: 'vin', label: 'VIN / chassis number', helper: '11–17 letters or digits (optional)', pattern: /^[A-Za-z0-9]{11,17}$/, patternMessage: 'VIN must be 11–17 letters or digits' },
    { name: 'color', label: 'Colour' },
    { name: 'odometer', label: 'Odometer (km)', type: 'number', min: 0, required: true },
  ];
}
