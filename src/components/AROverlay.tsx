"use client"
import React from 'react';

import { useState, useEffect, useRef, useCallback } from "react";
import { X, Compass, CameraOff } from "lucide-react";
import { countries } from "../data/countries";

interface AROverlayProps {
  onClose: () => void;
}

/** Calculates bearing between two geographic points */
function calculateBearing(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const y = Math.sin(toRad(lng2 - lng1)) * Math.cos(toRad(lat2));
  const x =
    Math.cos(toRad(lat1)) * Math.sin(toRad(lat2)) -
    Math.sin(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.cos(toRad(lng2 - lng1));
  return ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360;
}

/** Calculates distance in km between two geographic points */
function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/** Formats distance for display */
function formatDistance(km: number): string {
  if (km < 1) return `${Math.round(km * 1000)}m`;
  if (km < 100) return `${km.toFixed(1)}km`;
  return `${Math.round(km)}km`;
}

/** AR camera overlay with compass-based animal markers */
export default function AROverlay({ onClose }: AROverlayProps): React.JSX.Element {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [supported, setSupported] = useState(true);
  const [heading, setHeading] = useState(0);
  const [userLat, setUserLat] = useState<number | null>(null);
  const [userLng, setUserLng] = useState<number | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);

  // Start camera
  useEffect(() => {
    let stream: MediaStream | null = null;

    async function startCamera() {
      try {
        if (!navigator.mediaDevices?.getUserMedia) {
          setSupported(false);
          setCameraError("Camera not supported on this device");
          return;
        }
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment" },
          audio: false,
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch {
        setCameraError("Camera access denied. Please allow camera access.");
        setSupported(false);
      }
    }

    startCamera();

    return () => {
      if (stream) {
        stream.getTracks().forEach((t) => t.stop());
      }
    };
  }, []);

  // Get device orientation (compass heading)
  useEffect(() => {
    let cancelled = false;

    function handleOrientation(e: DeviceOrientationEvent) {
      // Alpha is the compass heading on mobile devices
      if (e.alpha !== null) {
        setHeading(e.alpha);
      }
    }

    // Check if permission needs to be requested (iOS 13+)
    if (typeof DeviceOrientationEvent !== "undefined" && "requestPermission" in DeviceOrientationEvent) {
      (DeviceOrientationEvent as unknown as { requestPermission: () => Promise<string> })
        .requestPermission()
        .then((perm) => {
          // The overlay may have unmounted while the iOS dialog was open —
          // attaching after cleanup would leak the listener for the session.
          if (!cancelled && perm === "granted") {
            window.addEventListener("deviceorientation", handleOrientation);
          }
        })
        .catch(() => {
          // Permission denied: compass stays unavailable; the map still works.
        });
    } else {
      window.addEventListener("deviceorientation", handleOrientation);
    }

    return () => {
      cancelled = true;
      window.removeEventListener("deviceorientation", handleOrientation);
    };
  }, []);

  // Get user geolocation
  useEffect(() => {
    if (!navigator.geolocation) return;
    const wid = navigator.geolocation.watchPosition(
      (pos) => {
        setUserLat(pos.coords.latitude);
        setUserLng(pos.coords.longitude);
      },
      () => {},
      { enableHighAccuracy: true }
    );
    return () => navigator.geolocation.clearWatch(wid);
  }, []);

  // Calculate nearest animals and their screen positions
  const nearbyAnimals = React.useMemo(() => {
    if (userLat === null || userLng === null) return [];
    return countries
      .map((a) => ({
        ...a,
        distance: calculateDistance(userLat, userLng, a.lat, a.lng),
        bearing: calculateBearing(userLat, userLng, a.lat, a.lng),
      }))
      .sort((a, b) => a.distance - b.distance)
      .slice(0, 20);
  }, [userLat, userLng]);

  // Unsupported fallback
  if (!supported || cameraError) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'var(--background)' }}>
        <div className="text-center p-8 max-w-sm">
          <CameraOff size={48} className="mx-auto mb-4 text-muted-foreground" />
          <h2 className="text-xl font-semibold text-foreground font-[var(--font-heading)] mb-2">
            AR Not Available
          </h2>
          <p className="text-sm text-muted-foreground mb-6">
            {cameraError || "Your browser doesn't support the camera or orientation sensors needed for AR mode."}
          </p>
          <button
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl text-sm font-medium text-primary-foreground transition-all hover:shadow-lg"
            style={{
              background: 'linear-gradient(135deg, var(--natura-forest), var(--natura-emerald))',
            }}
          >
            Back to Map
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-black">
      {/* Camera feed */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="absolute inset-0 w-full h-full object-cover"
      />

      {/* Compass overlay */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20">
        <div className="glass-card rounded-xl px-4 py-2 flex items-center gap-2 text-white">
          <Compass size={16} className="animate-pulse" />
          <span className="text-sm font-medium tabular-nums">{Math.round(heading)}°</span>
          {userLat !== null && (
            <span className="text-xs text-white/60">
              {userLat.toFixed(2)}°, {userLng?.toFixed(2)}°
            </span>
          )}
        </div>
      </div>

      {/* Animal markers overlay */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {nearbyAnimals.map((animal) => {
          // Calculate relative angle from current heading
          let relAngle = animal.bearing - heading;
          if (relAngle > 180) relAngle -= 360;
          if (relAngle < -180) relAngle += 360;

          // Only show animals within ~60° field of view
          if (Math.abs(relAngle) > 60) return null;

          // Map angle to screen X position (center = 50%)
          const xPercent = 50 + (relAngle / 60) * 40;
          // Vertical position based on distance (closer = lower)
          const yPercent = 30 + Math.min(40, animal.distance / 500);

          return (
            <div
              key={animal.id}
              className="absolute pointer-events-auto"
              style={{
                left: `${xPercent}%`,
                top: `${yPercent}%`,
                transform: 'translate(-50%, -50%)',
              }}
            >
              <div className="flex flex-col items-center animate-fade-in-scale">
                <span className="text-3xl drop-shadow-lg">{animal.emoji}</span>
                <div className="glass-card rounded-lg px-2 py-1 mt-1 text-center min-w-[80px]">
                  <div className="text-[10px] font-semibold text-white truncate max-w-[100px]">
                    {animal.animal}
                  </div>
                  <div className="text-[9px] text-white/60">
                    {formatDistance(animal.distance)}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 z-30 w-12 h-12 flex items-center justify-center rounded-full glass-card shadow-lg border border-white/20 transition-all active:scale-95"
        aria-label="Exit AR mode"
      >
        <X size={20} className="text-white" />
      </button>

      {/* Bottom info bar */}
      <div className="absolute bottom-6 left-4 right-4 z-20">
        <div className="glass-card rounded-xl px-4 py-3 text-center">
          <p className="text-xs text-white/70">
            {userLat === null
              ? "Locating you..."
              : `${nearbyAnimals.length} species nearby — Point your camera to discover`}
          </p>
        </div>
      </div>
    </div>
  );
}
