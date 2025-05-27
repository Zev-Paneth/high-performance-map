// src/components/Map/styles/MapStyles.js
// עדכון להוספת WMTS WGS84 לרקעים הקיימים

// סגנון OSM הקיים
export const OSM_STYLE = {
    version: 8,
    name: 'OpenStreetMap',
    glyphs: "https://fonts.openmaptiles.org/{fontstack}/{range}.pbf",
    sources: {
        'osm-tiles': {
            type: 'raster',
            tiles: [
                'https://a.tile.openstreetmap.org/{z}/{x}/{y}.png',
                'https://b.tile.openstreetmap.org/{z}/{x}/{y}.png',
                'https://c.tile.openstreetmap.org/{z}/{x}/{y}.png'
            ],
            tileSize: 256,
            attribution: '© OpenStreetMap contributors',
            maxzoom: 19
        }
    },
    layers: [
        {
            id: 'background',
            type: 'background',
            paint: {
                'background-color': '#f0f0f0'
            }
        },
        {
            id: 'osm-layer',
            type: 'raster',
            source: 'osm-tiles',
            paint: {
                'raster-opacity': 1
            }
        }
    ]
};

// סגנון Satellite הקיים
export const SATELLITE_STYLE = {
    version: 8,
    name: 'Satellite',
    glyphs: "https://fonts.openmaptiles.org/{fontstack}/{range}.pbf",
    sources: {
        'satellite-tiles': {
            type: 'raster',
            tiles: [
                'https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}',
                'https://mt2.google.com/vt/lyrs=s&x={x}&y={y}&z={z}',
                'https://mt3.google.com/vt/lyrs=s&x={x}&y={y}&z={z}'
            ],
            tileSize: 256,
            attribution: '© Google',
            maxzoom: 20
        }
    },
    layers: [
        {
            id: 'background',
            type: 'background',
            paint: {
                'background-color': '#000'
            }
        },
        {
            id: 'satellite-layer',
            type: 'raster',
            source: 'satellite-tiles',
            paint: {
                'raster-opacity': 1
            }
        }
    ]
};

// סגנון Terrain הקיים
export const TERRAIN_STYLE = {
    version: 8,
    name: 'Terrain',
    glyphs: "https://fonts.openmaptiles.org/{fontstack}/{range}.pbf",
    sources: {
        'terrain-tiles': {
            type: 'raster',
            tiles: [
                'https://mt1.google.com/vt/lyrs=p&x={x}&y={y}&z={z}',
                'https://mt2.google.com/vt/lyrs=p&x={x}&y={y}&z={z}',
                'https://mt3.google.com/vt/lyrs=p&x={x}&y={y}&z={z}'
            ],
            tileSize: 256,
            attribution: '© Google',
            maxzoom: 20
        }
    },
    layers: [
        {
            id: 'background',
            type: 'background',
            paint: {
                'background-color': '#e8e8e8'
            }
        },
        {
            id: 'terrain-layer',
            type: 'raster',
            source: 'terrain-tiles',
            paint: {
                'raster-opacity': 1
            }
        }
    ]
};

// סגנון WMTS WGS84 החדש - מותאם למערכת קואורדינטות WGS84
export const WMTS_WGS84_STYLE = {
    version: 8,
    name: 'WMTS WGS84',
    // הסרת glyphs כדי למנוע שגיאות פונטים
    sources: {
        'wmts-wgs84-tiles': {
            type: 'raster',
            tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
            tileSize: 256,
            attribution: '© Your WMTS WGS84 Server',
            minzoom: 0,
            maxzoom: 18,
            // הגדרת scheme ל-TMS אם השרת שלך משתמש בזה
            scheme: 'xyz' // או 'tms' בהתאם לשרת
        }
    },
    layers: [
        {
            id: 'background',
            type: 'background',
            paint: {
                'background-color': '#f0f0f0'
            }
        },
        {
            id: 'wmts-wgs84-layer',
            type: 'raster',
            source: 'wmts-wgs84-tiles',
            paint: {
                'raster-opacity': 1,
                'raster-fade-duration': 300
            }
        }
    ]
};

