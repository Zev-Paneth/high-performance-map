import React, { useState, useCallback, useEffect } from 'react';
import HighPerformanceMap from './Map/core/HighPerformanceMap.jsx';
import StyleSelector from './Map/StyleSelector.jsx';
import { getMapStyle, updateWMTSUrl } from './Map/styles';

// ייבוא ה-hooks
import { useMapInteractions, useSavedLocations } from './Map/hooks/useMapInteractions.js';

const PublicMapExample = () => {
    // מצבים
    const [points, setPoints] = useState([]);
    const [polygons, setPolygons] = useState([]);
    const [lines, setLines] = useState([]);
    const [selectedFeature, setSelectedFeature] = useState(null);
    const [mapInstance, setMapInstance] = useState(null);
    const [mapStyle, setMapStyle] = useState('osm'); // ברירת מחדל OSM
    const [wmtsConfig, setWmtsConfig] = useState({
        url: 'https://your-server.com/tiles/{z}/{x}/{y}.png', // פשוט ה-URL הקיים שלך
    });
    const [showLayers, setShowLayers] = useState({
        points: true,
        polygons: true,
        lines: true
    });

    // שימוש ב-hooks המותאמים
    const {
        handlePointClick,
        handlePolygonClick,
        handleLineClick,
        flyToSelectedFeature
    } = useMapInteractions(mapInstance, setSelectedFeature, {
        autoFlyTo: true,
        flyToOptions: { useTurf: true },
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

    // נתוני דוגמה - ערים בישראל
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
        },
        {
            coordinates: [35.0818, 32.1853],
            properties: {
                name: 'פתח תקווה',
                population: 247000,
                type: 'city',
                color: '#9900ff',
                radius: 8
            }
        }
    ];

    // פוליגון דוגמה - גבולות אזור תל אביב
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

    // קו דוגמה - כביש 1
    const highway1 = {
        type: 'Feature',
        geometry: {
            type: 'LineString',
            coordinates: [
                [34.7818, 32.0853],
                [34.8516, 31.8853],
                [35.0000, 31.8000],
                [35.2137, 31.7683]
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

    // מאזין לטעינת המפה
    const handleMapLoad = useCallback((mapData) => {
        console.log('מפה נטענה בהצלחה!', 'סגנון:', mapStyle);
        setMapInstance(mapData);
    }, [mapStyle]);

    // מאזין לתזוזת המפה
    const handleMapMove = useCallback((moveData) => {
        // שמירה אוטומטית של המיקום האחרון
        localStorage.setItem('lastMapPosition', JSON.stringify({
            center: moveData.center,
            zoom: moveData.zoom,
            style: mapStyle,
            timestamp: Date.now()
        }));
    }, [mapStyle]);

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
            } catch (error) {
                console.error('Error loading last position:', error);
            }
        }
    }, [mapInstance, mapStyle]);

    // טיפול בשינוי סגנון
    const handleStyleChange = useCallback((newStyle) => {
        console.log('משנה סגנון ל:', newStyle);
        setMapStyle(newStyle);

        // שמירת הסגנון החדש ב-localStorage
        const saved = localStorage.getItem('lastMapPosition');
        if (saved) {
            try {
                const position = JSON.parse(saved);
                position.style = newStyle;
                localStorage.setItem('lastMapPosition', JSON.stringify(position));
            } catch (error) {
                console.error('Error saving style:', error);
            }
        }
    }, []);

    // עדכון הגדרות WMTS
    const updateWMTSConfig = useCallback(() => {
        if (mapStyle === 'wmts_wgs84') {
            updateWMTSUrl(wmtsConfig.url, {
                attribution: '© Your WMTS Server'
            });
        }
    }, [mapStyle, wmtsConfig]);

    // עדכון אוטומטי של WMTS כשמשנים הגדרות
    useEffect(() => {
        if (mapStyle === 'wmts_wgs84') {
            updateWMTSConfig();
        }
    }, [wmtsConfig, mapStyle, updateWMTSConfig]);

    return (
        <div style={{ height: '100%', width: '100%'}}>
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
                minWidth: '300px',
                maxHeight: '80vh',
                overflowY: 'auto'
            }}>
                <h3 style={{ margin: '0 0 15px 0', color: '#333' }}>🗺️ בקרת מפה</h3>

                {/* בוחר סגנונות - כעת עם WMTS WGS84 */}
                <StyleSelector
                    currentStyle={mapStyle}
                    onStyleChange={handleStyleChange}
                    layout="buttons"
                    showIcons={true}
                    showDescriptions={false}
                    compact={false}
                    columns={2}
                />

                {/* הגדרות WMTS WGS84 - פשוט */}
                {mapStyle === 'wmts_wgs84' && (
                    <div style={{
                        marginBottom: '15px',
                        padding: '15px',
                        backgroundColor: '#e8f5e8',
                        borderRadius: '8px',
                        border: '2px solid #4caf50'
                    }}>
                        <strong style={{ color: '#2e7d32', display: 'block', marginBottom: '10px' }}>
                            🌐 הגדרות WMTS
                        </strong>

                        <div style={{ marginBottom: '8px' }}>
                            <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '3px' }}>
                                URL אריחים:
                            </label>
                            <input
                                type="text"
                                value={wmtsConfig.url}
                                onChange={(e) => setWmtsConfig(prev => ({ ...prev, url: e.target.value }))}
                                placeholder="https://your-server.com/tiles/{z}/{x}/{y}.png"
                                style={{
                                    width: '100%',
                                    padding: '6px 8px',
                                    border: '1px solid #ccc',
                                    borderRadius: '4px',
                                    fontSize: '11px'
                                }}
                            />
                        </div>

                        <div style={{ fontSize: '10px', color: '#555', marginTop: '8px' }}>
                            💡 <strong>טיפ:</strong> השתמש ב-URL שעבד לך ב-Leaflet
                        </div>
                    </div>
                )}

                {/* הוראות עבור WMTS Web Mercator */}
                {mapStyle === 'wmts' && (
                    <div style={{
                        marginBottom: '15px',
                        padding: '10px',
                        backgroundColor: '#fff3cd',
                        borderRadius: '6px',
                        border: '1px solid #ffeaa7',
                        fontSize: '12px'
                    }}>
                        <strong>🔧 WMTS Web Mercator:</strong>
                        <div style={{ marginTop: '5px', color: '#856404' }}>
                            עדכן את ה-URL ב-MapStyles.js:<br/>
                            <code style={{ fontSize: '10px' }}>
                                'https://your-server.com/webmercator/{'{z}'}-{'{x}'}-{'{y}'}.png'
                            </code>
                        </div>
                    </div>
                )}

                {/* בקרת שכבות */}
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
                    <strong>סטטיסטיקות נתונים:</strong>
                    <div style={{
                        fontSize: '14px',
                        marginTop: '8px',
                        backgroundColor: '#f8f9fa',
                        padding: '12px',
                        borderRadius: '6px',
                        border: '1px solid #dee2e6'
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                            <span>📍 ערים:</span>
                            <span style={{ fontWeight: 'bold' }}>{points.length}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                            <span>🗺️ אזורים:</span>
                            <span style={{ fontWeight: 'bold' }}>{polygons.length}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span>🛣️ דרכים:</span>
                            <span style={{ fontWeight: 'bold' }}>{lines.length}</span>
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
                            {selectedFeature.data.properties?.type && (
                                <div style={{ marginBottom: '8px' }}>
                                    <strong>קטגוריה:</strong> {selectedFeature.data.properties.type}
                                </div>
                            )}
                        </div>

                        <button
                            onClick={() => {
                                flyToSelectedFeature(selectedFeature.data, {
                                    useTurf: true,
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
                        🇮🇱 מרכז ישראל
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
                        📍 מיקום וסגנון אחרון
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
            <HighPerformanceMap
                // הגדרות בסיסיות
                initialCenter={{ lng: 34.8516, lat: 31.0461 }}
                initialZoom={8}
                mapStyle={getMapStyle(mapStyle)}

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
                enableClustering={true}
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
                        מטעין מפה...
                    </div>
                    <div style={{ fontSize: '14px', color: '#666' }}>
                        מכין נתוני ערים ואזורים בישראל
                    </div>
                </div>
            )}
        </div>
    );
};

export default PublicMapExample;