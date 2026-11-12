import React, { useState } from "react";

import {
  MapContainer,
  TileLayer,
  Marker,
  useMap,
  useMapEvents,
} from "react-leaflet";

import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix Leaflet marker icons
delete L.Icon.Default.prototype._getIconUrl;

L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

// Convert coordinates into a readable address
async function getAddressFromCoordinates(latitude, longitude) {
  const response = await fetch(
    `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}`
  );

  if (!response.ok) {
    throw new Error("Unable to find the address.");
  }

  const data = await response.json();

  return data.display_name || "";
}

// Automatically move map when position changes
function MapUpdater({ position }) {
  const map = useMap();

  React.useEffect(() => {
    map.setView(position, 15);
  }, [position, map]);

  return null;
}

// Allow selecting a location by clicking the map
function LocationMarker({ position, onPositionChange }) {
  useMapEvents({
    click(event) {
      onPositionChange([
        event.latlng.lat,
        event.latlng.lng,
      ]);
    },
  });

  return position ? <Marker position={position} /> : null;
}

export default function DeliveryLocation({ onLocationSelect }) {
  const [position, setPosition] = useState([
    17.385,
    78.4867,
  ]);

  const [address, setAddress] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  // Update coordinates and fetch address
  const updateSelectedLocation = async (latitude, longitude) => {
    setPosition([latitude, longitude]);
    setLoading(true);
    setMessage("Finding address...");

    try {
      const foundAddress = await getAddressFromCoordinates(
        latitude,
        longitude
      );

      setAddress(foundAddress);
      setMessage("Location selected successfully!");
    } catch {
      setAddress("");
      setMessage(
        "Coordinates selected, but address could not be found. Please enter your address manually."
      );
    } finally {
      setLoading(false);
    }
  };

  // Detect current location
  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      setMessage("Location is not supported by your browser.");
      return;
    }

    setLoading(true);
    setMessage("Detecting your current location...");

    navigator.geolocation.getCurrentPosition(
      async (result) => {
        await updateSelectedLocation(
          result.coords.latitude,
          result.coords.longitude
        );
      },
      () => {
        setLoading(false);
        setMessage(
          "Unable to access location. Please allow location permission."
        );
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0,
      }
    );
  };

  // Search delivery address
  const searchAddress = async () => {
    if (!address.trim()) {
      setMessage("Please enter a delivery address.");
      return;
    }

    try {
      setLoading(true);
      setMessage("Searching address...");

      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(
          address
        )}`
      );

      if (!response.ok) {
        throw new Error("Address search failed.");
      }

      const data = await response.json();

      if (data.length > 0) {
        setPosition([
          Number(data[0].lat),
          Number(data[0].lon),
        ]);

        setAddress(data[0].display_name || address);
        setMessage("Address found successfully!");
      } else {
        setMessage("Address not found. Try another address.");
      }
    } catch {
      setMessage("Unable to search address. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Confirm selected delivery location
  const confirmLocation = () => {
    if (loading) {
      setMessage("Please wait while the address is loading.");
      return;
    }

    if (!address.trim()) {
      setMessage("Please enter or select a delivery address.");
      return;
    }

    const selectedLocation = {
      latitude: position[0],
      longitude: position[1],
      address: address.trim(),
    };

    if (onLocationSelect) {
      onLocationSelect(selectedLocation);
    }

    setMessage("Delivery location confirmed successfully!");
  };

  return (
    <div
      style={{
        padding: "20px",
        maxWidth: "750px",
        margin: "auto",
      }}
    >
      <h2>Select Delivery Location</h2>

      {/* Address Search */}
      <div
        style={{
          display: "flex",
          gap: "8px",
          marginBottom: "12px",
        }}
      >
        <input
          type="text"
          placeholder="Enter your delivery address"
          value={address}
          onChange={(event) => setAddress(event.target.value)}
          style={{
            flex: 1,
            minWidth: 0,
            padding: "12px",
            border: "1px solid #ccc",
            borderRadius: "6px",
          }}
        />

        <button
          type="button"
          onClick={searchAddress}
          disabled={loading}
        >
          Search
        </button>
      </div>

      {/* Current Location */}
      <button
        type="button"
        onClick={getCurrentLocation}
        disabled={loading}
        style={{
          marginBottom: "12px",
          padding: "10px",
          cursor: "pointer",
        }}
      >
        📍 Use My Current Location
      </button>

      {/* OpenStreetMap */}
      <MapContainer
        center={position}
        zoom={13}
        style={{
          height: "400px",
          width: "100%",
          borderRadius: "10px",
        }}
      >
        <MapUpdater position={position} />

        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <LocationMarker
          position={position}
          onPositionChange={(coordinates) =>
            updateSelectedLocation(
              coordinates[0],
              coordinates[1]
            )
          }
        />
      </MapContainer>

      {/* Coordinates */}
      <p style={{ marginTop: "12px" }}>
        <strong>Selected coordinates:</strong>{" "}
        {position[0].toFixed(5)}, {position[1].toFixed(5)}
      </p>

      {/* Selected Address */}
      <p>
        <strong>Delivery Address:</strong>{" "}
        {address || "No address selected"}
      </p>

      {/* Confirm */}
      <button
        type="button"
        onClick={confirmLocation}
        disabled={loading}
        style={{
          padding: "12px 20px",
          background: "#6c3ce9",
          color: "white",
          border: "none",
          borderRadius: "6px",
          cursor: "pointer",
          width: "100%",
        }}
      >
        {loading ? "Please wait..." : "Confirm Delivery Location"}
      </button>

      {message && (
        <p
          role="status"
          style={{
            marginTop: "12px",
            color: "#6c3ce9",
          }}
        >
          {message}
        </p>
      )}
    </div>
  );
}