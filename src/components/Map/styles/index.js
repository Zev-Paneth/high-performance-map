// src/components/Map/styles/index.js
// קובץ ייצוא מרכזי לכל הסגנונות כולל WMTS WGS84

// ייצוא כל הסגנונות
export {
    OSM_STYLE,
    SATELLITE_STYLE,
    TERRAIN_STYLE,
    WMTS_STYLE,
    WMTS_WGS84_STYLE,
    MAP_STYLES,
    STYLE_INFO,
    getMapStyle,
    getStyleInfo,
    getAvailableStyles,
    isValidStyle,
    createSimpleWMTSStyle,   // פונקציה פשוטה ליצירת WMTS עם URL קיים
    updateWMTSUrl            // פונקציה לעדכון URL פשוט
} from './MapStyles.js';

// ייצוא קומפוננטת בוחר הסגנונות
export { default as StyleSelector } from '../StyleSelector.jsx';