// src/components/Map/MapColoniesLayerSelector.jsx
// רכיב לבחירת שכבות MapColonies

import React, { useEffect, useState } from 'react';
import { useMapColoniesBackground } from './hooks/useMapColonies.js';
import { MAP_COLONIES_CONFIG } from '../../services/mapColonies/config.js';

const MapColoniesLayerSelector = ({
                                      layout = 'buttons', // 'buttons' או 'dropdown'
                                      showIcons = true,
                                      showDescriptions = false,
                                      compact = false,
                                      columns = 2,
                                      autoLoad = true, // טעינה אוטומטית בהתחלה
                                      onLayerChange = null // callback כשמחליפים שכבה
                                  }) => {
    const {
        mapStyle,
        activeLayerId,
        backgroundLayers,
        setActiveLayer,
        loadBackgroundLayers,
        loading,
        error
    } = useMapColoniesBackground();

    const [initialized, setInitialized] = useState(false);

    // טעינה אוטומטית של שכבות הרקע
    useEffect(() => {
        if (autoLoad && !initialized && !loading) {
            console.log('Auto-loading MapColonies background layers...');
            loadBackgroundLayers()
                .then(() => {
                    setInitialized(true);
                    console.log('MapColonies layers loaded successfully');
                })
                .catch(err => {
                    console.error('Failed to auto-load MapColonies layers:', err);
                    setInitialized(true); // מסמן כמאותחל גם במקרה של שגיאה
                });
        }
    }, [autoLoad, initialized, loading, loadBackgroundLayers]);

    // callback על שינוי שכבה
    useEffect(() => {
        if (onLayerChange && activeLayerId) {
            const activeLayer = backgroundLayers.find(layer => layer.id === activeLayerId);
            if (activeLayer) {
                onLayerChange(activeLayer);
            }
        }
    }, [activeLayerId, backgroundLayers, onLayerChange]);

    // טיפול בשינוי שכבה
    const handleLayerChange = (layerId) => {
        console.log('Changing MapColonies layer to:', layerId);
        setActiveLayer(layerId);
    };

    // אם בטעינה
    if (loading && !initialized) {
        return (
            <div style={{
                padding: '15px',
                textAlign: 'center',
                backgroundColor: '#f8f9fa',
                borderRadius: '6px',
                border: '1px solid #dee2e6'
            }}>
                <div style={{ marginBottom: '8px', fontSize: '16px' }}>🌍</div>
                <div style={{ fontSize: '14px', fontWeight: '500' }}>
                    טוען שכבות MapColonies...
                </div>
                <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
                    מתחבר לשירותי המפות
                </div>
            </div>
        );
    }

    // אם יש שגיאה
    if (error) {
        return (
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
                    {error}
                </div>
                <button
                    onClick={() => {
                        setInitialized(false);
                        loadBackgroundLayers();
                    }}
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
        );
    }

    // אם אין שכבות זמינות
    if (backgroundLayers.length === 0) {
        return (
            <div style={{
                padding: '15px',
                textAlign: 'center',
                backgroundColor: '#fff3cd',
                borderRadius: '6px',
                border: '1px solid #ffeaa7',
                color: '#856404'
            }}>
                <div style={{ marginBottom: '8px', fontSize: '16px' }}>📋</div>
                <div style={{ fontSize: '14px', fontWeight: '500' }}>
                    אין שכבות MapColonies זמינות
                </div>
                <div style={{ fontSize: '12px', marginTop: '4px' }}>
                    בדוק את ההגדרות בקובץ config.js
                </div>
            </div>
        );
    }

    // תצוגת רשימה נפתחת
    if (layout === 'dropdown') {
        return (
            <div style={{ marginBottom: '15px' }}>
                <label
                    htmlFor="mapcolonies-select"
                    style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}
                >
                    שכבת רקע MapColonies:
                </label>
                <select
                    id="mapcolonies-select"
                    value={activeLayerId || ''}
                    onChange={(e) => handleLayerChange(e.target.value)}
                    style={{
                        width: '100%',
                        padding: '10px',
                        borderRadius: '6px',
                        border: '1px solid #ccc',
                        backgroundColor: 'white',
                        fontSize: '14px',
                        cursor: 'pointer'
                    }}
                >
                    {backgroundLayers.map(layer => {
                        const config = MAP_COLONIES_CONFIG.BACKGROUND_LAYERS[layer.id];
                        return (
                            <option key={layer.id} value={layer.id}>
                                {showIcons ? `${config?.icon || '🗺️'} ` : ''}{config?.name || layer.id}
                                {showDescriptions ? ` - ${config?.description || ''}` : ''}
                            </option>
                        );
                    })}
                </select>
            </div>
        );
    }

    // תצוגת כפתורים - ברירת מחדל
    const gridColumns = Math.min(columns, backgroundLayers.length);

    return (
        <div style={{ marginBottom: '15px' }}>
            <div style={{ marginBottom: '8px', fontWeight: 'bold', fontSize: '14px' }}>
                🌍 שכבות רקע MapColonies:
            </div>

            <div style={{
                display: 'grid',
                gridTemplateColumns: `repeat(${gridColumns}, 1fr)`,
                gap: compact ? '4px' : '6px',
                width: '100%'
            }}>
                {backgroundLayers.map(layer => {
                    const config = MAP_COLONIES_CONFIG.BACKGROUND_LAYERS[layer.id];
                    const isActive = activeLayerId === layer.id;

                    return (
                        <button
                            key={layer.id}
                            onClick={() => handleLayerChange(layer.id)}
                            title={showDescriptions ? config?.description : config?.name}
                            style={{
                                padding: compact ? '8px 6px' : '12px 8px',
                                backgroundColor: isActive ? '#007cba' : '#f8f9fa',
                                color: isActive ? 'white' : '#333',
                                border: isActive ? '2px solid #005a8b' : '2px solid #dee2e6',
                                borderRadius: '8px',
                                cursor: 'pointer',
                                fontSize: compact ? '11px' : '12px',
                                textAlign: 'center',
                                transition: 'all 0.2s ease',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                gap: '4px',
                                minHeight: compact ? '50px' : '65px',
                                fontWeight: isActive ? '600' : '500',
                                transform: isActive ? 'scale(1.02)' : 'scale(1)',
                                boxShadow: isActive
                                    ? '0 3px 10px rgba(0, 124, 186, 0.3)'
                                    : '0 1px 3px rgba(0, 0, 0, 0.1)'
                            }}
                            onMouseEnter={(e) => {
                                if (!isActive) {
                                    e.target.style.backgroundColor = '#e9ecef';
                                    e.target.style.transform = 'scale(1.01)';
                                }
                            }}
                            onMouseLeave={(e) => {
                                if (!isActive) {
                                    e.target.style.backgroundColor = '#f8f9fa';
                                    e.target.style.transform = 'scale(1)';
                                }
                            }}
                        >
                            {showIcons && (
                                <span style={{
                                    fontSize: compact ? '16px' : '20px',
                                    lineHeight: '1'
                                }}>
                                    {config?.icon || '🗺️'}
                                </span>
                            )}
                            <span style={{
                                fontSize: compact ? '9px' : '10px',
                                lineHeight: '1.2',
                                textAlign: 'center',
                                wordBreak: 'break-word'
                            }}>
                                {config?.name || layer.id}
                            </span>
                        </button>
                    );
                })}
            </div>

            {/* תיאור השכבה הפעילה */}
            {showDescriptions && activeLayerId && (
                <div style={{
                    marginTop: '10px',
                    padding: '10px',
                    backgroundColor: '#e8f4fd',
                    borderRadius: '6px',
                    border: '1px solid #b3d9ff',
                    fontSize: '12px',
                    color: '#0066cc'
                }}>
                    <strong>
                        {MAP_COLONIES_CONFIG.BACKGROUND_LAYERS[activeLayerId]?.name}:
                    </strong>{' '}
                    {MAP_COLONIES_CONFIG.BACKGROUND_LAYERS[activeLayerId]?.description}
                </div>
            )}

            {/* מידע טכני */}
            <div style={{
                marginTop: '8px',
                fontSize: '11px',
                color: '#666',
                textAlign: 'center'
            }}>
                {backgroundLayers.length} שכבות זמינות •
                {loading && ' 🔄 מעדכן • '}
                {mapStyle ? ' ✅ מחובר' : ' ⏳ ממתין'}
            </div>
        </div>
    );
};

export default MapColoniesLayerSelector;