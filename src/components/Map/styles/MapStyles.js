// src/components/Map/styles/MapStyles.js
// עדכון להוספת WMTS לרקעים הקיימים

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

// הוספת סגנון WMTS החדש
export const WMTS_STYLE = {
    version: 8,
    name: 'WMTS Custom',
    glyphs: "https://fonts.openmaptiles.org/{fontstack}/{range}.pbf",
    sources: {
        'wmts-tiles': {
            type: 'raster',
            tiles: [
                // כאן תכניס את הURL של שרת ה-WMTS שלך
                'https://your-server.com/webmercator/{z}-{x}-{y}.png'
                // לדוגמה: 'https://tiles.example.com/webmercator/{z}-{x}-{y}.png'
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

// כעת כל הסגנונות יחד - הקיימים + WMTS
export const MAP_STYLES = {
    osm: OSM_STYLE,
    satellite: SATELLITE_STYLE,
    terrain: TERRAIN_STYLE,
    wmts: WMTS_STYLE  // הוספנו את ה-WMTS
};

// מידע על הסגנונות - עכשיו כולל WMTS
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
        name: 'מפת WMTS',
        description: 'מפת רקע מותאמת',
        icon: '🗃️'
    }
};

// פונקציות עזר - ללא שינוי
export const getMapStyle = (styleKey) => {
    return MAP_STYLES[styleKey] || MAP_STYLES.osm; // ברירת מחדל OSM
};

export const getStyleInfo = (styleKey) => {
    return STYLE_INFO[styleKey] || STYLE_INFO.osm;
};

export const getAvailableStyles = () => {
    return Object.keys(MAP_STYLES); // יחזיר ['osm', 'satellite', 'terrain', 'wmts']
};

export const isValidStyle = (styleKey) => {
    return styleKey in MAP_STYLES;
};

// פונקציה ליצירת סגנון WMTS מותאם עם URL שונה
export const createWMTSStyle = (baseUrl, options = {}) => {
    const {
        attribution = '© Your WMTS Server',
        minzoom = 0,
        maxzoom = 18,
        tileSize = 256,
        name = 'Custom WMTS',
        opacity = 1,
        backgroundColor = '#f0f0f0'
    } = options;

    return {
        version: 8,
        name,
        glyphs: "https://fonts.openmaptiles.org/{fontstack}/{range}.pbf",
        sources: {
            'wmts-tiles': {
                type: 'raster',
                tiles: [`${baseUrl}/webmercator/{z}-{x}-{y}.png`],
                tileSize,
                attribution,
                minzoom,
                maxzoom
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

// פונקציה לעדכון URL של WMTS קיים
export const updateWMTSUrl = (newUrl, options = {}) => {
    const updatedStyle = {
        ...WMTS_STYLE,
        sources: {
            ...WMTS_STYLE.sources,
            'wmts-tiles': {
                ...WMTS_STYLE.sources['wmts-tiles'],
                tiles: [newUrl],
                ...options
            }
        }
    };

    // עדכון הסגנון במערך הראשי
    MAP_STYLES.wmts = updatedStyle;

    return updatedStyle;
};