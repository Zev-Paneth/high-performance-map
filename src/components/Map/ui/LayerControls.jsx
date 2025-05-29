// src/components/Map/ui/LayerControls.jsx
import React from 'react';

export const LayerControls = ({ showLayers, onLayerToggle }) => (
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
                        onChange={(e) => onLayerToggle(prev => ({
                            ...prev,
                            [layer]: e.target.checked
                        }))}
                        style={{ marginLeft: '8px', transform: 'scale(1.2)' }}
                    />
                    <span style={{ fontSize: '14px', fontWeight: visible ? '500' : 'normal' }}>
                        {layer === 'points' ? '🏙️ ערים' :
                            layer === 'polygons' ? '🗺️ אזורים' : '🛣️ דרכים'}
                    </span>
                </label>
            ))}
        </div>
    </div>
);

// src/components/Map/ui/FeatureInfo.jsx
export const FeatureInfo = ({ selectedFeature, onFlyTo }) => (
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
            onClick={() => onFlyTo(selectedFeature.data, { duration: 1500 })}
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
);

// src/components/Map/ui/NavigationButtons.jsx
export const NavigationButtons = ({
                                      onCenterIsrael,
                                      onLoadLastPosition,
                                      onSaveLocation,
                                      onToggleDebug,
                                      onRefreshLayers,
                                      useMapColonies,
                                      mapColoniesLoading
                                  }) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <button onClick={onCenterIsrael} style={buttonStyle('#007cba')}>
            🇮🇱 מרכז ישראל (WGS84)
        </button>

        <button onClick={onLoadLastPosition} style={buttonStyle('#28a745')}>
            📍 מיקום אחרון
        </button>

        <button
            onClick={() => {
                const name = `מיקום_${new Date().toLocaleTimeString('he-IL')}`;
                if (onSaveLocation(name)) {
                    alert(`המיקום נשמר בשם: ${name}`);
                }
            }}
            style={buttonStyle('#ffc107', 'black')}
        >
            💾 שמור מיקום
        </button>

        {useMapColonies && (
            <>
                <button
                    onClick={onRefreshLayers}
                    disabled={mapColoniesLoading}
                    style={buttonStyle(mapColoniesLoading ? '#6c757d' : '#6f42c1')}
                >
                    {mapColoniesLoading ? '⏳ טוען...' : '🔄 רענן שכבות'}
                </button>

                <button onClick={onToggleDebug} style={buttonStyle('#17a2b8')}>
                    🔍 ניפוי באגים
                </button>
            </>
        )}
    </div>
);

// src/components/Map/ui/SavedLocations.jsx
export const SavedLocations = ({ getSavedLocations, loadSavedLocation, deleteSavedLocation }) => (
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
);

// פונקציית עזר לסגנון כפתורים
const buttonStyle = (bgColor, textColor = 'white') => ({
    padding: '12px 15px',
    backgroundColor: bgColor,
    color: textColor,
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500'
});

export default { LayerControls, FeatureInfo, NavigationButtons, SavedLocations };