import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Map } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

// ייבוא השכבות
import PointsLayer from '../layers/PointsLayer';
import PolygonsLayer from '../layers/PolygonsLayer';
import LinesLayer from '../layers/LinesLayer';

// סגנון בסיסי למפה עם תמיכה בפונטים - עודכן
const BASIC_STYLE = {
    version: 8,
    // הוספת פונטים - חשוב למניעת שגיאות
    glyphs: "https://fonts.openmaptiles.org/{fontstack}/{range}.pbf",
    sources: {
        'osm-tiles': {
            type: 'raster',
            tiles: [
                'https://a.tile.openstreetmap.org/{z}/{x}/{y}.png',
                'https://b.tile.openstreetmap.org/{z}/{x}/{y}.png',
                'https://c.tile.openstreetmap.org/{z}/{x}/{y}.png'
            ],
            tileSize: 256,
            attribution: '&copy; OpenStreetMap contributors'
        }
    },
    layers: [
        {
            id: 'background',
            type: 'background',
            paint: {
                'background-color': '#f0f0f0'
            }
        },
        {
            id: 'osm-tiles-layer',
            type: 'raster',
            source: 'osm-tiles',
        }
    ]
};

const HighPerformanceMap = ({
                                // נתוני מיקום התחלתי
                                initialCenter = { lng: 34.8516, lat: 31.0461 },
                                initialZoom = 8,
                                mapStyle = BASIC_STYLE,

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

    // טיפול באירוע תزוזת המפה
    const handleMapMove = useCallback(() => {
        if (!mapRef.current) return;

        const center = mapRef.current.getCenter();
        const zoom = mapRef.current.getZoom();

        setCurrentPosition({
            lng: center.lng,
            lat: center.lat
        });
        setCurrentZoom(zoom);

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

    // אתחול המפה - useEffect עם dependency array ריק
    useEffect(() => {
        if (mapContainerRef.current && !mapRef.current) {
            try {
                // וידוא שהסגנון כולל פונטים - חשוב!
                const styleWithFonts = {
                    ...mapStyle,
                    glyphs: mapStyle.glyphs || "https://fonts.openmaptiles.org/{fontstack}/{range}.pbf"
                };

                const map = new Map({
                    container: mapContainerRef.current,
                    style: styleWithFonts, // שימוש בסגנון המעודכן
                    center: [initialCenter.lng, initialCenter.lat],
                    zoom: initialZoom,
                    attributionControl: false,
                    renderWorldCopies: false,
                });

                // שמירת אובייקט המפה ב-ref
                mapRef.current = map;

                // הוספת מאזינים לאירועים
                map.on('load', () => {
                    console.log('Map loaded successfully with fonts support');
                    setMapInstance(map);
                    setMapReady(true);

                    // קריאה ל-onMapLoad רק פעם אחת כאן
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
                });

            } catch (error) {
                console.error('Error creating map:', error);
            }
        }

        // ניקוי בעת סיום - קריטי למניעת דליפות זיכרון
        return () => {
            if (mapRef.current) {
                try {
                    if (mapRef.current.loaded()) {
                        // הסרת מאזינים
                        mapRef.current.off('move', handleMapMove);
                        mapRef.current.off('click', handleMapClick);
                    }

                    // הסרת המפה
                    mapRef.current.remove();
                } catch (error) {
                    console.error('Error cleaning up map:', error);
                } finally {
                    mapRef.current = null;
                }
            }
        };
    }, []); // dependency array ריק - רק פעם אחת

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
                    backgroundColor: '#ff0000', // צבע אדום זמני לבדיקה
                    minHeight: '500px' // גובה מינימום
                }}
            />

            {/* שכבות המפה - נרנדרו רק כאשר המפה מוכנה */}
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

            {/* תצוגת מידע ומצב טעינה */}
            <div
                style={{
                    position: 'absolute',
                    bottom: '10px',
                    left: '10px',
                    backgroundColor: 'rgba(255, 255, 255, 0.8)',
                    padding: '5px',
                    borderRadius: '4px',
                    fontSize: '12px',
                    zIndex: 10
                }}
            >
                <span>
                    coordinates: {currentPosition.lat.toFixed(4)}, {currentPosition.lng.toFixed(4)} | zoom: {currentZoom.toFixed(2)}
                </span>
            </div>
        </div>
    );
};

export default HighPerformanceMap;