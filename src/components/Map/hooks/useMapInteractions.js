import { useCallback } from 'react';
import { flyToFeature, flyToFeatureByType } from '../utils/geometryUtils.js';

/**
 * Hook לניהול אינטראקציות עם פיצ'רים על המפה
 * @param {Object} mapInstance - אובייקט המפה
 * @param {Function} setSelectedFeature - פונקציה לעדכון הפיצ'ר הנבחר
 * @param {Object} options - אפשרויות נוספות
 */
export const useMapInteractions = (mapInstance, setSelectedFeature, options = {}) => {
    const {
        autoFlyTo = true,
        flyToOptions = {},
        onFeatureSelect = null,
        featureTypeMapping = {
            'major_city': 'city',
            'capital': 'city',
            'city': 'city',
            'metropolitan_area': 'area',
            'highway': 'road'
        }
    } = options;

    // פונקציה כללית לטיפול בלחיצה על פיצ'ר
    const handleFeatureClick = useCallback((feature, displayType, logMessage) => {
        console.log(logMessage, feature.properties?.name);

        // עדכון הפיצ'ר הנבחר
        setSelectedFeature({
            type: displayType,
            data: feature
        });

        // קריאה לקולבק חיצוני אם קיים
        if (onFeatureSelect) {
            onFeatureSelect(feature, displayType);
        }

        // טיסה אוטומטית לפיצ'ר
        if (autoFlyTo && mapInstance) {
            const featureType = feature.properties?.type;
            const mappedType = featureTypeMapping[featureType] || 'default';

            const success = flyToFeatureByType(mapInstance, feature, mappedType);
            if (!success) {
                // fallback לפונקציה הבסיסית
                flyToFeature(mapInstance, feature, flyToOptions);
            }
        }
    }, [mapInstance, setSelectedFeature, autoFlyTo, flyToOptions, onFeatureSelect, featureTypeMapping]);

    const handlePointClick = useCallback((feature) => {
        handleFeatureClick(feature, 'city', 'Clicked on point:');
    }, [handleFeatureClick]);

    const handlePolygonClick = useCallback((feature) => {
        handleFeatureClick(feature, 'area', 'Clicked on polygon:');
    }, [handleFeatureClick]);

    const handleLineClick = useCallback((feature) => {
        handleFeatureClick(feature, 'road', 'Clicked on line:');
    }, [handleFeatureClick]);

    // פונקציה לטיסה ידנית לפיצ'ר
    const flyToSelectedFeature = useCallback((feature, customOptions = {}) => {
        if (!mapInstance || !feature) return false;

        const options = { ...flyToOptions, ...customOptions };
        return flyToFeature(mapInstance, feature, options);
    }, [mapInstance, flyToOptions]);

    return {
        handlePointClick,
        handlePolygonClick,
        handleLineClick,
        flyToSelectedFeature
    };
};

/**
 * Hook לניהול מיקומים שמורים ומועדפים
 */
export const useSavedLocations = (mapInstance) => {
    // שמירת מיקום נוכחי
    const saveCurrentLocation = useCallback((name) => {
        if (!mapInstance) return false;

        try {
            const center = mapInstance.getCenter();
            const zoom = mapInstance.getZoom();

            const savedLocations = JSON.parse(localStorage.getItem('savedMapLocations') || '{}');
            savedLocations[name] = {
                center: { lng: center.lng, lat: center.lat },
                zoom,
                timestamp: Date.now()
            };

            localStorage.setItem('savedMapLocations', JSON.stringify(savedLocations));
            return true;
        } catch (error) {
            console.error('Error saving location:', error);
            return false;
        }
    }, [mapInstance]);

    // טעינת מיקום שמור
    const loadSavedLocation = useCallback((name) => {
        if (!mapInstance) return false;

        try {
            const savedLocations = JSON.parse(localStorage.getItem('savedMapLocations') || '{}');
            const location = savedLocations[name];

            if (location) {
                mapInstance.flyTo(location.center, location.zoom, { duration: 1500 });
                return true;
            }
            return false;
        } catch (error) {
            console.error('Error loading saved location:', error);
            return false;
        }
    }, [mapInstance]);

    // קבלת רשימת מיקומים שמורים
    const getSavedLocations = useCallback(() => {
        try {
            return JSON.parse(localStorage.getItem('savedMapLocations') || '{}');
        } catch {
            return {};
        }
    }, []);

    // מחיקת מיקום שמור
    const deleteSavedLocation = useCallback((name) => {
        try {
            const savedLocations = JSON.parse(localStorage.getItem('savedMapLocations') || '{}');
            delete savedLocations[name];
            localStorage.setItem('savedMapLocations', JSON.stringify(savedLocations));
            return true;
        } catch (error) {
            console.error('Error deleting saved location:', error);
            return false;
        }
    }, []);

    return {
        saveCurrentLocation,
        loadSavedLocation,
        getSavedLocations,
        deleteSavedLocation
    };
};