// סגנון WMTS Web Mercator הקיים (שמירה לתאימות לאחור)
export const WMTS_STYLE = {
    version: 8,
    name: 'WMTS Web Mercator',
    glyphs: "https://fonts.openmaptiles.org/{fontstack}/{range}.pbf",
    sources: {
        'wmts-tiles': {
            type: 'raster',
            tiles: [
                'https://your-server.com/webmercator/{z}-{x}-{y}.png'
            ],
            tileSize: 256,
            attribution: '© Your WMTS Server',
            minzoom: 0,
            maxzoom: 18
        }
    },
    layers: [
        {
            id: 'background',
            type: 'background',
            paint: {
                'background-color': '#f0f0f0'
            }
        },
        {
            id: 'wmts-layer',
            type: 'raster',
            source: 'wmts-tiles',
            paint: {
                'raster-opacity': 1,
                'raster-fade-duration': 300
            }
        }
    ]
};

// כל הסגנונות יחד - כולל WMTS WGS84
export const MAP_STYLES = {
    osm: OSM_STYLE,
    satellite: SATELLITE_STYLE,
    terrain: TERRAIN_STYLE,
    wmts: WMTS_STYLE,
    wmts_wgs84: WMTS_WGS84_STYLE  // הסגנון החדש
};

// מידע על הסגנונות - כולל WMTS WGS84
export const STYLE_INFO = {
    osm: {
        key: 'osm',
        name: 'OpenStreetMap',
        description: 'מפת כבישים ויישובים',
        icon: '🗺️'
    },
    satellite: {
        key: 'satellite',
        name: 'לוויין',
        description: 'תמונות לוויין',
        icon: '🛰️'
    },
    terrain: {
        key: 'terrain',
        name: 'טופוגרפיה',
        description: 'מפת הרים ועמקים',
        icon: '⛰️'
    },
    wmts: {
        key: 'wmts',
        name: 'WMTS Mercator',
        description: 'מפת WMTS Web Mercator',
        icon: '🗃️'
    },
    wmts_wgs84: {
        key: 'wmts_wgs84',
        name: 'WMTS WGS84',
        description: 'מפת WMTS בקואורדינטות WGS84',
        icon: '🌐'
    }
};

// פונקציות עזר - ללא שינוי
export const getMapStyle = (styleKey) => {
    return MAP_STYLES[styleKey] || MAP_STYLES.osm;
};

export const getStyleInfo = (styleKey) => {
    return STYLE_INFO[styleKey] || STYLE_INFO.osm;
};

export const getAvailableStyles = () => {
    return Object.keys(MAP_STYLES);
};

export const isValidStyle = (styleKey) => {
    return styleKey in MAP_STYLES;
};

// פונקציה פשוטה ליצירת סגנון עם URL קיים
export const createSimpleWMTSStyle = (tileUrl, options = {}) => {
    const {
        attribution = '© Your WMTS Server',
        minzoom = 0,
        maxzoom = 18,
        tileSize = 256,
        name = 'Custom WMTS',
        opacity = 1,
        backgroundColor = '#f0f0f0',
        scheme = 'xyz' // או 'tms'
    } = options;

    return {
        version: 8,
        name,
        sources: {
            'wmts-tiles': {
                type: 'raster',
                tiles: [tileUrl], // פשוט ה-URL שעבד לך ב-Leaflet
                tileSize,
                attribution,
                minzoom,
                maxzoom,
                scheme
            }
        },
        layers: [
            {
                id: 'background',
                type: 'background',
                paint: {
                    'background-color': backgroundColor
                }
            },
            {
                id: 'wmts-layer',
                type: 'raster',
                source: 'wmts-tiles',
                paint: {
                    'raster-opacity': opacity,
                    'raster-fade-duration': 300
                }
            }
        ]
    };
};

// פונקציה לעדכון URL פשוט
export const updateWMTSUrl = (newTileUrl, options = {}) => {
    const updatedStyle = {
        ...WMTS_STYLE,
        sources: {
            ...WMTS_STYLE.sources,
            'wmts-tiles': {
                ...WMTS_STYLE.sources['wmts-tiles'],
                tiles: [newTileUrl],
                ...options
            }
        }
    };

    MAP_STYLES.wmts = updatedStyle;
    return updatedStyle;
};