import * as turf from '@turf/turf';

/**
 * מחשב מרכז של גיאומטריה לפי סוגה
 * @param {Object} geometry - גיאומטריה מסוג GeoJSON
 * @returns {Object|null} - {lng, lat} או null אם נכשל
 */
export const getGeometryCenter = (geometry) => {
    if (!geometry || !geometry.type) return null;

    try {
        switch (geometry.type) {
            case 'Point':
                return {
                    lng: geometry.coordinates[0],
                    lat: geometry.coordinates[1]
                };

            case 'LineString':
                return getLineStringCenter(geometry);

            case 'MultiLineString':
                return getMultiLineStringCenter(geometry);

            case 'Polygon':
                return getPolygonCenter(geometry);

            case 'MultiPolygon':
                return getMultiPolygonCenter(geometry);

            default:
                console.warn(`Unsupported geometry type: ${geometry.type}`);
                return null;
        }
    } catch (error) {
        console.error('Error calculating geometry center:', error);
        return null;
    }
};

/**
 * מחשב מרכז של קו
 */
const getLineStringCenter = (geometry) => {
    const coordinates = geometry.coordinates;
    const middleIndex = Math.floor(coordinates.length / 2);

    return {
        lng: coordinates[middleIndex][0],
        lat: coordinates[middleIndex][1]
    };
};

/**
 * מחשב מרכז של מולטי-קו
 */
const getMultiLineStringCenter = (geometry) => {
    // לוקח את הקו הראשון
    const firstLine = geometry.coordinates[0];
    const middleIndex = Math.floor(firstLine.length / 2);

    return {
        lng: firstLine[middleIndex][0],
        lat: firstLine[middleIndex][1]
    };
};

/**
 * מחשב מרכז של פוליגון
 */
const getPolygonCenter = (geometry) => {
    // לוקח את הרינג החיצוני (אינדקס 0)
    const coordinates = geometry.coordinates[0];
    let totalLng = 0, totalLat = 0;

    coordinates.forEach(coord => {
        totalLng += coord[0];
        totalLat += coord[1];
    });

    return {
        lng: totalLng / coordinates.length,
        lat: totalLat / coordinates.length
    };
};

/**
 * מחשב מרכז של מולטי-פוליגון
 */
const getMultiPolygonCenter = (geometry) => {
    // לוקח את הפוליגון הראשון
    const firstPolygon = geometry.coordinates[0][0];
    let totalLng = 0, totalLat = 0;

    firstPolygon.forEach(coord => {
        totalLng += coord[0];
        totalLat += coord[1];
    });

    return {
        lng: totalLng / firstPolygon.length,
        lat: totalLat / firstPolygon.length
    };
};

/**
 * מחשב מרכז מדויק יותר באמצעות turf.js
 * @param {Object} feature - פיצ'ר GeoJSON מלא
 * @returns {Object|null} - {lng, lat} או null אם נכשל
 */
export const getTurfCenter = (feature) => {
    try {
        const center = turf.centroid(feature);
        return {
            lng: center.geometry.coordinates[0],
            lat: center.geometry.coordinates[1]
        };
    } catch (error) {
        console.warn('Failed to calculate center with turf:', error);
        return null;
    }
};

/**
 * מחשב bounds (גבולות) של גיאומטריה
 * @param {Object} feature - פיצ'ר GeoJSON
 * @returns {Array|null} - [west, south, east, north] או null
 */
export const getFeatureBounds = (feature) => {
    try {
        return turf.bbox(feature); // [west, south, east, north]
    } catch (error) {
        console.warn('Failed to calculate bounds:', error);
        return null;
    }
};

/**
 * מחליט על רמת זום מתאימה לפי סוג הגיאומטריה
 * @param {string} geometryType - סוג הגיאומטריה
 * @param {Object} feature - הפיצ'ר המלא (אופציונלי)
 * @returns {number} - רמת זום מתאימה
 */
export const getOptimalZoom = (geometryType, feature = null) => {
    const zoomMap = {
        'Point': 12,
        'LineString': 10,
        'MultiLineString': 9,
        'Polygon': 11,
        'MultiPolygon': 9
    };

    let baseZoom = zoomMap[geometryType] || 10;

    // התאמה חכמה לפי גודל הפיצ'ר (אם יש bounds)
    if (feature) {
        try {
            const bounds = getFeatureBounds(feature);
            if (bounds) {
                const [west, south, east, north] = bounds;
                const width = east - west;
                const height = north - south;
                const area = width * height;

                // ככל שהשטח גדול יותר, הזום יהיה נמוך יותר
                if (area > 1) baseZoom = Math.max(6, baseZoom - 3);
                else if (area > 0.1) baseZoom = Math.max(8, baseZoom - 2);
                else if (area > 0.01) baseZoom = Math.max(10, baseZoom - 1);
            }
        } catch (error) {
            console.warn('Could not calculate optimal zoom:', error);
        }
    }

    return baseZoom;
};

/**
 * פונקציה מאוחדת לטיפול ב-flyTo של כל סוגי הפיצ'רים
 * @param {Object} mapInstance - אובייקט המפה
 * @param {Object} feature - פיצ'ר GeoJSON
 * @param {Object} options - אפשרויות נוספות
 * @returns {boolean} - האם הפעולה הצליחה
 */
export const flyToFeature = (mapInstance, feature, options = {}) => {
    if (!mapInstance || !feature || !feature.geometry) {
        console.warn('Missing required parameters for flyToFeature');
        return false;
    }

    const {
        useTurf = false, // האם להשתמש ב-turf לחישוב מדויק יותר
        duration = 1500,
        customZoom = null,
        padding = null
    } = options;

    try {
        // בחירת שיטת חישוב המרכז
        const center = useTurf ?
            getTurfCenter(feature) :
            getGeometryCenter(feature.geometry);

        if (!center) {
            console.warn('Could not calculate feature center');
            return false;
        }

        // חישוב זום אופטימלי
        const zoom = customZoom || getOptimalZoom(feature.geometry.type, feature);

        // ביצוע flyTo
        const flyToOptions = { duration };
        if (padding) flyToOptions.padding = padding;

        mapInstance.flyTo(center, zoom, flyToOptions);

        return true;
    } catch (error) {
        console.error('Error in flyToFeature:', error);
        return false;
    }
};

/**
 * פונקציה לטיפול ב-flyTo לפי סוג פיצ'ר (wrapper נוח)
 */
export const flyToFeatureByType = (mapInstance, feature, featureType) => {
    const typeOptions = {
        'city': { duration: 1000, customZoom: 12 },
        'area': { duration: 1500, customZoom: 11, useTurf: true },
        'road': { duration: 1200, customZoom: 10 },
        'region': { duration: 2000, customZoom: 8, useTurf: true }
    };

    const options = typeOptions[featureType] || {};
    return flyToFeature(mapInstance, feature, options);
};