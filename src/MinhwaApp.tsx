import React, { useState, useRef, useEffect, useCallback } from 'react';
import html2canvas from 'html2canvas';
import { generateMinhwaPainting } from './geminiService';
import { Loader } from '@googlemaps/js-api-loader';

const GOOGLE_MAPS_API_KEY = process.env.REACT_APP_GOOGLE_MAPS_API_KEY || "";

const loader = new Loader({
    apiKey: GOOGLE_MAPS_API_KEY,
    version: "beta",
    libraries: ["places", "marker", "geocoding"],
});

const MinhwaApp: React.FC = () => {
    const [address, setAddress] = useState<string>('');
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [mapInitialized, setMapInitialized] = useState<boolean>(false);
    const [isGeneratingPainting, setIsGeneratingPainting] = useState<boolean>(false);
    const [painting, setPainting] = useState<string>('');

    const mapRef = useRef<HTMLDivElement>(null);
    const autocompleteRef = useRef<HTMLInputElement>(null);

    const initMap = useCallback(async (location: google.maps.LatLngLiteral) => {
        if (!mapRef.current) return;
        const { Map } = await loader.importLibrary('maps');
        const mapOptions: google.maps.MapOptions = {
            center: location,
            zoom: 20,
            mapId: 'DEMO_MAP_ID',
            mapTypeId: 'satellite',
            tilt: 67.5,
            heading: 0,
            streetViewControl: false,
            mapTypeControl: false,
            fullscreenControl: false,
            zoomControl: true,
        };
        new Map(mapRef.current, mapOptions);
        setMapInitialized(true);
    }, []);

    useEffect(() => {
        loader.load().then(() => {
            if (autocompleteRef.current) {
                const autocomplete = new google.maps.places.Autocomplete(autocompleteRef.current);
                autocomplete.addListener('place_changed', () => {
                    const place = autocomplete.getPlace();
                    if (place.geometry?.location) {
                        setAddress(place.formatted_address || '');
                        initMap(place.geometry.location.toJSON());
                    }
                });
            }
        });
    }, [initMap]);

    const handleSearch = async () => {
        if (!address.trim()) {
            setError("Please enter an address.");
            return;
        }
        setIsLoading(true);
        setError(null);
        try {
            const { Geocoder } = await loader.importLibrary('geocoding');
            const geocoder = new Geocoder();
            const { results } = await geocoder.geocode({ address });
            if (results && results[0]) {
                const location = results[0].geometry.location;
                initMap(location.toJSON());
            } else {
                setError(`Could not find a location for "${address}".`);
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : "An unknown error occurred.");
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleGeneratePainting = async () => {
        if (!mapRef.current) return;
        
        setIsGeneratingPainting(true);
        setError(null);
        
        try {
            const canvas = await html2canvas(mapRef.current, { useCORS: true, allowTaint: true });
            const imageDataUrl = canvas.toDataURL('image/png');
            
            const paintingDataUrl = await generateMinhwaPainting(imageDataUrl);
            setPainting(paintingDataUrl);
            
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to generate the painting.");
        } finally {
            setIsGeneratingPainting(false);
        }
    };
    
    return (
        <div style={{ padding: '20px', maxWidth: '800px', margin: 'auto' }}>
            <h1>Paint A Place</h1>
            <p>Enter an address to turn its satellite view into a painting.</p>
            
            <div style={{ display: 'flex', marginBottom: '10px' }}>
                <input
                    ref={autocompleteRef}
                    type="text"
                    onChange={(e) => setAddress(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                    style={{ flexGrow: 1, padding: '8px' }}
                    placeholder="Enter a location"
                />
                <button onClick={handleSearch} disabled={isLoading} style={{ padding: '8px' }}>
                    {isLoading ? 'Searching...' : 'Search'}
                </button>
            </div>

            {error && <p style={{ color: 'red' }}>{error}</p>}
            
            <div ref={mapRef} style={{ height: '500px', backgroundColor: '#e0e0e0', marginBottom: '10px' }}>
                {!mapInitialized && "Map will appear here"}
            </div>
            
            {mapInitialized && (
                <button onClick={handleGeneratePainting} disabled={isGeneratingPainting} style={{ padding: '10px 20px', width: '100%' }}>
                    {isGeneratingPainting ? 'Creating Masterpiece...' : 'Create Painting'}
                </button>
            )}

            {painting && (
                <div style={{ marginTop: '20px' }}>
                    <h2>Your Painting:</h2>
                    <img src={painting} alt="Generated painting" style={{ maxWidth: '100%', border: '1px solid #ccc' }} />
                </div>
            )}
        </div>
    );
};

export default MinhwaApp;
