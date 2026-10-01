import { LocationCoordinates } from '../types';

/**
 * Calculates the great-circle distance between two points on the Earth's surface
 * using the Haversine formula in meters.
 */
export function calculateDistanceMeters(
  coord1: LocationCoordinates,
  coord2: LocationCoordinates
): number {
  const R = 6371e3; // Earth radius in meters
  const lat1Rad = (coord1.latitude * Math.PI) / 180;
  const lat2Rad = (coord2.latitude * Math.PI) / 180;
  const deltaLatRad = ((coord2.latitude - coord1.latitude) * Math.PI) / 180;
  const deltaLngRad = ((coord2.longitude - coord1.longitude) * Math.PI) / 180;

  const a =
    Math.sin(deltaLatRad / 2) * Math.sin(deltaLatRad / 2) +
    Math.cos(lat1Rad) *
      Math.cos(lat2Rad) *
      Math.sin(deltaLngRad / 2) *
      Math.sin(deltaLngRad / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return Math.round(R * c);
}

/**
 * Validates if the device coordinate is within the school's configured geofence radius
 */
export function isWithinGeofence(
  deviceCoords: LocationCoordinates,
  schoolCoords: LocationCoordinates,
  allowedRadiusMeters: number = 150
): { within: boolean; distanceMeters: number } {
  const distance = calculateDistanceMeters(deviceCoords, schoolCoords);
  return {
    within: distance <= allowedRadiusMeters,
    distanceMeters: distance
  };
}

/**
 * Helper to offset coordinates for realistic testing simulations
 */
export function createOffsetCoordinate(
  base: LocationCoordinates,
  meterOffsetNorth: number,
  meterOffsetEast: number
): LocationCoordinates {
  // 1 degree latitude ~ 111,111 meters
  const deltaLat = meterOffsetNorth / 111111;
  // 1 degree longitude ~ 111,111 * cos(lat)
  const deltaLng = meterOffsetEast / (111111 * Math.cos((base.latitude * Math.PI) / 180));

  return {
    latitude: parseFloat((base.latitude + deltaLat).toFixed(6)),
    longitude: parseFloat((base.longitude + deltaLng).toFixed(6)),
  };
}
