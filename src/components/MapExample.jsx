import React, { useState, useCallback, useEffect } from 'react';
import HighPerformanceMap from './Map/core/HighPerformanceMap.jsx';
import StyleSelector from './Map/StyleSelector.jsx';
import { getMapStyle } from './Map/styles'

const PublicMapExample = () => {
    // מצבים
    const [points, setPoints] = useState([]);
    const [polygons, setPolygons] = useState([]);
    const [lines, setLines] = useState([]);
    const [selectedFeature, setSelectedFeature] = useState(null);
    const [mapInstance, setMapInstance] = useState(null);
    const [mapStyle, setMapStyle] = useState('osm'); // ברירת מחדל
    const [showLayers, setShowLayers] = useState({
        points: true,
        polygons: true,
        lines: true
    });

    // נתוני דוגמה - ערים בישראל
    const israelCities = [
        {
            coordinates: [34.7818, 32.0853], // תל אביב
            properties: {
                name: 'תל אביב',
                population: 460000,
                type: 'major_city',
                color: '#ff0000',
                radius: 12
            }
        },
        {
            coordinates: [35.2137, 31.7683], // ירושלים
            properties: {
                name: 'ירושלים',
                population: 936000,
                type: 'capital',
                color: '#0000ff',
                radius: 15
            }
        },
        {
            coordinates: [34.9896, 32.7940], // חיפה
            properties: {
                name: 'חיפה',
                population: 285000,
                type: 'major_city',
                color: '#00ff00',
                radius: 10
            }
        },
        {
            coordinates: [34.9518, 32.0853], // נתניה
            properties: {
                name: 'נתניה',
                population: 230000,
                type: 'city',
                color: '#ffaa00',
                radius: 8
            }
        },
        {
            coordinates: [34.8516, 31.0461], // באר שבע
            properties: {
                name: 'באר שבע',
                population: 209000,
                type: 'city',
                color: '#ff6600',
                radius: 8
            }
        },
        {
            coordinates: [35.0818, 32.1853], // פתח תקווה
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

    // קו דוגמה - כביש 1 (תל אביב-ירושלים)
    const highway1 = {
        type: 'Feature',
        geometry: {
            type: 'LineString',
            coordinates: [
                [34.7818, 32.0853], // תל אביב
                [34.8516, 31.8853], // נקודת ביניים
                [35.0000, 31.8000], // נקודת ביניים
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

    // מאזין לטעינת המפה
    const handleMapLoad = useCallback((mapData) => {
        console.log('המפה נטענה בהצלחה!');
        setMapInstance(mapData);
    }, []);

    // מאזין לתזוזת המפה
    const handleMapMove = useCallback((moveData) => {
        localStorage.setItem('lastMapPosition', JSON.stringify({
            center: moveData.center,
            zoom: moveData.zoom
        }));
    }, []);

    // מאזין ללחיצה על המפה
    const handleMapClick = useCallback((clickData) => {
        console.log('נלחץ על המפה:', clickData.lngLat);
        setSelectedFeature(null);
    }, []);

    // מאזין ללחיצה על נקודה
    const handlePointClick = useCallback((feature) => {
        console.log('נלחץ על נקודה:', feature.properties.name);
        setSelectedFeature({
            type: 'עיר',
            data: feature
        });

        if (mapInstance) {
            mapInstance.flyTo(
                {
                    lng: feature.geometry.coordinates[0],
                    lat: feature.geometry.coordinates[1]
                },
                12,
                { duration: 1000 }
            );
        }
    }, [mapInstance]);

    // מאזין ללחיצה על פוליגון
    const handlePolygonClick = useCallback((feature) => {
        console.log('נלחץ על פוליגון:', feature.properties.name);
        setSelectedFeature({
            type: 'אזור',
            data: feature
        });
    }, []);

    // מאזין ללחיצה על קו
    const handleLineClick = useCallback((feature) => {
        console.log('נלחץ על קו:', feature.properties.name);
        setSelectedFeature({
            type: 'דרך',
            data: feature
        });
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

    // פונקציה לשינוי סגנון המפה
    const handleStyleChange = useCallback((styleKey) => {
        setMapStyle(styleKey);
        console.log('סגנון מפה השתנה ל:', styleKey);
    }, []);

    // פונקציה לטעינת מיקום אחרון
    const loadLastPosition = useCallback(() => {
        const saved = localStorage.getItem('lastMapPosition');
        if (saved && mapInstance) {
            const position = JSON.parse(saved);
            mapInstance.flyTo(position.center, position.zoom);
        }
    }, [mapInstance]);

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
                <h3 style={{ margin: '0 0 15px 0', color: '#333' }}>בקרת מפה</h3>

                {/* בוחר סגנון מפה */}
                <StyleSelector
                    currentStyle={mapStyle}
                    onStyleChange={handleStyleChange}
                    layout="buttons"
                    showIcons={true}
                    showDescriptions={false}
                />

                {/* בקרת שכבות */}
                <div style={{ marginBottom: '15px' }}>
                    <strong>שכבות:</strong>
                    <div style={{ marginTop: '8px' }}>
                        {Object.entries(showLayers).map(([layer, visible]) => (
                            <label key={layer} style={{
                                display: 'flex',
                                alignItems: 'center',
                                marginBottom: '8px',
                                cursor: 'pointer'
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
                                <span style={{ fontSize: '14px' }}>
                                    {layer === 'points' ? '🏙️ ערים' :
                                        layer === 'polygons' ? '🗺️ אזורים' : '🛣️ דרכים'}
                                </span>
                            </label>
                        ))}
                    </div>
                </div>

                {/* סטטיסטיקות */}
                <div style={{ marginBottom: '15px' }}>
                    <strong>סטטיסטיקות:</strong>
                    <div style={{
                        fontSize: '14px',
                        marginTop: '8px',
                        backgroundColor: '#f8f9fa',
                        padding: '8px',
                        borderRadius: '4px'
                    }}>
                        <div>📍 ערים: {points.length}</div>
                        <div>🗺️ אזורים: {polygons.length}</div>
                        <div>🛣️ דרכים: {lines.length}</div>
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
                        <div style={{ marginTop: '5px' }}>
                            <div><strong>סוג:</strong> {selectedFeature.type}</div>
                            <div><strong>שם:</strong> {selectedFeature.data.properties?.name}</div>
                            {selectedFeature.data.properties?.population && (
                                <div><strong>אוכלוסיה:</strong> {selectedFeature.data.properties.population.toLocaleString()}</div>
                            )}
                            {selectedFeature.data.properties?.type && (
                                <div><strong>קטגוריה:</strong> {selectedFeature.data.properties.type}</div>
                            )}
                        </div>
                    </div>
                )}

                {/* כפתורי פעולה */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <button
                        onClick={() => {
                            if (mapInstance) {
                                mapInstance.flyTo({ lng: 34.8516, lat: 31.0461 }, 8);
                            }
                        }}
                        style={{
                            padding: '10px 15px',
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
                            padding: '10px 15px',
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
                </div>
            </div>

            {/* המפה */}
            <HighPerformanceMap
                // הגדרות בסיסיות
                initialCenter={{ lng: 34.8516, lat: 31.0461 }} // מרכז ישראל
                initialZoom={8}
                mapStyle={getMapStyle(mapStyle)} // שימוש בפונקציה מהמודול

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
                    boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
                }}>
                    <div style={{ fontSize: '18px', marginBottom: '10px' }}>⏳ טוען נתוני מפה...</div>
                    <div style={{ fontSize: '14px', color: '#666' }}>מכין ערים ואזורים בישראל</div>
                </div>
            )}
        </div>
    );
};

export default PublicMapExample;