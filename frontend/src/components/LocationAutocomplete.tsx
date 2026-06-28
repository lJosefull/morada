import { useEffect, useRef, useState } from 'react'

declare global {
  interface Window {
    initGoogleMaps?: () => void
  }
}

interface LocationAutocompleteProps {
  value: string
  latitude?: string
  longitude?: string
  radius?: string
  onChange: (data: { location: string; latitude: string; longitude: string }) => void
  className?: string
  placeholder?: string
  showMap?: boolean
}

const API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY

const DEFAULT_CENTER = { lat: 4.711, lng: -74.072 }

export default function LocationAutocomplete({
  value, latitude, longitude, radius, onChange, className = '', placeholder, showMap = true,
}: LocationAutocompleteProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const mapRef = useRef<HTMLDivElement>(null)
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null)
  const listenerRef = useRef<google.maps.MapsEventListener | null>(null)
  const mapInstanceRef = useRef<google.maps.Map | null>(null)
  const markerRef = useRef<google.maps.Marker | null>(null)
  const circleRef = useRef<google.maps.Circle | null>(null)
  const pendingCenterRef = useRef<{ lat: number; lng: number } | null>(null)
  const [loaded, setLoaded] = useState(false)

  const hasCoords = latitude && longitude

  useEffect(() => {
    if (!API_KEY) return

    if (window.google?.maps?.places) {
      setLoaded(true)
      return
    }

    if (document.querySelector('#google-maps-script')) {
      const check = setInterval(() => {
        if (window.google?.maps?.places) {
          clearInterval(check)
          setLoaded(true)
        }
      }, 300)
      return () => clearInterval(check)
    }

    window.initGoogleMaps = () => setLoaded(true)

    const script = document.createElement('script')
    script.id = 'google-maps-script'
    script.src = `https://maps.googleapis.com/maps/api/js?key=${API_KEY}&libraries=places&callback=initGoogleMaps`
    script.async = true
    script.defer = true
    document.head.appendChild(script)
  }, [])

  useEffect(() => {
    if (!showMap) {
      if (circleRef.current) { circleRef.current.setMap(null); circleRef.current = null }
      if (markerRef.current) { markerRef.current.setMap(null); markerRef.current = null }
      if (mapInstanceRef.current) { mapInstanceRef.current = null }
      if (autocompleteRef.current) { autocompleteRef.current = null }
      if (listenerRef.current) { listenerRef.current = null }
      return
    }
    if (!loaded || !inputRef.current || !mapRef.current) return

    const center = hasCoords
      ? { lat: Number(latitude), lng: Number(longitude) }
      : DEFAULT_CENTER

    mapInstanceRef.current = new google.maps.Map(mapRef.current, {
      center,
      zoom: 14,
      mapTypeControl: false,
      streetViewControl: false,
    })

    markerRef.current = new google.maps.Marker({
      position: center,
      map: mapInstanceRef.current,
      draggable: true,
    })

    markerRef.current.addListener('dragend', () => {
      const pos = markerRef.current!.getPosition()
      if (!pos) return
      reverseGeocode(pos.lat(), pos.lng())
    })

    mapInstanceRef.current.addListener('click', (e: google.maps.MapMouseEvent) => {
      if (!e.latLng) return
      markerRef.current!.setPosition(e.latLng)
      reverseGeocode(e.latLng.lat(), e.latLng.lng())
    })

    autocompleteRef.current = new google.maps.places.Autocomplete(inputRef.current, {
      types: ['address'],
      componentRestrictions: { country: 'co' },
    })

    listenerRef.current = autocompleteRef.current.addListener('place_changed', () => {
      const place = autocompleteRef.current?.getPlace()
      if (!place || !place.geometry?.location) return

      const lat = place.geometry.location.lat()
      const lng = place.geometry.location.lng()

      onChange({
        location: place.formatted_address || '',
        latitude: lat.toString(),
        longitude: lng.toString(),
      })

      mapInstanceRef.current?.setCenter({ lat, lng })
      mapInstanceRef.current?.setZoom(16)
      markerRef.current?.setPosition({ lat, lng })
    })

    if (pendingCenterRef.current) {
      const c = pendingCenterRef.current
      mapInstanceRef.current?.setCenter(c)
      markerRef.current?.setPosition(c)
      pendingCenterRef.current = null
    }

    return () => {
      if (listenerRef.current) {
        google.maps.event.removeListener(listenerRef.current)
        listenerRef.current = null
      }
    }
  }, [loaded, showMap])

  useEffect(() => {
    if (!loaded || !mapInstanceRef.current || !markerRef.current) return
    if (!latitude || !longitude) return

    const lat = Number(latitude)
    const lng = Number(longitude)
    if (isNaN(lat) || isNaN(lng)) return

    const currentPos = markerRef.current.getPosition()
    if (currentPos && currentPos.lat() === lat && currentPos.lng() === lng) return

    mapInstanceRef.current.setCenter({ lat, lng })
    mapInstanceRef.current.setZoom(16)
    markerRef.current.setPosition({ lat, lng })
  }, [latitude, longitude, loaded])

  useEffect(() => {
    if (!loaded || !mapInstanceRef.current || !latitude || !longitude) {
      if (circleRef.current) {
        circleRef.current.setMap(null)
        circleRef.current = null
      }
      return
    }

    const lat = Number(latitude)
    const lng = Number(longitude)
    if (isNaN(lat) || isNaN(lng)) return

    const km = Number(radius)
    if (!km || km <= 0) {
      if (circleRef.current) {
        circleRef.current.setMap(null)
        circleRef.current = null
      }
      return
    }

    if (!circleRef.current) {
      circleRef.current = new google.maps.Circle({
        strokeColor: '#3B82F6',
        strokeOpacity: 0.4,
        strokeWeight: 2,
        fillColor: '#3B82F6',
        fillOpacity: 0.1,
        map: mapInstanceRef.current,
      })
    }

    circleRef.current.setCenter({ lat, lng })
    circleRef.current.setRadius(km * 1000)

    const bounds = circleRef.current.getBounds()
    if (bounds) mapInstanceRef.current.fitBounds(bounds)

    return () => {
      if (circleRef.current) {
        circleRef.current.setMap(null)
        circleRef.current = null
      }
    }
  }, [loaded, latitude, longitude, radius])

  async function reverseGeocode(lat: number, lng: number) {
    onChange({ latitude: lat.toString(), longitude: lng.toString(), location: value })

    if (!window.google?.maps) return

    const geocoder = new google.maps.Geocoder()
    geocoder.geocode({ location: { lat, lng } }, (results, status) => {
      if (status === 'OK' && results?.[0]) {
        onChange({
          location: results[0].formatted_address,
          latitude: lat.toString(),
          longitude: lng.toString(),
        })
      }
    })
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    onChange({ location: e.target.value, latitude: '', longitude: '' })
  }

  return (
    <div>
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={handleInputChange}
        className={className}
        placeholder={placeholder}
      />
      {showMap && (
        <div
          ref={mapRef}
          className="mt-2 w-full rounded-lg border border-gray-300"
          style={{ height: '250px' }}
        />
      )}
    </div>
  )
}
