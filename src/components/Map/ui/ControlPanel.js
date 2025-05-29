// src/components/Map/ui/ControlPanel.jsx
// פאנל בקרה עבור המפה

import React from 'react';
import StyleSelector from '../StyleSelector.jsx';
import MapColoniesLayerSelector from '../MapColoniesLayerSelector.js';
import LayerControls from './LayerControls.jsx';
import FeatureInfo from './FeatureInfo.jsx';
import NavigationButtons from './NavigationButtons.jsx';
import SavedLocations from './SavedLocations.jsx';

const ControlPanel = ({
                          // מצבים
                          useMapColonies,
                          mapStyle,
                          showLayers,
                          points,
                          polygons,
                          lines,
                          selectedFeature,
                          mapColoniesLoading,
                          mapColoniesError,
                          mapColoniesLayers,
                          activeMapColoniesLayer,

                          // פונקציות
                          handleMapColoniesToggle,
                          handleStyleChange,
                          handleMapColoniesLayerChange,
                          setShowLayers,
                          toggleDebugPanel,
                          centerOnIsrael,
                          loadLastPosition,
                          flyToSelectedFeature,

                          // מיקומים שמורים
                          saveCurrentLocation,
                          loadSavedLocation,
                          getSavedLocations,
                          deleteSavedLocation,

                          // טעינת שכבות
                          loadMapColoniesLayers
                      }) => {
    return (
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
                <MapColoniesLayerSelector
                    loading={mapColoniesLoading}
                    error={mapColoniesError}
                    layers={mapColoniesLayers}
                    activeLayerId={activeMapColoniesLayer}
                    onLayerChange={handleMapColoniesLayerChange}
                    onRetry={loadMapColoniesLayers}
                />
            )}

            {/* בוחר סגנונות רגילים */}
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
            <LayerControls
                showLayers={showLayers}
                onLayerToggle={setShowLayers}
            />

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
                <FeatureInfo
                    selectedFeature={selectedFeature}
                    onFlyTo={flyToSelectedFeature}
                />
            )}

            {/* כפתורי ניווט */}
            <NavigationButtons
                onCenterIsrael={centerOnIsrael}
                onLoadLastPosition={loadLastPosition}
                onSaveLocation={saveCurrentLocation}
                onToggleDebug={toggleDebugPanel}
                onRefreshLayers={loadMapColoniesLayers}
                useMapColonies={useMapColonies}
                mapColoniesLoading={mapColoniesLoading}
            />

            {/* מיקומים שמורים */}
            <SavedLocations
                getSavedLocations={getSavedLocations}
                loadSavedLocation={loadSavedLocation}
                deleteSavedLocation={deleteSavedLocation}
            />
        </div>
    );
};

export default ControlPanel;