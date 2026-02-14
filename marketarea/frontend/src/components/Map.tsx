"use client";

import { useEffect, useRef, useCallback, useState } from "react";
const DARK_MAP_STYLE: google.maps.MapTypeStyle[] = [
  { elementType: "geometry", stylers: [{ color: "#1d2c4d" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#8ec3b9" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#1a3646" }] },
  { featureType: "administrative.country", elementType: "geometry.stroke", stylers: [{ color: "#4b6878" }] },
  { featureType: "administrative.land_parcel", elementType: "labels.text.fill", stylers: [{ color: "#64779e" }] },
  { featureType: "administrative.province", elementType: "geometry.stroke", stylers: [{ color: "#4b6878" }] },
  { featureType: "landscape.man_made", elementType: "geometry.stroke", stylers: [{ color: "#334e87" }] },
  { featureType: "landscape.natural", elementType: "geometry", stylers: [{ color: "#023e58" }] },
  { featureType: "poi", elementType: "geometry", stylers: [{ color: "#283d6a" }] },
  { featureType: "poi", elementType: "labels.text.fill", stylers: [{ color: "#6f9ba5" }] },
  { featureType: "poi", elementType: "labels.text.stroke", stylers: [{ color: "#1d2c4d" }] },
  { featureType: "poi.park", elementType: "geometry.fill", stylers: [{ color: "#023e58" }] },
  { featureType: "poi.park", elementType: "labels.text.fill", stylers: [{ color: "#3C7680" }] },
  { featureType: "road", elementType: "geometry", stylers: [{ color: "#304a7d" }] },
  { featureType: "road", elementType: "labels.text.fill", stylers: [{ color: "#98a5be" }] },
  { featureType: "road", elementType: "labels.text.stroke", stylers: [{ color: "#1d2c4d" }] },
  { featureType: "road.highway", elementType: "geometry", stylers: [{ color: "#2c6675" }] },
  { featureType: "road.highway", elementType: "geometry.stroke", stylers: [{ color: "#255763" }] },
  { featureType: "road.highway", elementType: "labels.text.fill", stylers: [{ color: "#b0d5ce" }] },
  { featureType: "road.highway", elementType: "labels.text.stroke", stylers: [{ color: "#023e58" }] },
  { featureType: "transit", elementType: "labels.text.fill", stylers: [{ color: "#98a5be" }] },
  { featureType: "transit", elementType: "labels.text.stroke", stylers: [{ color: "#1d2c4d" }] },
  { featureType: "transit.line", elementType: "geometry.fill", stylers: [{ color: "#283d6a" }] },
  { featureType: "transit.station", elementType: "geometry", stylers: [{ color: "#3a4762" }] },
  { featureType: "water", elementType: "geometry", stylers: [{ color: "#0e1626" }] },
  { featureType: "water", elementType: "labels.text.fill", stylers: [{ color: "#4e6d70" }] },
];

let loaderPromise: Promise<void> | null = null;

function loadGoogleMaps(): Promise<void> {
  if (loaderPromise) return loaderPromise;

  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY;
  if (!apiKey) {
    return Promise.reject(new Error("NEXT_PUBLIC_GOOGLE_MAPS_KEY가 설정되지 않았습니다"));
  }

  loaderPromise = new Promise<void>((resolve, reject) => {
    if (typeof google !== "undefined" && google.maps) {
      resolve();
      return;
    }
    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=marker`;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Google Maps 로드 실패"));
    document.head.appendChild(script);
  });

  return loaderPromise;
}

interface MapProps {
  center: { lat: number; lng: number };
  radius: number;
  onMapClick: (lat: number, lng: number) => void;
}

export default function Map({ center, radius, onMapClick }: MapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const markerRef = useRef<google.maps.Marker | null>(null);
  const circleRef = useRef<google.maps.Circle | null>(null);
  const [sdkReady, setSdkReady] = useState(false);
  const [sdkError, setSdkError] = useState(false);

  useEffect(() => {
    loadGoogleMaps()
      .then(() => setSdkReady(true))
      .catch(() => setSdkError(true));
  }, []);

  const updateOverlays = useCallback(
    (map: google.maps.Map, lat: number, lng: number) => {
      const position = { lat, lng };

      if (markerRef.current) {
        markerRef.current.setPosition(position);
      } else {
        markerRef.current = new google.maps.Marker({ map, position });
      }

      if (circleRef.current) {
        circleRef.current.setMap(null);
      }

      circleRef.current = new google.maps.Circle({
        map,
        center: position,
        radius,
        strokeWeight: 2,
        strokeColor: "#2563eb",
        strokeOpacity: 0.8,
        fillColor: "#2563eb",
        fillOpacity: 0.12,
      });
    },
    [radius]
  );

  useEffect(() => {
    if (!sdkReady || !mapRef.current) return;

    if (!mapInstanceRef.current) {
      const map = new google.maps.Map(mapRef.current, {
        center: { lat: center.lat, lng: center.lng },
        zoom: 15,
        styles: DARK_MAP_STYLE,
        disableDefaultUI: false,
        zoomControl: true,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false,
      });
      mapInstanceRef.current = map;

      map.addListener("click", (e: google.maps.MapMouseEvent) => {
        if (e.latLng) {
          onMapClick(e.latLng.lat(), e.latLng.lng());
        }
      });
    } else {
      mapInstanceRef.current.setCenter({ lat: center.lat, lng: center.lng });
    }

    updateOverlays(mapInstanceRef.current, center.lat, center.lng);
  }, [sdkReady, center, radius, onMapClick, updateOverlays]);

  if (!sdkReady) {
    return (
      <div
        className="w-full h-full overflow-hidden flex items-center justify-center flex-col gap-2"
        style={{ backgroundColor: "var(--bg-base)", color: "var(--text-muted)" }}
      >
        {sdkError ? (
          <>
            <p className="text-sm">Google Maps 로드에 실패했습니다</p>
            <p className="text-xs">API 키 설정을 확인해주세요</p>
          </>
        ) : (
          <p className="text-sm">지도 로딩 중...</p>
        )}
      </div>
    );
  }

  return (
    <div
      ref={mapRef}
      className="w-full h-full overflow-hidden"
    />
  );
}
