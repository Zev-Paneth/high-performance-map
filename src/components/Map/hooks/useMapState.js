// src/components/Map/hooks/useMapState.js
// Hook לניהול מצב המפה - סגנונות, נתונים ומצבים

import { useState, useCallback } from 'react';

export const useMapState = () => {
    // מצבי המפה
    const [mapInstance, setMapInstance] = useState(null);
    const [mapStyle, setMapStyle] = useState('osm');
    const [useMapColonies, setUseMapColonies] = useState(false);
    const [showDebugPanel, setShowDebugPanel] = useState(false);
    const [selectedFeature, setSelectedFeature] = useState(null);

    // מצבי השכבות
    const [showLayers, setShowLayers] = useState({
        points: true,
        polygons: true,
        lines: true
    });

    // נתונים
    const [points, setPoints] = useState([]);
    const [polygons, setPolygons] = useState([]);
    const [lines, setLines] = useState([]);

    // מאזיני אירועים
    const handleMapLoad = useCallback((mapData) => {
        console.log('OpenLayers מפה נטענה בהצלחה!');
        setMapInstance(mapData);
    }, []);

    const handleMapMove = useCallback((moveData) => {
        localStorage.setItem('lastMapPosition', JSON.stringify({
            center: moveData.center,
            zoom: moveData.zoom,
            style: mapStyle,
            useMapColonies,
            timestamp: Date.now()
        }));
    }, [mapStyle, useMapColonies]);

    const handleMapClick = useCallback((clickData) => {
        console.log('נלחץ על המפה:', clickData.lngLat);
        setSelectedFeature(null);
    }, []);

    // פונקציות התאמה לסגנונות
    const getPointProps = useCallback((point) => ({
        color: point.properties?.color || '#ff0000',
        radius: point.properties?.radius || 6,
    }), []);

    const getPolygonProps = useCallback((polygon) => ({
        fillColor: polygon.properties?.fillColor || '#0080ff',
        fillOpacity: polygon.properties?.fillOpacity || 0.3,
        outlineColor: polygon.properties?.outlineColor || '#005cb2',
        outlineWidth: polygon.properties?.outlineWidth || 2,
    }), []);

    const getLineProps = useCallback((line) => ({
        lineColor: line.properties?.lineColor || '#0066ff',
        lineWidth: line.properties?.lineWidth || 3,
    }), []);

    // פונקציות לניהול המצב
    const handleStyleChange = useCallback((newStyle) => {
        console.log('משנה סגנון ל:', newStyle);
        setMapStyle(newStyle);
        setUseMapColonies(false);
    }, []);

    const handleMapColoniesToggle = useCallback((enabled) => {
        setUseMapColonies(enabled);
        if (!enabled) {
            setMapStyle('osm');
        }
        console.log('MapColonies WGS84 mode:', enabled);
    }, []);

    const toggleDebugPanel = useCallback(() => {
        setShowDebugPanel(prev => !prev);
    }, []);

    const loadLastPosition = useCallback(() => {
        const saved = localStorage.getItem('lastMapPosition');
        if (saved && mapInstance) {
            try {
                const position = JSON.parse(saved);
                mapInstance.flyTo(position.center, position.zoom, { duration: 1000 });

                if (position.style && position.style !== mapStyle) {
                    setMapStyle(position.style);
                }

                if (position.useMapColonies !== undefined) {
                    setUseMapColonies(position.useMapColonies);
                }
            } catch (error) {
                console.error('Error loading last position:', error);
            }
        }
    }, [mapInstance, mapStyle]);

    const centerOnIsrael = useCallback(() => {
        if (mapInstance) {
            mapInstance.flyTo({ lng: 34.8516, lat: 31.0461 }, 8, { duration: 1500 });
        }
    }, [mapInstance]);

    return {
        // מצבים
        mapInstance,
        mapStyle,
        useMapColonies,
        showDebugPanel,
        selectedFeature,
        showLayers,
        points,
        polygons,
        lines,

        // Setters
        setMapInstance,
        setMapStyle,
        setUseMapColonies,
        setShowDebugPanel,
        setSelectedFeature,
        setShowLayers,
        setPoints,
        setPolygons,
        setLines,

        // מאזיני אירועים
        handleMapLoad,
        handleMapMove,
        handleMapClick,

        // פונקציות התאמה
        getPointProps,
        getPolygonProps,
        getLineProps,

        // פונקציות פעולה
        handleStyleChange,
        handleMapColoniesToggle,
        toggleDebugPanel,
        loadLastPosition,
        centerOnIsrael
    };
};