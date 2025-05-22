// src/components/Map/styles/index.js
// קובץ ייצוא מרכזי לכל הסגנונות והקומפוננטות הקשורות

// ייצוא כל הסגנונות
export {
    OPENSTREETMAP_STYLE,
    TOPOGRAPHIC_STYLE,
    SATELLITE_STYLE,
    TERRAIN_STYLE,
    DARK_STYLE,
    LIGHT_STYLE,
    MAP_STYLES,
    STYLE_INFO,
    getMapStyle,
    getStyleInfo,
    getAvailableStyles,
    isValidStyle,
    createCustomStyle
} from './MapStyles.js';

// ייצוא קומפוננטת בוחר הסגנונות
export { default as StyleSelector } from '../StyleSelector.jsx';