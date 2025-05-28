// src/services/mapColonies/mapColoniesService.js
// שירות לטיפול ב-API של MapColonies

import { MAP_COLONIES_CONFIG, getAuthHeaders, getCatalogUrl } from './config.js';

/**
 * שירות MapColonies - מימוש לפי הדוקומנטציה
 */
export class MapColoniesService {
    constructor() {
        this.cache = new Map(); // קאש פשוט לתוצאות
    }

    /**
     * Step 1: שאילתת קטלוג CSW לקבלת מטאדטה של שכבה
     */
    async queryLayer(productType, productId) {
        const cacheKey = `${productType}_${productId}`;

        // בדיקת קאש
        if (this.cache.has(cacheKey)) {
            console.log('Using cached layer data:', cacheKey);
            return this.cache.get(cacheKey);
        }

        try {
            const xmlBody = this.buildCSWQuery(productType, productId);
            console.log('Querying MapColonies catalog:', { productType, productId });

            const response = await fetch(getCatalogUrl(), {
                method: 'POST',
                headers: getAuthHeaders(),
                body: xmlBody
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const xmlText = await response.text();
            const layerData = this.parseCSWResponse(xmlText);

            // שמירה בקאש
            this.cache.set(cacheKey, layerData);

            console.log('Layer metadata received:', layerData);
            return layerData;

        } catch (error) {
            console.error('Error querying MapColonies catalog:', error);
            throw new Error(`Failed to query layer ${productType}/${productId}: ${error.message}`);
        }
    }

    /**
     * בניית שאילתת XML לפי הדוקומנטציה
     */
    buildCSWQuery(productType, productId) {
        return `<?xml version="1.0" encoding="UTF-8"?>
<csw:GetRecords 
    xmlns:csw="http://www.opengis.net/cat/csw/2.0.2" 
    service="CSW"
    maxRecords="1" 
    startPosition="1"
    outputSchema="http://schema.mapcolonies.com/raster" 
    version="2.0.2"
    xmlns:mc="http://schema.mapcolonies.com/raster">
    <csw:Query typeNames="mc:MCRasterRecord">
        <csw:ElementSetName>full</csw:ElementSetName>
        <csw:Constraint version="1.1.0">
            <Filter xmlns="http://www.opengis.net/ogc">
                <And>
                    <PropertyIsEqualTo>
                        <PropertyName>mc:productType</PropertyName>
                        <Literal>${productType}</Literal>
                    </PropertyIsEqualTo>
                    <PropertyIsEqualTo>
                        <PropertyName>mc:productId</PropertyName>
                        <Literal>${productId}</Literal>
                    </PropertyIsEqualTo>
                </And>
            </Filter>
        </csw:Constraint>
    </csw:Query>
</csw:GetRecords>`;
    }

    /**
     * Step 2: חילוץ Bounding Box מתוך התגובה
     */
    extractBoundingBox(xmlDoc) {
        try {
            // חיפוש footprint - גיאומטריה מדויקת יותר
            const footprintElement = xmlDoc.querySelector('footprint');
            if (footprintElement) {
                const footprintText = footprintElement.textContent;
                const footprint = JSON.parse(footprintText);

                // חישוב bounding box מה-footprint
                const coords = footprint.coordinates[0];
                const lngs = coords.map(coord => coord[0]);
                const lats = coords.map(coord => coord[1]);

                return {
                    west: Math.min(...lngs),
                    south: Math.min(...lats),
                    east: Math.max(...lngs),
                    north: Math.max(...lats),
                    footprint: footprint
                };
            }

            // חיפוש BoundingBox רגיל
            const boundingBoxElement = xmlDoc.querySelector('BoundingBox');
            if (boundingBoxElement) {
                const lowerCorner = boundingBoxElement.querySelector('LowerCorner').textContent.split(' ');
                const upperCorner = boundingBoxElement.querySelector('UpperCorner').textContent.split(' ');

                return {
                    west: parseFloat(lowerCorner[0]),
                    south: parseFloat(lowerCorner[1]),
                    east: parseFloat(upperCorner[0]),
                    north: parseFloat(upperCorner[1])
                };
            }

            throw new Error('No bounding box found in response');
        } catch (error) {
            console.error('Error extracting bounding box:', error);
            return null;
        }
    }

    /**
     * Step 3: חילוץ קישורי WMTS מהתגובה
     */
    extractWMTSLinks(xmlDoc) {
        const links = {};

        try {
            const linkElements = xmlDoc.querySelectorAll('links');

            linkElements.forEach(link => {
                const scheme = link.getAttribute('scheme');
                const name = link.getAttribute('name');
                const url = link.textContent.trim();

                if (scheme && scheme.includes('WMTS')) {
                    links[scheme] = {
                        url: url,
                        layerIdentifier: name
                    };
                }
            });

            console.log('Extracted WMTS links:', links);
            return links;
        } catch (error) {
            console.error('Error extracting WMTS links:', error);
            return {};
        }
    }

    /**
     * Step 4: קבלת capabilities מהשרת
     */
    async getLayerCapabilities(wmtsUrl, layerIdentifier) {
        try {
            console.log('Getting layer capabilities:', { wmtsUrl, layerIdentifier });

            const response = await fetch(wmtsUrl, {
                method: 'GET',
                headers: {
                    'Accept': 'application/xml',
                    'Authorization': `Bearer ${MAP_COLONIES_CONFIG.AUTH_TOKEN}`
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const xmlText = await response.text();
            const parser = new DOMParser();
            const xmlDoc = parser.parseFromString(xmlText, 'text/xml');

            return this.parseCapabilities(xmlDoc, layerIdentifier);
        } catch (error) {
            console.error('Error getting capabilities:', error);
            throw error;
        }
    }

    /**
     * פרסור capabilities XML
     */
    parseCapabilities(xmlDoc, targetLayerIdentifier) {
        try {
            const layers = xmlDoc.querySelectorAll('Layer');

            for (const layer of layers) {
                const identifier = layer.querySelector('Identifier')?.textContent;

                if (identifier === targetLayerIdentifier) {
                    const style = layer.querySelector('Style Identifier')?.textContent || 'default';
                    const format = layer.querySelector('Format')?.textContent || 'image/png';
                    const tileMatrixSet = layer.querySelector('TileMatrixSetLink TileMatrixSet')?.textContent;

                    // חיפוש ResourceURL לשימוש ישיר
                    const resourceURL = layer.querySelector('ResourceURL');
                    let template = null;
                    if (resourceURL) {
                        template = resourceURL.getAttribute('template');
                    }

                    return {
                        identifier,
                        style,
                        format,
                        tileMatrixSet,
                        template
                    };
                }
            }

            throw new Error(`Layer ${targetLayerIdentifier} not found in capabilities`);
        } catch (error) {
            console.error('Error parsing capabilities:', error);
            throw error;
        }
    }

    /**
     * פרסור התגובה המלאה מ-CSW
     */
    parseCSWResponse(xmlText) {
        try {
            const parser = new DOMParser();
            const xmlDoc = parser.parseFromString(xmlText, 'text/xml');

            // בדיקת שגיאות XML
            const parseError = xmlDoc.querySelector('parsererror');
            if (parseError) {
                throw new Error('Invalid XML response');
            }

            // חילוץ נתונים בסיסיים
            const productName = xmlDoc.querySelector('productName')?.textContent || 'Unknown Layer';
            const description = xmlDoc.querySelector('description')?.textContent || '';

            // חילוץ bounding box
            const boundingBox = this.extractBoundingBox(xmlDoc);

            // חילוץ קישורי WMTS
            const wmtsLinks = this.extractWMTSLinks(xmlDoc);

            return {
                productName,
                description,
                boundingBox,
                wmtsLinks,
                rawXml: xmlText // שמירת ה-XML המקורי לצורך דיבוג
            };
        } catch (error) {
            console.error('Error parsing CSW response:', error);
            throw new Error(`Failed to parse layer metadata: ${error.message}`);
        }
    }

    /**
     * Step 5: בניית MapLibre Style מלא לשכבה
     */
    async buildMapLibreStyle(productType, productId, layerName = null) {
        try {
            console.log('Building MapLibre style for:', { productType, productId });

            // שלב 1: קבלת מטאדטה
            const layerData = await this.queryLayer(productType, productId);

            // שלב 2: בחירת הקישור המתאים (מעדיף WMTS על פני WMTS_KVP)
            const wmtsLinks = layerData.wmtsLinks;
            let selectedLink = wmtsLinks.WMTS || wmtsLinks.WMTS_KVP || wmtsLinks.WMTS_BASE;

            if (!selectedLink) {
                throw new Error('No WMTS links found in layer metadata');
            }

            // שלב 3: קבלת capabilities
            const capabilities = await this.getLayerCapabilities(selectedLink.url, selectedLink.layerIdentifier);

            // שלב 4: בניית URL האריחים
            let tilesUrl;
            if (capabilities.template) {
                // שימוש ב-ResourceURL המוכן
                tilesUrl = capabilities.template;
            } else {
                // בניית URL באופן ידני
                const baseUrl = selectedLink.url.replace('/1.0.0/WMTSCapabilities.xml', '');
                tilesUrl = `${baseUrl}/1.0.0/layer/${selectedLink.layerIdentifier}/${capabilities.style}/${capabilities.tileMatrixSet}/{z}/{y}/{x}.${capabilities.format.split('/')[1]}`;
            }

            // הוספת אסימון לתבנית ה-URL
            if (tilesUrl.includes('?')) {
                tilesUrl += `&token=${MAP_COLONIES_CONFIG.AUTH_TOKEN}`;
            } else {
                tilesUrl += `?token=${MAP_COLONIES_CONFIG.AUTH_TOKEN}`;
            }

            // שלב 5: בניית סגנון MapLibre
            const mapStyle = {
                version: 8,
                name: layerName || layerData.productName || `${productType} - ${productId}`,
                sources: {
                    'mapcolonies-raster': {
                        type: 'raster',
                        tiles: [tilesUrl],
                        tileSize: MAP_COLONIES_CONFIG.WMTS_CONFIG.tileSize,
                        attribution: '© MapColonies',
                        minzoom: 0,
                        maxzoom: MAP_COLONIES_CONFIG.WMTS_CONFIG.maxZoom
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
                        id: 'mapcolonies-layer',
                        type: 'raster',
                        source: 'mapcolonies-raster',
                        paint: {
                            'raster-opacity': 1,
                            'raster-fade-duration': 300
                        }
                    }
                ]
            };

            console.log('MapLibre style built successfully:', mapStyle.name);
            return {
                style: mapStyle,
                boundingBox: layerData.boundingBox,
                metadata: layerData
            };

        } catch (error) {
            console.error('Error building MapLibre style:', error);
            throw error;
        }
    }

    /**
     * קבלת רשימת כל השכבות הזמינות (לפיתוח עתידי)
     */
    async getAllLayers() {
        try {
            // שאילתה כללית לכל השכבות
            const xmlBody = `<?xml version="1.0" encoding="UTF-8"?>
<csw:GetRecords 
    xmlns:csw="http://www.opengis.net/cat/csw/2.0.2" 
    service="CSW"
    maxRecords="100" 
    startPosition="1"
    outputSchema="http://schema.mapcolonies.com/raster" 
    version="2.0.2"
    xmlns:mc="http://schema.mapcolonies.com/raster">
    <csw:Query typeNames="mc:MCRasterRecord">
        <csw:ElementSetName>summary</csw:ElementSetName>
    </csw:Query>
</csw:GetRecords>`;

            const response = await fetch(getCatalogUrl(), {
                method: 'POST',
                headers: getAuthHeaders(),
                body: xmlBody
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const xmlText = await response.text();
            // TODO: פרסור רשימת השכבות

            return xmlText;
        } catch (error) {
            console.error('Error getting all layers:', error);
            throw error;
        }
    }

    /**
     * ניקוי קאש
     */
    clearCache() {
        this.cache.clear();
        console.log('MapColonies cache cleared');
    }
}

// יצירת instance יחיד
export const mapColoniesService = new MapColoniesService();