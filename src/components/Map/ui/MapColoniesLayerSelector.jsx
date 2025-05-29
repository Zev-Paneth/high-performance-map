// src/components/Map/ui/MapColoniesLayerSelector.jsx
// רכיב פשוט לבחירת שכבות MapColonies

import React from 'react';

const MapColoniesLayerSelector = ({
                                      loading,
                                      error,
                                      layers,
                                      activeLayerId,
                                      onLayerChange,
                                      onRetry
                                  }) => {
    // מצב טעינה
    if (loading) {
        return (
            <div style={{
                padding: '15px',
                textAlign: 'center',
                backgroundColor: '#f8f9fa',
                borderRadius: '6px',
                border: '1px solid #dee2e6',
                marginBottom: '15px'
            }}>
                <div style={{ marginBottom: '8px', fontSize: '16px' }}>🔄</div>
                <div style={{ fontSize: '14px', fontWeight: '500' }}>
                    טוען שכבות MapColonies WGS84...
                </div>
            </div>
        );
    }

    // מצב שגיאה
    if (error) {
        return (
            <div style={{
                padding: '15px',
                backgroundColor: '#f8d7da',
                borderRadius: '6px',
                border: '1px solid #f5c6cb',
                color: '#721c24',
                marginBottom: '15px'
            }}>
                <div style={{ marginBottom: '8px', fontSize: '16px' }}>⚠️</div>
                <div style={{ fontSize: '14px', fontWeight: '500', marginBottom: '8px' }}>
                    שגיאה בטעינת שכבות MapColonies
                </div>
                <div style={{ fontSize: '12px', marginBottom: '12px' }}>
                    {error}
                </div>
                <button
                    onClick={onRetry}
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

    // אין שכבות
    if (!layers || layers.length === 0) {
        return (
            <div style={{
                padding: '15px',
                textAlign: 'center',
                backgroundColor: '#fff3cd',
                borderRadius: '6px',
                border: '1px solid #ffeaa7',
                color: '#856404',
                marginBottom: '15px'
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

    // תצוגת שכבות
    return (
        <div style={{ marginBottom: '15px' }}>
            <div style={{ marginBottom: '8px', fontWeight: 'bold', fontSize: '14px' }}>
                🌍 שכבות MapColonies WGS84:
            </div>

            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: '6px'
            }}>
                {layers.map(layer => {
                    const isActive = activeLayerId === layer.id;
                    return (
                        <button
                            key={layer.id}
                            onClick={() => onLayerChange(layer.id)}
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
        </div>
    );
};

export default MapColoniesLayerSelector;