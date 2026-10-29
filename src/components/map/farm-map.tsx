"use client";

import "leaflet/dist/leaflet.css";
import { useEffect } from "react";
import Link from "next/link";
import L from "leaflet";
import { CircleMarker, MapContainer, Popup, TileLayer, useMap, useMapEvents } from "react-leaflet";

export interface FarmMarker {
  id: string;
  lat: number;
  lng: number;
  label: string;
  sublabel?: string;
  color: string;
  href?: string;
}

export interface FarmMapProps {
  markers?: FarmMarker[];
  picked?: { lat: number; lng: number } | null;
  onPick?: (lat: number, lng: number) => void;
  center?: [number, number];
  zoom?: number;
  fitToMarkers?: boolean;
  className?: string;
}

const WEST_OF_IRELAND: [number, number] = [53.55, -8.8];

function PickHandler({ onPick }: { onPick: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(event) {
      onPick(Number(event.latlng.lat.toFixed(5)), Number(event.latlng.lng.toFixed(5)));
    },
  });
  return null;
}

function FitBounds({ markers }: { markers: FarmMarker[] }) {
  const map = useMap();
  useEffect(() => {
    if (markers.length === 0) return;
    const bounds = L.latLngBounds(markers.map((m) => [m.lat, m.lng]));
    map.fitBounds(bounds, { padding: [32, 32], maxZoom: 11 });
  }, [map, markers]);
  return null;
}

export default function FarmMap({
  markers = [],
  picked,
  onPick,
  center = WEST_OF_IRELAND,
  zoom = 7,
  fitToMarkers = false,
  className = "h-96",
}: FarmMapProps) {
  return (
    <MapContainer
      center={picked ? [picked.lat, picked.lng] : center}
      zoom={picked ? 12 : zoom}
      scrollWheelZoom={false}
      className={`${className} z-0 w-full rounded-xl border`}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {fitToMarkers && <FitBounds markers={markers} />}
      {onPick && <PickHandler onPick={onPick} />}
      {markers.map((m) => (
        <CircleMarker
          key={m.id}
          center={[m.lat, m.lng]}
          radius={7}
          pathOptions={{ color: "#ffffff", weight: 1.5, fillColor: m.color, fillOpacity: 0.9 }}
        >
          <Popup>
            <div className="space-y-0.5">
              {m.href ? (
                <Link href={m.href} className="font-medium text-primary hover:underline">
                  {m.label}
                </Link>
              ) : (
                <p className="font-medium">{m.label}</p>
              )}
              {m.sublabel && <p className="text-xs text-muted-foreground">{m.sublabel}</p>}
            </div>
          </Popup>
        </CircleMarker>
      ))}
      {picked && (
        <CircleMarker
          center={[picked.lat, picked.lng]}
          radius={9}
          pathOptions={{ color: "#ffffff", weight: 2, fillColor: "#2f7d4f", fillOpacity: 1 }}
        />
      )}
    </MapContainer>
  );
}
