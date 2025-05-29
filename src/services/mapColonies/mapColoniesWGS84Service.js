// src/services/mapColonies/mapColoniesWGS84Service.js
// שירות MapColonies מותאם ל-WGS84 ו-OpenLayers

import { MAP_COLONIES_CONFIG, getAuthHeaders, getCatalogUrl } from './config.js';

/**
 * שירות MapColonies מותאם ל-WGS84 - עבור OpenLayers
 */
export class MapColoniesWGS84Service {
    constructor() {
        this.cache = new Map();
    }

    /**
     * שאילתת שכבה עם מטאדטה מלא
     */
    async queryLayer(productType, productId) {
        const cacheKey = `${productType}_${productId}`;

        if (this.cache.has(cacheKey)) {
            console.log('Using cached WGS84 layer data:', cacheKey);
            return this.cache.get(cacheKey);
        }

        try {
            const xmlBody = this.buildCSWQuery(productType, productId);
            console.log('Querying MapColonies for WGS84 layer:', { productType, productId });

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

            console.log('WGS84 Layer metadata received:', layerData);
            return layerData;

        } catch (error) {
            console.error('Error querying MapColonies WGS84 layer:', error);
            throw new Error(`Failed to query WGS84 layer ${productType}/${productId}: ${error.message}`);
        }
    }

    /**
     * בניית שאילתה עם דגש על WGS84
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
     * חילוץ bounding box ב-WGS84
     */
    extractWGS84BoundingBox(xmlDoc) {
        try {
            // חיפוש footprint (מדויק יותר)
            const footprintElement = xmlDoc.querySelector('footprint');
            if (footprintElement) {
                const footprintText = footprintElement.textContent;
                const footprint = JSON.parse(footprintText);

                if (footprint.type === 'Polygon' && footprint.coordinates) {
                    const coords = footprint.coordinates[0];
                    const lngs = coords.map(coord => coord[0]);
                    const lats = coords.map(coord => coord[1]);

                    const bbox = {
                        west: Math.min(...lngs),
                        south: Math.min(...lats),
                        east: Math.max(...lngs),
                        north: Math.max(...lats),
                        footprint: footprint,
                        projection: 'EPSG:4326' // WGS84
                    };

                    console.log('Extracted WGS84 bounding box from footprint:', bbox);
                    return bbox;
                }
            }

            // נסיון לחלץ BoundingBox רגיל
            const boundingBoxElement = xmlDoc.querySelector('BoundingBox');
            if (boundingBoxElement) {
                const lowerCorner = boundingBoxElement.querySelector('LowerCorner')?.textContent?.split(' ');
                const upperCorner = boundingBoxElement.querySelector('UpperCorner')?.textContent?.split(' ');

                if (lowerCorner && upperCorner) {
                    const bbox = {
                        west: parseFloat(lowerCorner[0]),
                        south: parseFloat(lowerCorner[1]),
                        east: parseFloat(upperCorner[0]),
                        north: parseFloat(upperCorner[1]),
                        projection: 'EPSG:4326'
                    };

                    console.log('Extracted WGS84 bounding box from BoundingBox:', bbox);
                    return bbox;
                }
            }

            console.warn('No bounding box found, using Israel default');
            // ברירת מחדל - גבולות ישראל ב-WGS84
            return {
                west: 34.2,
                south: 29.5,
                east: 35.9,
                north: 33.4,
                projection: 'EPSG:4326',
                default: true
            };

        } catch (error) {
            console.error('Error extracting WGS84 bounding box:', error);
            return {
                west: 34.2,
                south: 29.5,
                east: 35.9,
                north: 33.4,
                projection: 'EPSG:4326',
                error: true
            };
        }
    }

    /**
     * חילוץ קישורי WMTS עם התמקדות ב-WGS84
     */
    extractWGS84WMTSLinks(xmlDoc) {
        const links = {};

        try {
            const linkElements = xmlDoc.querySelectorAll('links');

            linkElements.forEach(link => {
                const scheme = link.getAttribute('scheme');
                const name = link.getAttribute('name');
                const description = link.getAttribute('description') || '';
                const url = link.textContent.trim();

                if (scheme && scheme.includes('WMTS')) {
                    links[scheme] = {
                        url: url,
                        layerIdentifier: name,
                        description: description,
                        // הוספת מידע על תמיכה ב-WGS84
                        supportsWGS84: true,
                        projection: 'EPSG:4326'
                    };
                }
            });

            console.log('Extracted WGS84 WMTS links:', links);
            return links;
        } catch (error) {
            console.error('Error extracting WGS84 WMTS links:', error);
            return {};
        }
    }

