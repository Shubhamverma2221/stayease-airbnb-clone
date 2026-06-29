import React, { useEffect, useState, useRef } from 'react';
import { MapPin, Navigation, Compass } from 'lucide-react';

const MapContainer = ({ properties = [], userLocation = null, onMarkerClick = null }) => {
  const [mapLoaded, setMapLoaded] = useState(false);
  const mapRef = useRef(null);

  useEffect(() => {
    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      console.warn('Google Maps API Key missing. Falling back to interactive locator map UI.');
      return;
    }

    // Dynamic Google Maps Script Loading
    const scriptId = 'google-maps-script';
    let script = document.getElementById(scriptId);

    if (!script) {
      script = document.createElement('script');
      script.id = scriptId;
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
      script.async = true;
      script.defer = true;
      document.head.appendChild(script);
    }

    const initMap = () => {
      if (!mapRef.current) return;

      const defaultCenter = userLocation
        ? { lat: userLocation.latitude, lng: userLocation.longitude }
        : { lat: 40.7128, lng: -74.0060 }; // New York default

      const map = new window.google.maps.Map(mapRef.current, {
        center: defaultCenter,
        zoom: 12,
        styles: [
          {
            featureType: 'water',
            elementType: 'geometry',
            stylers: [{ color: '#e9e9e9' }, { lightness: 17 }],
          },
          {
            featureType: 'landscape',
            elementType: 'geometry',
            stylers: [{ color: '#f5f5f5' }, { lightness: 20 }],
          },
        ],
      });

      // Markers for each property
      properties.forEach((p) => {
        const markerLng = p.location.coordinates[0];
        const markerLat = p.location.coordinates[1];

        const marker = new window.google.maps.Marker({
          position: { lat: markerLat, lng: markerLng },
          map: map,
          title: p.title,
          icon: {
            path: window.google.maps.SymbolPath.CIRCLE,
            scale: 8,
            fillColor: '#FF385C',
            fillOpacity: 1,
            strokeWeight: 2,
            strokeColor: '#FFFFFF',
          },
        });

        marker.addListener('click', () => {
          if (onMarkerClick) onMarkerClick(p);
        });
      });

      // Marker for user location
      if (userLocation) {
        new window.google.maps.Marker({
          position: { lat: userLocation.latitude, lng: userLocation.longitude },
          map: map,
          title: 'Your Location',
          icon: {
            path: window.google.maps.SymbolPath.BACKWARD_CLOSED_ARROW,
            scale: 6,
            fillColor: '#0066FF',
            fillOpacity: 1,
            strokeWeight: 1,
          },
        });
      }

      setMapLoaded(true);
    };

    script.onload = () => {
      // Check if google maps object ready
      if (window.google && window.google.maps) {
        initMap();
      }
    };

    if (window.google && window.google.maps) {
      initMap();
    }
  }, [properties, userLocation]);

  // Fallback Interactive UI if Google Maps key not specified
  return (
    <div className="relative h-full w-full overflow-hidden rounded-3xl border border-neutral-200 shadow-lg dark:border-neutral-800">
      
      {/* Target Container for Google Maps */}
      <div ref={mapRef} className="h-full w-full bg-neutral-100 dark:bg-neutral-900" id="google-map-element">
        
        {/* Mock Map UI shown when Google Maps is not initialized */}
        {!mapLoaded && (
          <div className="relative flex h-full w-full flex-col items-center justify-center p-6 bg-gradient-to-tr from-neutral-100 to-neutral-200 dark:from-neutral-900 dark:to-neutral-850">
            {/* Grid Pattern overlay for cartography look */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#e2e8f0_1px,transparent_1px),linear-gradient(to_bottom,#e2e8f0_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-30 dark:bg-[linear-gradient(to_right,#334155_1px,transparent_1px),linear-gradient(to_bottom,#334155_1px,transparent_1px)]"></div>
            
            <div className="z-10 flex flex-col items-center text-center">
              <div className="mb-4 rounded-full bg-brand/10 p-4 text-brand dark:bg-brand/20">
                <Compass className="h-8 w-8 animate-spin-slow" />
              </div>
              <h4 className="text-lg font-bold text-neutral-800 dark:text-white">Interactive Locator Active</h4>
              <p className="max-w-xs mt-1 text-xs text-neutral-500 dark:text-neutral-400">
                Showing property layout locations dynamically based on coordinates database indexes.
              </p>

              {/* Simulated Coordinate View */}
              <div className="mt-8 flex flex-wrap justify-center gap-3">
                {properties.map((p, idx) => {
                  const displayCity = p.address.city || 'City';
                  return (
                    <button
                      key={p._id}
                      onClick={() => onMarkerClick && onMarkerClick(p)}
                      className="flex items-center gap-2 rounded-full bg-white px-3 py-1.5 text-xs font-semibold shadow-md transition hover:scale-105 active:scale-95 dark:bg-neutral-800 dark:text-white"
                    >
                      <MapPin className="h-3.5 w-3.5 text-brand" />
                      <span>{displayCity} - INR {p.pricePerNight}</span>
                    </button>
                  );
                })}
              </div>

              {userLocation && (
                <div className="mt-6 flex items-center gap-2 rounded-full bg-blue-600 px-3 py-1.5 text-xs font-bold text-white shadow-md">
                  <Navigation className="h-3.5 w-3.5" />
                  <span>Current location enabled ({userLocation.latitude.toFixed(4)}, {userLocation.longitude.toFixed(4)})</span>
                </div>
              )}
            </div>

          </div>
        )}
      </div>

    </div>
  );
};

export default MapContainer;
