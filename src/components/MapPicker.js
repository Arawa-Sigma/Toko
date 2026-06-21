import { useEffect } from 'react'
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'

// Fix missing marker icons in Leaflet with Next.js
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
})

function LocationMarker({ position, setPosition }) {
  const map = useMapEvents({
    click(e) {
      setPosition(e.latlng)
      map.flyTo(e.latlng, map.getZoom())
    },
  })

  return position === null ? null : (
    <Marker 
      position={position}
      draggable={true}
      eventHandlers={{
        dragend: (e) => {
          const marker = e.target
          setPosition(marker.getLatLng())
        },
      }}
    />
  )
}

function MapInitializer() {
  const map = useMapEvents({})
  useEffect(() => {
    // Beri jeda sedikit agar modal selesai render sepenuhnya sebelum map mengambil ukurannya
    const timer = setTimeout(() => {
      map.invalidateSize()
    }, 250)
    return () => clearTimeout(timer)
  }, [map])
  return null
}

export default function MapPicker({ position, onPositionChange }) {
  // Default center: Jakarta (-6.200000, 106.816666)
  const defaultCenter = { lat: -6.200000, lng: 106.816666 }
  
  return (
    <div style={{ height: '400px', width: '100%', borderRadius: '8px', overflow: 'hidden', border: '1px solid #cbd5e1' }}>
      <MapContainer 
        center={position || defaultCenter} 
        zoom={13} 
        scrollWheelZoom={true} 
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <LocationMarker position={position} setPosition={onPositionChange} />
        <MapInitializer />
      </MapContainer>
      <div style={{ padding: '8px', background: '#f8fafc', borderTop: '1px solid #cbd5e1', fontSize: '0.85rem', color: '#555', textAlign: 'center' }}>
        <i className="fas fa-info-circle" style={{ color: '#3b82f6', marginRight: '6px' }}></i> 
        Geser marker atau klik pada peta untuk menentukan lokasi.
      </div>
    </div>
  )
}
