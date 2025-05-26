import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Map } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

// ייבוא השכבות
import PointsLayer from '../layers/PointsLayer';
import PolygonsLayer from '../layers/PolygonsLayer';
import LinesLayer from '../layers/LinesLayer';

// ייבוא הסגנונות - כולל החדש
import { OSM_STYLE } from '../styles/MapStyles';

const HighPerformanceMap = ({
                                // נתוני מיקום התחלתי
                                initialCenter = { lng: 34.8516, lat: 31.0461 },
                                initialZoom = 8,
                                mapStyle = OSM_STYLE, // ברירת מחדל OSM (כמו קודם)

                                // נתוני הישויות
                                points = [],
                                polygons = [],
                                lines = [],

                                // מאזינים לאירועים
                                onMapLoad,
                                onMapMove,
                                onMapClick,
                                onPointClick,
                                onPolygonClick,
                                onLineClick,

                                // הגדרות נוספות
                                enableClustering = true,
                                pointsVisible = true,
                                polygonsVisible = true,
                                linesVisible = true,

                                // התאמות נתונים
                                getPointProps,
                                getPolygonProps,
                                getLineProps,
                            }) => {
    // refs למפה
    const mapRef = useRef(null);
    const mapContainerRef = useRef(null);
    const outerContainerRef = useRef(null);

    // מצבים
    const [mapInstance, setMapInstance] = useState(null);
    const [mapReady, setMapReady] = useState(false);
    const [currentPosition, setCurrentPosition] = useState(initialCenter);
    const [currentZoom, setCurrentZoom] = useState(initialZoom);
    const [currentMapStyle, setCurrentMapStyle] = useState(mapStyle);

    // טיפול באירוע תזוזת המפה
    const handleMapMove = useCallback(() => {
        if (!mapRef.current) return;

        const center = mapRef.current.getCenter();
        const zoom = mapRef.current.getZoom();

        requestAnimationFrame(() => {
            setCurrentPosition({
                lng: center.lng,
                lat: center.lat
            });
            setCurrentZoom(zoom);
        });

        if (onMapMove) {
            onMapMove({
                center: { lng: center.lng, lat: center.lat },
                zoom,
                bounds: mapRef.current.getBounds()
            });
        }
    }, [onMapMove]);

    // טיפול בלחיצה על המפה
    const handleMapClick = useCallback((e) => {
        if (onMapClick) {
            onMapClick({
                lngLat: e.lngLat,
                point: e.point,
                originalEvent: e.originalEvent
            });
        }
    }, [onMapClick]);

    // פונקציה לפונה למיקום מסוים
    const flyTo = useCallback((center, zoom = 12, options = {}) => {
        if (mapRef.current && mapRef.current.loaded()) {
            mapRef.current.flyTo({
                center: [center.lng || center.lon || center.x, center.lat || center.y],
                zoom,
                ...options
            });
        }
    }, []);

    // אתחול המפה
    useEffect(() => {
        if (mapContainerRef.current && !mapRef.current) {
            try {
                console.log('Initializing map with style:', mapStyle.name || 'Unknown style');

                const map = new Map({
                    container: mapContainerRef.current,
                    style: mapStyle,
                    center: [initialCenter.lng, initialCenter.lat],
                    zoom: initialZoom,
                    attributionControl: false,
                    renderWorldCopies: false,
                });

                // שמירת אובייקט המפה ב-ref
                mapRef.current = map;
                setCurrentMapStyle(mapStyle);

                // הוספת מאזינים לאירועים
                map.on('load', () => {
                    console.log('Map loaded successfully:', mapStyle.name || 'Unknown style');
                    setMapInstance(map);
                    setMapReady(true);

                    if (onMapLoad) {
                        onMapLoad({
                            map,
                            flyTo: (center, zoom, options) => {
                                map.flyTo({
                                    center: [center.lng || center.lon || center.x, center.lat || center.y],
                                    zoom,
                                    ...options
                                });
                            },
                            getZoom: () => map.getZoom(),
                            getCenter: () => map.getCenter(),
                            getBounds: () => map.getBounds()
                        });
                    }
                });

                // מאזינים נוספים
                map.on('move', handleMapMove);
                map.on('click', handleMapClick);

                // טיפול בשגיאות
                map.on('error', (e) => {
                    console.error('Map error:', e);

                    // אם השגיאה קשורה לפונטים ואנחנו ב-WMTS - נתעלם
                    if (e.error && e.error.message &&
                        mapStyle.name && mapStyle.name.includes('WMTS') &&
                        (e.error.message.includes('glyphs') ||
                            e.error.message.includes('font') ||
                            e.error.message.includes('pbf'))) {
                        console.warn('Font-related error ignored for WMTS:', e.error.message);
                        return;
                    }
                });

                // מאזין לטעינת אריחים
                map.on('sourcedata', (e) => {
                    if (e.isSourceLoaded) {
                        console.log('Tiles loaded for source:', e.sourceId);
                    }
                });

            } catch (error) {
                console.error('Error creating map:', error);
            }
        }

        // ניקוי בעת סיום
        return () => {
            if (mapRef.current) {
                try {
                    if (mapRef.current.loaded()) {
                        mapRef.current.off('move', handleMapMove);
                        mapRef.current.off('click', handleMapClick);
                    }
                    mapRef.current.remove();
                } catch (error) {
                    console.error('Error cleaning up map:', error);
                } finally {
                    mapRef.current = null;
                }
            }
        };
    }, [initialCenter.lng, initialCenter.lat, initialZoom, handleMapMove, handleMapClick, mapStyle]);

    // עדכון סגנון המפה כאשר הוא משתנה
    useEffect(() => {
        if (mapRef.current && mapRef.current.loaded() && mapStyle !== currentMapStyle) {
            try {
                console.log('Updating map style to:', mapStyle.name || 'Unknown style');
                mapRef.current.setStyle(mapStyle);
                setCurrentMapStyle(mapStyle);

                // לאחר שינוי סגנון, המפה תטען מחדש
                mapRef.current.once('styledata', () => {
                    console.log('Style updated successfully');
                    // השכבות יתעדכנו אוטומטית ע"י useEffect של השכבות
                });
            } catch (error) {
                console.error('Error updating map style:', error);
            }
        }
    }, [mapStyle, currentMapStyle]);

    // פונקציה לזיהוי סוג הסגנון הנוכחי
    const getStyleType = () => {
        if (!mapStyle || !mapStyle.name) return 'Unknown';

        const name = mapStyle.name.toLowerCase();
        if (name.includes('wmts')) return 'WMTS';
        if (name.includes('satellite')) return 'Satellite';
        if (name.includes('terrain')) return 'Terrain';
        if (name.includes('openstreetmap') || name.includes('osm')) return 'OSM';
        return 'Custom';
    };

    return (
        <div
            style={{
                position: 'relative',
                width: '100%',
                height: '100%',
            }}
            ref={outerContainerRef}
        >
            {/* מכל המפה */}
            <div
                ref={mapContainerRef}
                style={{
                    width: '100%',
                    height: '100%',
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    backgroundColor: '#f0f0f0',
                    minHeight: '500px'
                }}
            />

            {/* שכבות המפה */}
            {mapReady && mapInstance && (
                <>
                    {/* שכבת נקודות */}
                    {points.length > 0 && (
                        <PointsLayer
                            map={mapInstance}
                            data={points}
                            layerId="high-performance-points"
                            sourceId="high-performance-points-source"
                            visible={pointsVisible}
                            enableClustering={enableClustering}
                            getPointProps={getPointProps}
                            onClick={onPointClick}
                        />
                    )}

                    {/* שכבת פוליגונים */}
                    {polygons.length > 0 && (
                        <PolygonsLayer
                            map={mapInstance}
                            data={polygons}
                            layerId="high-performance-polygons"
                            sourceId="high-performance-polygons-source"
                            visible={polygonsVisible}
                            getPolygonProps={getPolygonProps}
                            onClick={onPolygonClick}
                            simplifyTolerance={0.001}
                        />
                    )}

                    {/* שכבת קווים */}
                    {lines.length > 0 && (
                        <LinesLayer
                            map={mapInstance}
                            data={lines}
                            layerId="high-performance-lines"
                            sourceId="high-performance-lines-source"
                            visible={linesVisible}
                            getLineProps={getLineProps}
                            onClick={onLineClick}
                            simplifyTolerance={0.001}
                        />
                    )}
                </>
            )}

            {/* תצוגת מידע */}
            <div
                style={{
                    position: 'absolute',
                    bottom: '10px',
                    left: '10px',
                    backgroundColor: 'rgba(255, 255, 255, 0.9)',
                    padding: '8px 12px',
                    borderRadius: '4px',
                    fontSize: '12px',
                    zIndex: 10,
                    fontFamily: 'monospace',
                    border: '1px solid #ccc'
                }}
            >
                <div>📍 {currentPosition.lat.toFixed(4)}, {currentPosition.lng.toFixed(4)}</div>
                <div>🔍 Zoom: {currentZoom.toFixed(2)}</div>
                <div>🗺️ {getStyleType()}</div>
            </div>
        </div>
    );
};

export default HighPerformanceMap;