"use client";

import { useEffect, useRef, useCallback, useState } from "react";

declare global {
  interface Window {
    kakao: any;
  }
}

function loadKakaoSDK(): Promise<void> {
  return new Promise((resolve, reject) => {
    const apiKey = process.env.NEXT_PUBLIC_KAKAO_MAP_KEY;
    console.log("[KakaoMap] API Key:", apiKey ? `${apiKey.substring(0, 6)}...` : "MISSING");

    if (!apiKey) {
      reject(new Error("NEXT_PUBLIC_KAKAO_MAP_KEY가 설정되지 않았습니다"));
      return;
    }

    // 이미 로드 완료
    if (window.kakao?.maps) {
      window.kakao.maps.load(() => resolve());
      return;
    }

    // 기존 script 태그 제거 (실패했을 수 있으므로)
    const existing = document.querySelector(`script[src*="dapi.kakao.com"]`);
    if (existing) existing.remove();

    // 새로 script 삽입
    const url = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${apiKey}&libraries=services&autoload=false`;
    console.log("[KakaoMap] Loading SDK from:", url);

    const script = document.createElement("script");
    script.src = url;
    script.onload = () => {
      console.log("[KakaoMap] SDK loaded, window.kakao:", !!window.kakao);
      if (window.kakao?.maps) {
        window.kakao.maps.load(() => resolve());
      } else {
        reject(new Error("SDK 로드됐지만 kakao.maps 객체 없음"));
      }
    };
    script.onerror = (e) => {
      console.error("[KakaoMap] SDK load error:", e);
      reject(new Error("카카오맵 SDK 로드 실패"));
    };
    document.head.appendChild(script);
  });
}

interface MapProps {
  center: { lat: number; lng: number };
  radius: number;
  onMapClick: (lat: number, lng: number) => void;
}

export default function Map({ center, radius, onMapClick }: MapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const circleRef = useRef<any>(null);
  const [sdkReady, setSdkReady] = useState(false);
  const [sdkError, setSdkError] = useState(false);

  // SDK 로드
  useEffect(() => {
    loadKakaoSDK()
      .then(() => setSdkReady(true))
      .catch(() => setSdkError(true));
  }, []);

  const updateOverlays = useCallback(
    (map: any, lat: number, lng: number) => {
      const kakao = window.kakao;
      const position = new kakao.maps.LatLng(lat, lng);

      if (markerRef.current) {
        markerRef.current.setPosition(position);
      } else {
        markerRef.current = new kakao.maps.Marker({ map, position });
      }

      if (circleRef.current) {
        circleRef.current.setMap(null);
      }

      circleRef.current = new kakao.maps.Circle({
        center: position,
        radius: radius,
        strokeWeight: 2,
        strokeColor: "#2563eb",
        strokeOpacity: 0.8,
        fillColor: "#2563eb",
        fillOpacity: 0.12,
      });
      circleRef.current.setMap(map);
    },
    [radius]
  );

  // 지도 초기화 및 업데이트
  useEffect(() => {
    if (!sdkReady || !mapRef.current) return;

    const kakao = window.kakao;
    const mapCenter = new kakao.maps.LatLng(center.lat, center.lng);

    if (!mapInstanceRef.current) {
      const options = { center: mapCenter, level: 5 };
      const map = new kakao.maps.Map(mapRef.current, options);
      mapInstanceRef.current = map;

      kakao.maps.event.addListener(map, "click", (e: any) => {
        const latlng = e.latLng;
        onMapClick(latlng.getLat(), latlng.getLng());
      });
    } else {
      mapInstanceRef.current.setCenter(mapCenter);
    }

    updateOverlays(mapInstanceRef.current, center.lat, center.lng);
  }, [sdkReady, center, radius, onMapClick, updateOverlays]);

  // SDK 로드 전 또는 실패 시 fallback
  if (!sdkReady) {
    return (
      <div
        className="w-full h-full overflow-hidden flex items-center justify-center flex-col gap-2"
        style={{ backgroundColor: "var(--bg-base)", color: "var(--text-muted)" }}
      >
        {sdkError ? (
          <>
            <p className="text-sm">카카오맵 SDK 로드에 실패했습니다</p>
            <p className="text-xs">API 키와 도메인 설정을 확인해주세요</p>
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
