// src/components/OpenLayersMapExample.jsx
import React, { useState, useCallback, useEffect } from 'react';
import OpenLayersMap from './Map/core/OpenLayersMap.jsx';
import StyleSelector from './Map/StyleSelector.jsx';
import { getMapStyle } from './Map/styles';

// ייבוא ה-hooks החדשים
import { useMapInteractions, useSavedLocations } from './Map/hooks/useMapInteractions.js';
import { useMapColoniesWGS84Background } from './Map/hooks/useMapColoniesWGS84.js';

const OpenLayersMapExample = () => {
    // מצבים
    const [points, setPoints] = useState([]);
    const [polygons, setPolygons] = useState([]);
    const [lines, setLines] = useState([]);
    const [selectedFeature, setSelectedFeature] = useState(null);
    const [mapInstance, setMapInstance] = useState(null);
    const [mapStyle, setMapStyle] = useState('osm'); // ברירת מחדל OSM
    const [useMapColonies, setUseMapColonies] = useState(false);
    const [showLayers, setShowLayers] = useState({
        points: true,
        polygons: true,
        lines: true
    });

    // Hook עבור MapColonies WGS84
    const {
        mapStyle: mapColoniesStyle,
        openLayersConfig: mapColoniesConfig,
        activeLayerId: activeMapColoniesLayer,
        backgroundLayers: mapColoniesLayers,
        setActiveLayer: setActiveMapColoniesLayer,
        loadBackgroundLayers: loadMapColoniesLayers,
        getLayerBounds: getMapColoniesLayerBounds,
        loading: mapColoniesLoading,
        error: mapColoniesError
    } = useMapColoniesWGS84Background();

    // שימוש ב-hooks המותאמים
    const {
        handlePointClick,
        handlePolygonClick,
        handleLineClick,
        flyToSelectedFeature
    } = useMapInteractions(mapInstance, setSelectedFeature, {
        autoFlyTo: true,
        flyToOptions: { duration: 1500 },
        featureTypeMapping: {
            'major_city': 'city',
            'capital': 'city',
            'city': 'city',
            'metropolitan_area': 'area',
            'highway': 'road'
        }
    });

    const {
        saveCurrentLocation,
        loadSavedLocation,
        getSavedLocations,
        deleteSavedLocation
    } = useSavedLocations(mapInstance);

    // נתוני דוגמה - ערים בישראל (WGS84)
    const israelCities = [
        {
            coordinates: [34.7818, 32.0853],
            properties: {
                name: 'תל אביב',
                population: 460000,
                type: 'major_city',
                color: '#ff0000',
                radius: 12
            }
        },
        {
            coordinates: [35.2137, 31.7683],
            properties: {
                name: 'ירושלים',
                population: 936000,
                type: 'capital',
                color: '#0000ff',
                radius: 15
            }
        },
        {
            coordinates: [34.9896, 32.7940],
            properties: {
                name: 'חיפה',
                population: 285000,
                type: 'major_city',
                color: '#00ff00',
                radius: 10
            }
        },
        {
            coordinates: [34.9518, 32.0853],
            properties: {
                name: 'נתניה',
                population: 230000,
                type: 'city',
                color: '#ffaa00',
                radius: 8
            }
        },
        {
            coordinates: [34.8516, 31.0461],
            properties: {
                name: 'באר שבע',
                population: 209000,
                type: 'city',
                color: '#ff6600',
                radius: 8
            }
        }
    ];

    // פוליגון דוגמה - אזור תל אביב (WGS84)
    const telAvivArea = {
        type: 'Feature',
        geometry: {
            type: 'Polygon',
            coordinates: [[
                [34.7, 32.0],
                [34.9, 32.0],
                [34.9, 32.2],
                [34.7, 32.2],
                [34.7, 32.0]
            ]]
        },
        properties: {
            name: 'אזור תל אביב',
            type: 'metropolitan_area',
            fillColor: '#ff0000',
            fillOpacity: 0.2,
            outlineColor: '#ff0000',
            outlineWidth: 2
        }
    };

    // קו דוגמה - כביש 1 (WGS84)
    const highway1 = {
        type: 'Feature',
        geometry: {
            type: 'LineString',
            coordinates: [
                [34.7818, 32.0853], // תל אביב
                [34.8516, 31.8853],
                [35.0000, 31.8000],
                [35.2137, 31.7683]  // ירושלים
            ]
        },
        properties: {
            name: 'כביש 1',
            type: 'highway',
            lineColor: '#0066ff',
            lineWidth: 4
        }
    };

    // טעינת נתוני דוגמה
    useEffect(() => {
        setTimeout(() => {
            setPoints(israelCities);
            setPolygons([telAvivArea]);
            setLines([highway1]);
        }, 500);
    }, []);

    // אתחול MapColonies אם נבחר
    useEffect(() => {
        if (useMapColonies && mapColoniesLayers.length === 0 && !mapColoniesLoading) {
            console.log('Auto-loading MapColonies WGS84 background layers...');
            loadMapColoniesLayers()
                .then(() => {
                    console.log('MapColonies WGS84 layers loaded successfully');
                })
                .catch(err => {
                    console.error('Failed to load MapColonies WGS84 layers:', err);
                });
        }
    }, [useMapColonies, mapColoniesLayers.length, mapColoniesLoading, loadMapColoniesLayers]);

    // מאזין לטעינת המפה
    const handleMapLoad = useCallback((mapData) => {
        console.log('OpenLayers מפה נטענה בהצלחה!');
        setMapInstance(mapData);
    }, []);

    // מאזין לתזוזת המפה
    const handleMapMove = useCallback((moveData) => {
        localStorage.setItem('lastMapPosition', JSON.stringify({
            center: moveData.center,
            zoom: moveData.zoom,
            style: mapStyle,
            useMapColonies,
            activeMapColoniesLayer,
            timestamp: Date.now()
        }));
    }, [mapStyle, useMapColonies, activeMapColoniesLayer]);

    // מאזין ללחיצה על המפה
    const handleMapClick = useCallback((clickData) => {
        console.log('נלחץ על המפה:', clickData.lngLat);
        setSelectedFeature(null);
    }, []);

    // פונקציות התאמה לנתונים
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

    // פונקציה לטעינת מיקום אחרון
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

                if (position.activeMapColoniesLayer && position.useMapColonies) {
                    setActiveMapColoniesLayer(position.activeMapColoniesLayer);
                }
            } catch (error) {
                console.error('Error loading last position:', error);
            }
        }
    }, [mapInstance, mapStyle, setActiveMapColoniesLayer]);

    // טיפול בשינוי סגנון
    const handleStyleChange = useCallback((newStyle) => {
        console.log('משנה סגנון ל:', newStyle);
        setMapStyle(newStyle);
        setUseMapColonies(false); // כשבוחרים סגנון רגיל, מבטלים MapColonies
    }, []);

    // טיפול בשינוי שכבת MapColonies
    const handleMapColoniesLayerChange = useCallback((layerId) => {
        setActiveMapColoniesLayer(layerId);
        setUseMapColonies(true);
        console.log('משנה שכבת MapColonies ל:', layerId);
    }, [setActiveMapColoniesLayer]);

    // טיפול במעבר ל-MapColonies או מסגנונות רגילים
    const handleMapColoniesToggle = useCallback((enabled) => {
        setUseMapColonies(enabled);
        if (!enabled) {
            setMapStyle('osm'); // חזרה ל-OSM כברירת מחדל
        }
        console.log('MapColonies WGS84 mode:', enabled);
    }, []);

    // קביעת הסגנון הנוכחי למפה
    const currentMapStyle = useMapColonies ? mapColoniesStyle : getMapStyle(mapStyle);

    return (
        <div style={{ height: '100%', width: '100%' }}>
            {/* פאנל בקרה */}
            <div style={{
                position: 'absolute',
                top: '10px',
                left: '10px',
                zIndex: 1000,
                backgroundColor: 'white',
                padding: '15px',
                borderRadius: '8px',
                boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
                minWidth: '320px',
                maxHeight: '85vh',
                overflowY: 'auto'
            }}>
                <h3 style={{ margin: '0 0 15px 0', color: '#333' }}>
                    🗺️ OpenLayers + MapColonies WGS84
                </h3>

                {/* מתג MapColonies */}
                <div style={{
                    marginBottom: '15px',
                    padding: '15px',
                    backgroundColor: useMapColonies ? '#e8f5e8' : '#f8f9fa',
                    borderRadius: '8px',
                    border: `2px solid ${useMapColonies ? '#4caf50' : '#dee2e6'}`
                }}>
                    <label style={{
                        display: 'flex',
                        alignItems: 'center',
                        cursor: 'pointer',
                        fontWeight: 'bold'
                    }}>
                        <input
                            type="checkbox"
                            checked={useMapColonies}
                            onChange={(e) => handleMapColoniesToggle(e.target.checked)}
                            style={{ marginLeft: '8px', transform: 'scale(1.3)' }}
                        />
                        <span style={{ color: useMapColonies ? '#2e7d32' : '#666' }}>
                            🌍 שימוש ב-MapColonies WGS84
                        </span>
                    </label>

                    {useMapColonies && (
                        <div style={{ marginTop: '10px', fontSize: '12px', color: '#2e7d32' }}>
                            ✅ מצב WGS84 פעיל - שכבות ממערכת MapColonies
                        </div>
                    )}
                </div>

                {/* בוחר שכבות MapColonies */}
                {useMapColonies && (
                    <div style={{ marginBottom: '15px' }}>
                        <div style={{ marginBottom: '8px', fontWeight: 'bold', fontSize: '14px' }}>
                            🌍 שכבות MapColonies WGS84:
                        </div>

                        {mapColoniesLoading && (
                            <div style={{
                                padding: '15px',
                                textAlign: 'center',
                                backgroundColor: '#f8f9fa',
                                borderRadius: '6px',
                                border: '1px solid #dee2e6'
                            }}>
                                <div style={{ marginBottom: '8px', fontSize: '16px' }}>🔄</div>
                                <div style={{ fontSize: '14px', fontWeight: '500' }}>
                                    טוען שכבות MapColonies WGS84...
                                </div>
                            </div>
                        )}

                        {mapColoniesError && (
                            <div style={{
                                padding: '15px',
                                backgroundColor: '#f8d7da',
                                borderRadius: '6px',
                                border: '1px solid #f5c6cb',
                                color: '#721c24'
                            }}>
                                <div style={{ marginBottom: '8px', fontSize: '16px' }}>⚠️</div>
                                <div style={{ fontSize: '14px', fontWeight: '500', marginBottom: '8px' }}>
                                    שגיאה בטעינת שכבות MapColonies
                                </div>
                                <div style={{ fontSize: '12px', marginBottom: '12px' }}>
                                    {mapColoniesError}
                                </div>
                                <button
                                    onClick={() => loadMapColoniesLayers()}
                                    style={{
                                        padding: '6px 12px',
                                        backgroundColor: '#721c24',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '4px',
                                        cursor: 'pointer',
                                        fontSize: '12px'
                                    }}
                                >
                                    🔄 נסה שוב
                                </button>
                            </div>
                        )}

                        {!mapColoniesLoading && !mapColoniesError && mapColoniesLayers.length > 0 && (
                            <div style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(2, 1fr)',
                                gap: '6px'
                            }}>
                                {mapColoniesLayers.map(layer => {
                                    const isActive = activeMapColoniesLayer === layer.id;
                                    return (
                                        <button
                                            key={layer.id}
                                            onClick={() => handleMapColoniesLayerChange(layer.id)}
                                            style={{
                                                padding: '12px 8px',
                                                backgroundColor: isActive ? '#4caf50' : '#f8f9fa',
                                                color: isActive ? 'white' : '#333',
                                                border: isActive ? '2px solid #2e7d32' : '2px solid #dee2e6',
                                                borderRadius: '8px',
                                                cursor: 'pointer',
                                                fontSize: '12px',
                                                textAlign: 'center',
                                                fontWeight: isActive ? '600' : '500',
                                                transition: 'all 0.2s ease'
                                            }}
                                        >
                                            🛰️ {layer.config?.name || layer.id}
                                        </button>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                )}

                {/* בוחר סגנונות רגילים - כשלא משתמשים ב-MapColonies */}
                {!useMapColonies && (
                    <StyleSelector
                        currentStyle={mapStyle}
                        onStyleChange={handleStyleChange}
                        layout="buttons"
                        showIcons={true}
                        showDescriptions={false}
                        compact={false}
                        columns={2}
                    />
                )}

                {/* בקרת שכבות נתונים */}
                <div style={{ marginBottom: '15px' }}>
                    <strong>שכבות נתונים:</strong>
                    <div style={{ marginTop: '8px' }}>
                        {Object.entries(showLayers).map(([layer, visible]) => (
                            <label key={layer} style={{
                                display: 'flex',
                                alignItems: 'center',
                                marginBottom: '8px',
                                cursor: 'pointer',
                                padding: '8px',
                                backgroundColor: visible ? '#f0f8ff' : '#f8f9fa',
                                borderRadius: '4px',
                                border: `1px solid ${visible ? '#b3d9ff' : '#dee2e6'}`
                            }}>
                                <input
                                    type="checkbox"
                                    checked={visible}
                                    onChange={(e) => setShowLayers(prev => ({
                                        ...prev,
                                        [layer]: e.target.checked
                                    }))}
                                    style={{
                                        marginLeft: '8px',
                                        transform: 'scale(1.2)'
                                    }}
                                />
                                <span style={{ fontSize: '14px', fontWeight: visible ? '500' : 'normal' }}>
                                    {layer === 'points' ? '🏙️ ערים' :
                                        layer === 'polygons' ? '🗺️ אזורים' : '🛣️ דרכים'}
                                </span>
                            </label>
                        ))}
                    </div>
                </div>

                {/* סטטיסטיקות */}
                <div style={{ marginBottom: '15px' }}>
                    <strong>מידע טכני:</strong>
                    <div style={{
                        fontSize: '12px',
                        marginTop: '8px',
                        backgroundColor: '#f8f9fa',
                        padding: '12px',
                        borderRadius: '6px',
                        border: '1px solid #dee2e6'
                    }}>
                        <div style={{ marginBottom: '4px' }}>
                            🗺️ <strong>מנוע:</strong> OpenLayers
                        </div>
                        <div style={{ marginBottom: '4px' }}>
                            📐 <strong>הקרנה:</strong> {useMapColonies ? 'WGS84 → Web Mercator' : 'Web Mercator'}
                        </div>
                        <div style={{ marginBottom: '4px' }}>
                            🌍 <strong>רקע:</strong> {useMapColonies ? `MapColonies (${activeMapColoniesLayer})` : mapStyle.toUpperCase()}
                        </div>
                        <div style={{ marginBottom: '4px' }}>
                            📍 <strong>ערים:</strong> {points.length}
                        </div>
                        <div style={{ marginBottom: '4px' }}>
                            🗺️ <strong>אזורים:</strong> {polygons.length}
                        </div>
                        <div>
                            🛣️ <strong>דרכים:</strong> {lines.length}
                        </div>
                    </div>
                </div>

                {/* מידע על פיצ'ר נבחר */}
                {selectedFeature && (
                    <div style={{
                        backgroundColor: '#e8f4fd',
                        padding: '12px',
                        borderRadius: '6px',
                        marginBottom: '15px',
                        border: '1px solid #b3d9ff'
                    }}>
                        <strong style={{ color: '#0066cc' }}>✨ נבחר:</strong>
                        <div style={{ marginTop: '8px' }}>
                            <div style={{ marginBottom: '4px' }}>
                                <strong>סוג:</strong> {selectedFeature.type}
                            </div>
                            <div style={{ marginBottom: '4px' }}>
                                <strong>שם:</strong> {selectedFeature.data.properties?.name}
                            </div>
                            {selectedFeature.data.properties?.population && (
                                <div style={{ marginBottom: '4px' }}>
                                    <strong>אוכלוסיה:</strong> {selectedFeature.data.properties.population.toLocaleString()}
                                </div>
                            )}
                        </div>

                        <button
                            onClick={() => {
                                flyToSelectedFeature(selectedFeature.data, {
                                    duration: 1500
                                });
                            }}
                            style={{
                                width: '100%',
                                padding: '8px 12px',
                                backgroundColor: '#0066cc',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                fontSize: '13px',
                                fontWeight: '500'
                            }}
                        >
                            🎯 מרכז במפה
                        </button>
                    </div>
                )}

                {/* כפתורי ניווט */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <button
                        onClick={() => {
                            if (mapInstance) {
                                // טיסה למרכז ישראל ב-WGS84
                                mapInstance.flyTo({ lng: 34.8516, lat: 31.0461 }, 8, { duration: 1500 });
                            }
                        }}
                        style={{
                            padding: '12px 15px',
                            backgroundColor: '#007cba',
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontSize: '14px',
                            fontWeight: '500'
                        }}
                    >
                        🇮🇱 מרכז ישראל (WGS84)
                    </button>

                    <button
                        onClick={loadLastPosition}
                        style={{
                            padding: '12px 15px',
                            backgroundColor: '#28a745',
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontSize: '14px',
                            fontWeight: '500'
                        }}
                    >
                        📍 מיקום אחרון
                    </button>

                    <button
                        onClick={() => {
                            const name = `מיקום_${new Date().toLocaleTimeString('he-IL')}`;
                            if (saveCurrentLocation(name)) {
                                alert(`המיקום נשמר בשם: ${name}`);
                            }
                        }}
                        style={{
                            padding: '12px 15px',
                            backgroundColor: '#ffc107',
                            color: 'black',
                            border: 'none',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontSize: '14px',
                            fontWeight: '500'
                        }}
                    >
                        💾 שמור מיקום
                    </button>

                    {/* כפתור טעינת שכבות MapColonies */}
                    {useMapColonies && (
                        <button
                            onClick={() => loadMapColoniesLayers()}
                            disabled={mapColoniesLoading}
                            style={{
                                padding: '12px 15px',
                                backgroundColor: mapColoniesLoading ? '#6c757d' : '#6f42c1',
                                color: 'white',
                                border: 'none',
                                borderRadius: '6px',
                                cursor: mapColoniesLoading ? 'not-allowed' : 'pointer',
                                fontSize: '14px',
                                fontWeight: '500'
                            }}
                        >
                            {mapColoniesLoading ? '⏳ טוען...' : '🔄 רענן שכבות'}
                        </button>
                    )}
                </div>

                {/* רשימת מיקומים שמורים */}
                <div style={{ marginTop: '15px' }}>
                    <strong>מיקומים שמורים:</strong>
                    <div style={{ marginTop: '8px', maxHeight: '120px', overflowY: 'auto' }}>
                        {Object.entries(getSavedLocations()).map(([name, location]) => (
                            <div key={name} style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                padding: '6px 8px',
                                backgroundColor: '#f8f9fa',
                                marginBottom: '4px',
                                borderRadius: '4px',
                                fontSize: '12px',
                                border: '1px solid #dee2e6'
                            }}>
                                <span
                                    style={{ cursor: 'pointer', flex: 1 }}
                                    onClick={() => loadSavedLocation(name)}
                                    title="לחץ לניווט למיקום"
                                >
                                    📍 {name}
                                </span>
                                <button
                                    onClick={() => {
                                        if (confirm(`למחוק את המיקום "${name}"?`)) {
                                            deleteSavedLocation(name);
                                        }
                                    }}
                                    style={{
                                        background: 'none',
                                        border: 'none',
                                        color: '#dc3545',
                                        cursor: 'pointer',
                                        fontSize: '12px',
                                        padding: '2px 6px'
                                    }}
                                    title="מחק מיקום"
                                >
                                    🗑️
                                </button>
                            </div>
                        ))}
                        {Object.keys(getSavedLocations()).length === 0 && (
                            <div style={{
                                textAlign: 'center',
                                color: '#666',
                                fontSize: '12px',
                                fontStyle: 'italic',
                                padding: '8px'
                            }}>
                                אין מיקומים שמורים
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* המפה */}
            <OpenLayersMap
                // הגדרות בסיסיות
                initialCenter={{ lng: 34.8516, lat: 31.0461 }}
                initialZoom={8}
                mapStyle={currentMapStyle}

                // נתונים - מותנים בהגדרות התצוגה
                points={showLayers.points ? points : []}
                polygons={showLayers.polygons ? polygons : []}
                lines={showLayers.lines ? lines : []}

                // מאזיני אירועים
                onMapLoad={handleMapLoad}
                onMapMove={handleMapMove}
                onMapClick={handleMapClick}
                onPointClick={handlePointClick}
                onPolygonClick={handlePolygonClick}
                onLineClick={handleLineClick}

                // הגדרות נוספות
                pointsVisible={showLayers.points}
                polygonsVisible={showLayers.polygons}
                linesVisible={showLayers.lines}

                // פונקציות התאמה
                getPointProps={getPointProps}
                getPolygonProps={getPolygonProps}
                getLineProps={getLineProps}
            />

            {/* הודעת טעינה */}
            {points.length === 0 && (
                <div style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                    padding: '20px',
                    borderRadius: '8px',
                    textAlign: 'center',
                    zIndex: 1000,
                    boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
                    border: '1px solid #dee2e6'
                }}>
                    <div style={{ fontSize: '24px', marginBottom: '10px' }}>🗺️</div>
                    <div style={{ fontSize: '18px', marginBottom: '8px', fontWeight: '500' }}>
                        מטעין מפת OpenLayers...
                    </div>
                    <div style={{ fontSize: '14px', color: '#666' }}>
                        תמיכה מלאה ב-WGS84 + MapColonies
                    </div>
                </div>
            )}
        </div>
    );
};

export default OpenLayersMapExample;