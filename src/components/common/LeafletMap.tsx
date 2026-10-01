import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import { School, LocationCoordinates } from '../../types';

interface LeafletMapProps {
  schools?: School[];
  selectedSchool?: School | null;
  onSelectSchool?: (school: School) => void;
  center?: LocationCoordinates;
  zoom?: number;
  showGeofence?: boolean;
  geofenceRadiusMeters?: number;
  deviceLocation?: LocationCoordinates;
  deviceLabel?: string;
  height?: string;
}

export const LeafletMap: React.FC<LeafletMapProps> = ({
  schools = [],
  selectedSchool,
  onSelectSchool,
  center,
  zoom = 10,
  showGeofence = false,
  geofenceRadiusMeters = 150,
  deviceLocation,
  deviceLabel = 'Your Device',
  height = '420px'
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const layerGroupRef = useRef<L.LayerGroup | null>(null);

  // Default to Khairpur coordinates if center is not specified
  const mapCenter: [number, number] = center
    ? [center.latitude, center.longitude]
    : selectedSchool
    ? [selectedSchool.coordinates.latitude, selectedSchool.coordinates.longitude]
    : [27.5295, 68.7592]; // Khairpur city

  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        zoomControl: true,
        scrollWheelZoom: true,
      }).setView(mapCenter, zoom);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors | Sindh Education Audit',
        maxZoom: 18,
      }).addTo(map);

      layerGroupRef.current = L.layerGroup().addTo(map);
      mapInstanceRef.current = map;
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Update center & zoom if changed
  useEffect(() => {
    if (mapInstanceRef.current && center) {
      mapInstanceRef.current.setView([center.latitude, center.longitude], zoom);
    }
  }, [center?.latitude, center?.longitude, zoom]);

  // Render markers and geofences
  useEffect(() => {
    if (!mapInstanceRef.current || !layerGroupRef.current) return;
    const layerGroup = layerGroupRef.current;
    layerGroup.clearLayers();

    // Custom Icon Maker
    const createMarkerIcon = (color: string, label: string) => {
      return L.divIcon({
        className: 'custom-map-marker',
        html: `
          <div style="position: relative; display: flex; flex-direction: column; align-items: center; cursor: pointer;">
            <div style="background-color: ${color}; width: 26px; height: 26px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 11px;">
              ${label}
            </div>
            <div style="width: 0; height: 0; border-left: 5px solid transparent; border-right: 5px solid transparent; border-top: 7px solid ${color};"></div>
          </div>
        `,
        iconSize: [26, 33],
        iconAnchor: [13, 33],
        popupAnchor: [0, -32]
      });
    };

    // Render schools
    schools.forEach(school => {
      const isSelected = selectedSchool?.id === school.id;
      let color = '#059669'; // Green / Low risk
      if (school.riskScore >= 70) color = '#dc2626'; // Red / High risk
      else if (school.riskScore >= 35) color = '#d97706'; // Amber / Medium risk

      const marker = L.marker([school.coordinates.latitude, school.coordinates.longitude], {
        icon: createMarkerIcon(color, school.riskScore.toString())
      });

      const popupContent = `
        <div style="font-family: inherit; min-width: 190px; padding: 4px;">
          <div style="font-weight: 700; font-size: 13px; color: #0f172a; margin-bottom: 2px;">${school.name}</div>
          <div style="font-size: 11px; color: #64748b; margin-bottom: 6px;">SEMIS: ${school.semisCode} · ${school.taluka}</div>
          <div style="display: flex; justify-content: space-between; font-size: 11px; margin-bottom: 4px;">
            <span>Enrolled Students:</span>
            <strong>${school.enrolledStudentsCount}</strong>
          </div>
          <div style="display: flex; justify-content: space-between; font-size: 11px; margin-bottom: 4px;">
            <span>Risk Score:</span>
            <strong style="color: ${color};">${school?.riskScore ?? 0}/100 (${String(school?.riskLevel || 'low').toUpperCase()})</strong>
          </div>
          <div style="display: flex; justify-content: space-between; font-size: 11px; margin-bottom: 6px;">
            <span>Status:</span>
            <strong style="text-transform: capitalize;">${String(school?.status || 'active').replace('_', ' ')}</strong>
          </div>
        </div>
      `;

      marker.bindPopup(popupContent);

      if (onSelectSchool) {
        marker.on('click', () => {
          onSelectSchool(school);
        });
      }

      marker.addTo(layerGroup);

      // If this school is selected and showGeofence is enabled, draw radius circle
      if (isSelected && showGeofence) {
        L.circle([school.coordinates.latitude, school.coordinates.longitude], {
          radius: geofenceRadiusMeters,
          color: color,
          fillColor: color,
          fillOpacity: 0.15,
          weight: 2,
          dashArray: '4, 4'
        }).addTo(layerGroup);
      }
    });

    // If single selected school and not in full school list, render its marker & circle
    if (selectedSchool && !schools.some(s => s.id === selectedSchool.id)) {
      const color = selectedSchool.riskScore >= 70 ? '#dc2626' : selectedSchool.riskScore >= 35 ? '#d97706' : '#059669';
      const marker = L.marker([selectedSchool.coordinates.latitude, selectedSchool.coordinates.longitude], {
        icon: createMarkerIcon(color, selectedSchool.riskScore.toString())
      }).addTo(layerGroup);

      marker.bindPopup(`<strong>${selectedSchool.name}</strong><br>SEMIS: ${selectedSchool.semisCode}`).openPopup();

      if (showGeofence) {
        L.circle([selectedSchool.coordinates.latitude, selectedSchool.coordinates.longitude], {
          radius: geofenceRadiusMeters,
          color: color,
          fillColor: color,
          fillOpacity: 0.15,
          weight: 2,
          dashArray: '4, 4'
        }).addTo(layerGroup);
      }
    }

    // Render Device Live Location if provided
    if (deviceLocation) {
      const deviceIcon = L.divIcon({
        className: 'custom-device-marker',
        html: `
          <div style="position: relative; display: flex; flex-direction: column; align-items: center;">
            <div style="background-color: #2563eb; width: 22px; height: 22px; border-radius: 50%; border: 3px solid white; box-shadow: 0 0 0 4px rgba(37,99,235,0.3); animation: pulse 2s infinite;"></div>
          </div>
        `,
        iconSize: [22, 22],
        iconAnchor: [11, 11]
      });

      const devMarker = L.marker([deviceLocation.latitude, deviceLocation.longitude], {
        icon: deviceIcon
      }).addTo(layerGroup);

      devMarker.bindPopup(`<strong>${deviceLabel}</strong><br>Lat: ${deviceLocation.latitude.toFixed(5)}, Lng: ${deviceLocation.longitude.toFixed(5)}`);

      // Draw dashed line between device and school if school selected
      if (selectedSchool) {
        L.polyline(
          [
            [deviceLocation.latitude, deviceLocation.longitude],
            [selectedSchool.coordinates.latitude, selectedSchool.coordinates.longitude]
          ],
          {
            color: '#2563eb',
            weight: 2,
            dashArray: '6, 6',
            opacity: 0.7
          }
        ).addTo(layerGroup);
      }
    }
  }, [schools, selectedSchool, showGeofence, geofenceRadiusMeters, deviceLocation, deviceLabel]);

  return (
    <div
      ref={mapContainerRef}
      style={{ height, width: '100%', borderRadius: '0.75rem', zIndex: 1 }}
      className="border border-slate-200 dark:border-slate-800 shadow-inner overflow-hidden"
    />
  );
};
