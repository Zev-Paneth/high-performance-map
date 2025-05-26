// src/components/Map/styles/index.js
// קובץ ייצוא מרכזי לכל הסגנונות כולל WMTS

// ייצוא כל הסגנונות
export {
    OSM_STYLE,
    SATELLITE_STYLE,
    TERRAIN_STYLE,
    WMTS_STYLE,          // הסגנון החדש
    MAP_STYLES,
    STYLE_INFO,
    getMapStyle,
    getStyleInfo,
    getAvailableStyles,
    isValidStyle,
    createWMTSStyle,     // פונקציה ליצירת WMTS מותאם
    updateWMTSUrl        // פונקציה לעדכון URL של WMTS
} from './MapStyles.js';

// ייצוא קומפוננטת בוחר הסגנונות
export { default as StyleSelector } from '../StyleSelector.jsx';