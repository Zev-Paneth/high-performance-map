// src/services/mapColonies/config.js
// קובץ הגדרות למערכת MapColonies

export const MAP_COLONIES_CONFIG = {
    // URLs - החלף עם הכתובות האמיתיות שלך
    CATALOG_SERVICE_URL: 'https://your-mapcolonies-server.com/catalog-service',
    SERVING_SERVICE_URL: 'https://your-mapcolonies-server.com/serving-service',

    // Authentication - החלף עם הטוקן האמיתי שלך
    AUTH_TOKEN: 'your-jwt-token-here',

    // Headers for requests
    DEFAULT_HEADERS: {
        'Content-Type': 'application/xml',
        'Accept': 'application/xml'
    },

    // שכבות רקע לדוגמה - תעדכן לפי מה שיש לך בקטלוג
    BACKGROUND_LAYERS: {
        orthophoto_best: {
            name: 'אורתופוטו מיטבי',
            productType: 'OrthophotoBest',
            productId: 'ORTHOPHOTO_MOSAIC_BASE',
            description: 'שכבת רקע אורתופוטו באיכות מיטבית',
            icon: '🛰️'
        },
        orthophoto_standard: {
            name: 'אורתופוטו רגיל',
            productType: 'Orthophoto',
            productId: 'ORTHOPHOTO_STANDARD',
            description: 'שכבת רקע אורתופוטו רגילה',
            icon: '📡'
        },
        topographic: {
            name: 'טופוגרפי',
            productType: 'Topographic',
            productId: 'TOPO_BASE',
            description: 'מפה טופוגרפית בסיסית',
            icon: '🗺️'
        }
    },

    // הגדרות WMTS
    WMTS_CONFIG: {
        tileMatrixSet: 'InspireCRS84Quad',
        format: 'image/png',
        style: 'default',
        tileSize: 256,
        maxZoom: 18
    }
};

// פונקציות עזר להגדרות
export const getAuthHeaders = () => ({
    ...MAP_COLONIES_CONFIG.DEFAULT_HEADERS,
    'Authorization': `Bearer ${MAP_COLONIES_CONFIG.AUTH_TOKEN}`,
    'X-API-KEY': MAP_COLONIES_CONFIG.AUTH_TOKEN
});

export const getCatalogUrl = () => `${MAP_COLONIES_CONFIG.CATALOG_SERVICE_URL}/csw`;

export const getServingUrl = () => MAP_COLONIES_CONFIG.SERVING_SERVICE_URL;

// וולידציה להגדרות
export const validateConfig = () => {
    const errors = [];

    if (!MAP_COLONIES_CONFIG.CATALOG_SERVICE_URL.startsWith('http')) {
        errors.push('CATALOG_SERVICE_URL must be a valid URL');
    }

    if (!MAP_COLONIES_CONFIG.SERVING_SERVICE_URL.startsWith('http')) {
        errors.push('SERVING_SERVICE_URL must be a valid URL');
    }

    if (!MAP_COLONIES_CONFIG.AUTH_TOKEN || MAP_COLONIES_CONFIG.AUTH_TOKEN === 'your-jwt-token-here') {
        errors.push('AUTH_TOKEN is required');
    }

    return errors;
};

// פונקציה לעדכון הגדרות בזמן ריצה
export const updateConfig = (newConfig) => {
    Object.assign(MAP_COLONIES_CONFIG, newConfig);

    // ולידציה אחרי עדכון
    const errors = validateConfig();
    if (errors.length > 0) {
        console.warn('Configuration warnings:', errors);
    }

    return errors.length === 0;
};