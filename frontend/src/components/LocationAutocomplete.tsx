import { useEffect, useRef } from 'react'

declare global {
  interface Window {
    initGoogleMaps?: () => void
  }
}

interface LocationAutocompleteProps {
  value: string
  onChange: (data: { location: string; latitude: string; longitude: string }) => void
  className?: string
  placeholder?: string
}

const API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY

export default function LocationAutocomplete({ value, onChange, className = '', placeholder }: LocationAutocompleteProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null)
  const listenerRef = useRef<google.maps.MapsEventListener | null>(null)

  useEffect(() => {
    if (!API_KEY || !inputRef.current) return

    if (window.google?.maps?.places) {
      initAutocomplete()
      return
    }

    if (document.querySelector('#google-maps-script')) {
      const check = setInterval(() => {
        if (window.google?.maps?.places) {
          clearInterval(check)
          initAutocomplete()
        }
      }, 300)
      return () => clearInterval(check)
    }

    window.initGoogleMaps = () => {
      initAutocomplete()
    }

    const script = document.createElement('script')
    script.id = 'google-maps-script'
    script.src = `https://maps.googleapis.com/maps/api/js?key=${API_KEY}&libraries=places&callback=initGoogleMaps`
    script.async = true
    script.defer = true
    document.head.appendChild(script)

    return () => {
      if (listenerRef.current) {
        google.maps.event.removeListener(listenerRef.current)
      }
    }
  }, [])

  function initAutocomplete() {
    if (!inputRef.current || !window.google?.maps?.places) return

    autocompleteRef.current = new google.maps.places.Autocomplete(inputRef.current, {
      types: ['address'],
      componentRestrictions: { country: 'co' },
    })

    listenerRef.current = autocompleteRef.current.addListener('place_changed', () => {
      const place = autocompleteRef.current?.getPlace()
      if (!place || !place.geometry?.location) return

      onChange({
        location: place.formatted_address || '',
        latitude: place.geometry.location.lat().toString(),
        longitude: place.geometry.location.lng().toString(),
      })
    })
  }

  return (
    <input
      ref={inputRef}
      type="text"
      value={value}
      onChange={(e) => onChange({ location: e.target.value, latitude: '', longitude: '' })}
      className={className}
      placeholder={placeholder}
    />
  )
}