    /**
     * קבלת capabilities עם התמקדות ב-WGS84
     */
    async getWGS84LayerCapabilities(wmtsUrl, layerIdentifier) {
        try {
            console.log('Getting WGS84 layer capabilities:', { wmtsUrl, layerIdentifier });

            // הוספת פרמטר לטוקן אם לא קיים
            let capabilitiesUrl = wmtsUrl;
            if (!capabilitiesUrl.includes('token=') && MAP_COLONIES_CONFIG.AUTH_TOKEN !== 'your-jwt-token-here') {
                const separator = capabilitiesUrl.includes('?') ? '&' : '?';
                capabilitiesUrl += `${separator}token=${MAP_COLONIES_CONFIG.AUTH_TOKEN}`;
            }

            const response = await fetch(capabilitiesUrl, {
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

            return this.parseWGS84Capabilities(xmlDoc, layerIdentifier);
        } catch (error) {
            console.error('Error getting WGS84 capabilities:', error);
            throw error;
        }
    }

    /**
     * פרסור capabilities עם דגש על WGS84
     */
    parseWGS84Capabilities(xmlDoc, targetLayerIdentifier) {
        try {
            const layers = xmlDoc.querySelectorAll('Layer');

            for (const layer of layers) {
                const identifier = layer.querySelector('Identifier')?.textContent;

                if (identifier === targetLayerIdentifier) {
                    const style = layer.querySelector('Style Identifier')?.textContent || 'default';
                    const format = layer.querySelector('Format')?.textContent || 'image/png';

                    // חיפוש TileMatrixSet עם העדפה ל-WGS84
                    const tileMatrixSetLinks = layer.querySelectorAll('TileMatrixSetLink');
                    let tileMatrixSet = 'InspireCRS84Quad'; // ברירת מחדל לWGS84

                    for (const link of tileMatrixSetLinks) {
                        const matrixSet = link.querySelector('TileMatrixSet')?.textContent;
                        if (matrixSet) {
                            // העדפה לCRS84 או WGS84
                            if (matrixSet.toLowerCase().includes('crs84') ||
                                matrixSet.toLowerCase().includes('4326') ||
                                matrixSet.toLowerCase().includes('wgs84')) {
                                tileMatrixSet = matrixSet;
                                break;
                            }
                            // גיבוי - כל TileMatrixSet שנמצא
                            tileMatrixSet = matrixSet;
                        }
                    }

                    // חיפוש ResourceURL
                    const resourceURL = layer.querySelector('ResourceURL');
                    let template = null;
                    if (resourceURL) {
                        template = resourceURL.getAttribute('template');
                    }

                    const capabilities = {
                        identifier,
                        style,
                        format,
                        tileMatrixSet,
                        template,
                        projection: 'EPSG:4326',
                        isWGS84Compatible: true
                    };

                    console.log('Parsed WGS84 capabilities:', capabilities);
                    return capabilities;
                }
            }

            throw new Error(`WGS84 Layer ${targetLayerIdentifier} not found in capabilities`);
        } catch (error) {
            console.error('Error parsing WGS84 capabilities:', error);
            throw error;
        }
    }

    /**
     * פרסור תגובת CSW עם דגש על WGS84
     */
    parseCSWResponse(xmlText) {
        try {
            const parser = new DOMParser();
            const xmlDoc = parser.parseFromString(xmlText, 'text/xml');

            const parseError = xmlDoc.querySelector('parsererror');
            if (parseError) {
                throw new Error('Invalid XML response');
            }

            const productName = xmlDoc.querySelector('productName')?.textContent || 'Unknown WGS84 Layer';
            const description = xmlDoc.querySelector('description')?.textContent || '';

            // חילוץ מידע ספציפי ל-WGS84
            const boundingBox = this.extractWGS84BoundingBox(xmlDoc);
            const wmtsLinks = this.extractWGS84WMTSLinks(xmlDoc);

            // מידע נוסף על הרזולוציה
            const maxResolutionDeg = xmlDoc.querySelector('maxResolutionDeg')?.textContent;
            const minResolutionDeg = xmlDoc.querySelector('minResolutionDeg')?.textContent;

            return {
                productName,
                description,
                boundingBox,
                wmtsLinks,
                maxResolutionDeg: maxResolutionDeg ? parseFloat(maxResolutionDeg) : null,
                minResolutionDeg: minResolutionDeg ? parseFloat(minResolutionDeg) : null,
                projection: 'EPSG:4326',
                rawXml: xmlText
            };
        } catch (error) {
            console.error('Error parsing WGS84 CSW response:', error);
            throw new Error(`Failed to parse WGS84 layer metadata: ${error.message}`);
        }
    }

    /**
     * בניית OpenLayers WMTS Source עבור WGS84
     */
    async buildOpenLayersWMTSSource(productType, productId, layerName = null) {
        try {
            console.log('Building OpenLayers WMTS source for WGS84:', { productType, productId });

            // שלב 1: קבלת מטאדטה
            const layerData = await this.queryLayer(productType, productId);

            // שלב 2: בחירת קישור WMTS מתאים
            const wmtsLinks = layerData.wmtsLinks;
            let selectedLink = wmtsLinks.WMTS || wmtsLinks.WMTS_KVP || wmtsLinks.WMTS_BASE;

            if (!selectedLink) {
                throw new Error('No WMTS links found in WGS84 layer metadata');
            }

            // שלב 3: קבלת capabilities
            const capabilities = await this.getWGS84LayerCapabilities(selectedLink.url, selectedLink.layerIdentifier);

            // שלב 4: בניית URL האריחים עבור WGS84
            let tilesUrl;
            if (capabilities.template) {
                tilesUrl = capabilities.template;
            } else {
                // בניית URL ידני עבור WGS84
                const baseUrl = selectedLink.url.replace('/1.0.0/WMTSCapabilities.xml', '');
                tilesUrl = `${baseUrl}/1.0.0/layer/${selectedLink.layerIdentifier}/${capabilities.style}/${capabilities.tileMatrixSet}/{z}/{y}/{x}.${capabilities.format.split('/')[1]}`;
            }

            // הוספת טוקן
            if (MAP_COLONIES_CONFIG.AUTH_TOKEN !== 'your-jwt-token-here') {
                const separator = tilesUrl.includes('?') ? '&' : '?';
                tilesUrl += `${separator}token=${MAP_COLONIES_CONFIG.AUTH_TOKEN}`;
            }

            console.log('Built WGS84 tiles URL:', tilesUrl);

            // שלב 5: יצירת OpenLayers Source Configuration
            const sourceConfig = {
                url: tilesUrl,
                layer: selectedLink.layerIdentifier,
                matrixSet: capabilities.tileMatrixSet,
                format: capabilities.format,
                style: capabilities.style,
                projection: 'EPSG:4326',
                tileGrid: this.createWGS84TileGrid(),
                attributions: `© MapColonies - ${layerName || layerData.productName}`,
                crossOrigin: 'anonymous'
            };

            return {
                sourceConfig,
                boundingBox: layerData.boundingBox,
                metadata: layerData,
                layerName: layerName || layerData.productName,
                tilesUrl
            };

        } catch (error) {
            console.error('Error building OpenLayers WMTS source:', error);
            throw error;
        }
    }

    /**
     * יצירת TileGrid עבור WGS84 (EPSG:4326)
     */
    createWGS84TileGrid() {
        // הגדרות עבור InspireCRS84Quad
        const projectionExtent = [-180, -90, 180, 90];
        const resolutions = [];
        const matrixIds = [];

        // יצירת רזולוציות עבור 22 רמות זום
        for (let z = 0; z < 22; ++z) {
            // הרזולוציה הבסיסית עבור WGS84
            resolutions[z] = 0.703125 / Math.pow(2, z);
            matrixIds[z] = z;
        }

        // החזרת הגדרות TileGrid
        return {
            extent: projectionExtent,
            resolutions: resolutions,
            matrixIds: matrixIds,
            tileSize: 256
        };
    }

    /**
     * בניית MapLibre Style מותאם ל-OpenLayers WGS84
     */
    async buildMapLibreStyleForWGS84(productType, productId, layerName = null) {
        try {
            const wmtsData = await this.buildOpenLayersWMTSSource(productType, productId, layerName);

            // יצירת MapLibre style שיעבוד עם OpenLayers
            const mapStyle = {
                version: 8,
                name: wmtsData.layerName,
                projection: 'EPSG:4326',
                sources: {
                    'mapcolonies-wgs84-raster': {
                        type: 'raster',
                        tiles: [wmtsData.tilesUrl],
                        tileSize: 256,
                        attribution: wmtsData.sourceConfig.attributions,
                        minzoom: 0,
                        maxzoom: 21,
                        // מטאדטה ספציפי ל-WGS84
                        scheme: 'xyz',
                        projection: 'EPSG:4326'
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
                        id: 'mapcolonies-wgs84-layer',
                        type: 'raster',
                        source: 'mapcolonies-wgs84-raster',
                        paint: {
                            'raster-opacity': 1,
                            'raster-fade-duration': 300
                        }
                    }
                ],
                // מטאדטה נוסף עבור OpenLayers
                metadata: {
                    'mapcolonies:projection': 'EPSG:4326',
                    'mapcolonies:tileMatrixSet': wmtsData.sourceConfig.matrixSet,
                    'mapcolonies:boundingBox': wmtsData.boundingBox
                }
            };

            console.log('Built MapLibre style for WGS84:', mapStyle.name);
            return {
                style: mapStyle,
                boundingBox: wmtsData.boundingBox,
                metadata: wmtsData.metadata,
                openLayersConfig: wmtsData.sourceConfig
            };

        } catch (error) {
            console.error('Error building MapLibre style for WGS84:', error);
            throw error;
        }
    }

    /**
     * קבלת רשימת שכבות WGS84 זמינות
     */
    async getAvailableWGS84Layers() {
        try {
            const xmlBody = `<?xml version="1.0" encoding="UTF-8"?>
<csw:GetRecords 
    xmlns:csw="http://www.opengis.net/cat/csw/2.0.2" 
    service="CSW"
    maxRecords="50" 
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
            return this.parseLayersList(xmlText);

        } catch (error) {
            console.error('Error getting available WGS84 layers:', error);
            throw error;
        }
    }

    /**
     * פרסור רשימת שכבות
     */
    parseLayersList(xmlText) {
        try {
            const parser = new DOMParser();
            const xmlDoc = parser.parseFromString(xmlText, 'text/xml');

            const records = xmlDoc.querySelectorAll('Record');
            const layers = [];

            records.forEach(record => {
                const productType = record.querySelector('productType')?.textContent;
                const productId = record.querySelector('productId')?.textContent;
                const productName = record.querySelector('productName')?.textContent;
                const description = record.querySelector('description')?.textContent;

                if (productType && productId) {
                    layers.push({
                        productType,
                        productId,
                        productName: productName || `${productType} - ${productId}`,
                        description: description || '',
                        projection: 'EPSG:4326'
                    });
                }
            });

            console.log(`Found ${layers.length} WGS84 layers`);
            return layers;

        } catch (error) {
            console.error('Error parsing layers list:', error);
            return [];
        }
    }

    /**
     * ניקוי קאש
     */
    clearCache() {
        this.cache.clear();
        console.log('MapColonies WGS84 cache cleared');
    }

    /**
     * בדיקת תקינות הגדרות WGS84
     */
    validateWGS84Config() {
        const issues = [];

        if (!MAP_COLONIES_CONFIG.CATALOG_SERVICE_URL.startsWith('http')) {
            issues.push('Invalid catalog service URL');
        }

        if (MAP_COLONIES_CONFIG.AUTH_TOKEN === 'your-jwt-token-here') {
            issues.push('Auth token not configured');
        }

        return {
            isValid: issues.length === 0,
            issues
        };
    }
}

// יצירת instance יחיד עבור WGS84
export const mapColoniesWGS84Service = new MapColoniesWGS84Service();