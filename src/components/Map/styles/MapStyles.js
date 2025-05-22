export const OPENSTREETMAP_STYLE = {
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
            attribution: '© OpenStreetMap contributors'
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
            id: 'osm-tiles-layer',
            type: 'raster',
            source: 'osm-tiles',
            paint: {
                'raster-opacity': 1
            }
        }
    ]
};

export const TOPOGRAPHIC_STYLE = {
    version: 8,
    name: 'Topographic',
    glyphs: "https://fonts.openmaptiles.org/{fontstack}/{range}.pbf",
    sources: {
        'topo-tiles': {
            type: 'raster',
            tiles: [
                'https://a.tile.opentopomap.org/{z}/{x}/{y}.png',
                'https://b.tile.opentopomap.org/{z}/{x}/{y}.png',
                'https://c.tile.opentopomap.org/{z}/{x}/{y}.png'
            ],
            tileSize: 256,
            attribution: '© OpenStreetMap contributors, © OpenTopoMap',
            maxzoom: 17
        }
    },
    layers: [
        {
            id: 'background',
            type: 'background',
            paint: {
                'background-color': '#f4f1de'
            }
        },
        {
            id: 'topo-layer',
            type: 'raster',
            source: 'topo-tiles',
            paint: {
                'raster-opacity': 1,
                'raster-fade-duration': 300
            }
        }
    ]
};

export const SATELLITE_STYLE = {
    version: 8,
    name: 'Satellite',
    glyphs: "https://fonts.openmaptiles.org/{fontstack}/{range}.pbf",
    sources: {
        'satellite-tiles': {
            type: 'raster',
            tiles: [
                'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
            ],
            tileSize: 256,
            attribution: '© Esri, Maxar, Earthstar Geographics'
        }
    },
    layers: [
        {
            id: 'background',
            type: 'background',
            paint: {
                'background-color': '#000000'
            }
        },
        {
            id: 'satellite-layer',
            type: 'raster',
            source: 'satellite-tiles'
        }
    ]
};

export const TERRAIN_STYLE = {
    version: 8,
    name: 'Terrain',
    glyphs: "https://fonts.openmaptiles.org/{fontstack}/{range}.pbf",
    sources: {
        'terrain-tiles': {
            type: 'raster',
            tiles: [
                'https://stamen-tiles.a.ssl.fastly.net/terrain/{z}/{x}/{y}.png'
            ],
            tileSize: 256,
            attribution: '© Stamen Design, © OpenStreetMap contributors'
        }
    },
    layers: [
        {
            id: 'background',
            type: 'background',
            paint: {
                'background-color': '#e8dcc0'
            }
        },
        {
            id: 'terrain-layer',
            type: 'raster',
            source: 'terrain-tiles'
        }
    ]
};

export const DARK_STYLE = {
    version: 8,
    name: 'Dark',
    glyphs: "https://fonts.openmaptiles.org/{fontstack}/{range}.pbf",
    sources: {
        'dark-tiles': {
            type: 'raster',
            tiles: [
                'https://a.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png',
                'https://b.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png',
                'https://c.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png'
            ],
            tileSize: 256,
            attribution: '© CartoDB, © OpenStreetMap contributors'
        }
    },
    layers: [
        {
            id: 'background',
            type: 'background',
            paint: {
                'background-color': '#2c2c2c'
            }
        },
        {
            id: 'dark-layer',
            type: 'raster',
            source: 'dark-tiles'
        }
    ]
};

export const LIGHT_STYLE = {
    version: 8,
    name: 'Light',
    glyphs: "https://fonts.openmaptiles.org/{fontstack}/{range}.pbf",
    sources: {
        'light-tiles': {
            type: 'raster',
            tiles: [
                'https://a.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png',
                'https://b.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png',
                'https://c.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png'
            ],
            tileSize: 256,
            attribution: '© CartoDB, © OpenStreetMap contributors'
        }
    },
    layers: [
        {
            id: 'background',
            type: 'background',
            paint: {
                'background-color': '#ffffff'
            }
        },
        {
            id: 'light-layer',
            type: 'raster',
            source: 'light-tiles'
        }
    ]
};

export const MAP_STYLES = {
    osm: OPENSTREETMAP_STYLE,
    topo: TOPOGRAPHIC_STYLE,
    satellite: SATELLITE_STYLE,
    terrain: TERRAIN_STYLE,
    dark: DARK_STYLE,
    light: LIGHT_STYLE
};

export const STYLE_INFO = {
    osm: {
        key: 'osm',
        name: 'רחובות',
        description: 'מפת רחובות בסיסית',
        icon: '🗺️'
    },
    topo: {
        key: 'topo',
        name: 'טופוגרפית',
        description: 'מפה טופוגרפית עם גבהים',
        icon: '🏔️'
    },
    satellite: {
        key: 'satellite',
        name: 'לוויין',
        description: 'תמונות לוויין',
        icon: '🛰️'
    },
    terrain: {
        key: 'terrain',
        name: 'שטח',
        description: 'מפת שטח וטבע',
        icon: '🌄'
    },
    dark: {
        key: 'dark',
        name: 'כהה',
        description: 'מפה כהה לעיניים',
        icon: '🌙'
    },
    light: {
        key: 'light',
        name: 'בהיר',
        description: 'מפה בהירה ונקייה',
        icon: '☀️'
    }
};

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

export const createCustomStyle = (baseStyle, customizations = {}) => {
    return {
        ...baseStyle,
        ...customizations,
        layers: [
            ...baseStyle.layers,
            ...(customizations.layers || [])
        ],
        sources: {
            ...baseStyle.sources,
            ...(customizations.sources || {})
        }
    };
};