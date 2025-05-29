// src/data/sampleData.js
// נתוני דוגמה עבור המפה - ערים, אזורים וכבישים בישראל

// ערים בישראל (WGS84)
export const israelCities = [
    {
        coordinates: [34.7818, 32.0853],
        properties: {
            name: 'תל אביב',
            population: 460000,
            type: 'major_city',
            color: '#ff0000',
            radius: 12
        }
    },
    {
        coordinates: [35.2137, 31.7683],
        properties: {
            name: 'ירושלים',
            population: 936000,
            type: 'capital',
            color: '#0000ff',
            radius: 15
        }
    },
    {
        coordinates: [34.9896, 32.7940],
        properties: {
            name: 'חיפה',
            population: 285000,
            type: 'major_city',
            color: '#00ff00',
            radius: 10
        }
    },
    {
        coordinates: [34.9518, 32.0853],
        properties: {
            name: 'נתניה',
            population: 230000,
            type: 'city',
            color: '#ffaa00',
            radius: 8
        }
    },
    {
        coordinates: [34.8516, 31.0461],
        properties: {
            name: 'באר שבע',
            population: 209000,
            type: 'city',
            color: '#ff6600',
            radius: 8
        }
    }
];

// פוליגון דוגמה - אזור תל אביב (WGS84)
export const telAvivArea = {
    type: 'Feature',
    geometry: {
        type: 'Polygon',
        coordinates: [[
            [34.7, 32.0],
            [34.9, 32.0],
            [34.9, 32.2],
            [34.7, 32.2],
            [34.7, 32.0]
        ]]
    },
    properties: {
        name: 'אזור תל אביב',
        type: 'metropolitan_area',
        fillColor: '#ff0000',
        fillOpacity: 0.2,
        outlineColor: '#ff0000',
        outlineWidth: 2
    }
};

// קו דוגמה - כביש 1 (WGS84)
export const highway1 = {
    type: 'Feature',
    geometry: {
        type: 'LineString',
        coordinates: [
            [34.7818, 32.0853], // תל אביב
            [34.8516, 31.8853],
            [35.0000, 31.8000],
            [35.2137, 31.7683]  // ירושלים
        ]
    },
    properties: {
        name: 'כביש 1',
        type: 'highway',
        lineColor: '#0066ff',
        lineWidth: 4
    }
};

// קבוצת כל הנתונים
export const sampleData = {
    points: israelCities,
    polygons: [telAvivArea],
    lines: [highway1]
};

// פונקציה לקבלת נתונים אסינכרוניים (מחקה טעינה מ-API)
export const loadSampleData = async (delay = 500) => {
    return new Promise(resolve => {
        setTimeout(() => {
            resolve(sampleData);
        }, delay);
    });
};