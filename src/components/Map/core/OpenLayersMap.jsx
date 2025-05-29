// src/components/Map/core/OpenLayersMap.jsx
import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Map, View } from 'ol';
import { Tile as TileLayer, Vector as VectorLayer } from 'ol/layer';
import { OSM, WMTS, Vector as VectorSource } from 'ol/source';
import { fromLonLat, transformExtent } from 'ol/proj';
import { Feature } from 'ol';
import { Point, LineString, Polygon } from 'ol/geom';
import { Style, Fill, Stroke, Circle as CircleStyle } from 'ol/style';
import { WMTSTileGrid } from 'ol/tilegrid';
import { getTopLeft, getWidth, getHeight } from 'ol/extent';
import 'ol/ol.css';

const OpenLayersMap = ({
                           // הגדרות בסיסיות
                           initialCenter = { lng: 34.8516, lat: 31.0461 },
                           initialZoom = 8,
                           mapStyle = null, // MapLibre style object או null לברירת מחדל

                           // נתוני ישויות
                           points = [],
                           polygons = [],
                           lines = [],

                           // מאזיני אירועים
                           onMapLoad,
                           onMapMove,
                           onMapClick,
                           onPointClick,
                           onPolygonClick,
                           onLineClick,

                           // הגדרות תצוגה
                           pointsVisible = true,
                           polygonsVisible = true,
                           linesVisible = true,

                           // פונקציות התאמה
                           getPointProps,
                           getPolygonProps,
                           getLineProps,
                       }) => {
    const mapRef = useRef(null);
    const mapContainerRef = useRef(null);
    const [olMap, setOlMap] = useState(null);
    const [currentPosition, setCurrentPosition] = useState(initialCenter);
    const [currentZoom, setCurrentZoom] = useState(initialZoom);

    // שכבות וקטוריות
    const pointsLayerRef = useRef(null);
    const polygonsLayerRef = useRef(null);
    const linesLayerRef = useRef(null);

    // יצירת WMTS source מ-MapLibre style
    const createWMTSSource = useCallback((mapLibreStyle) => {
        if (!mapLibreStyle || !mapLibreStyle.sources) {
            return null;
        }

        // מחפש את ה-source הראשון שהוא raster
        const rasterSource = Object.values(mapLibreStyle.sources).find(
            source => source.type === 'raster'
        );

        if (!rasterSource || !rasterSource.tiles) {
            return null;
        }

        try {
            const tileUrl = rasterSource.tiles[0];
            console.log('Creating WMTS source with URL:', tileUrl);

            // יצירת WMTS Tile Grid עבור WGS84 (EPSG:4326)
            const projectionExtent = [-180, -90, 180, 90];
            const maxResolution = getWidth(projectionExtent) / 256;
            const resolutions = [];
            const matrixIds = [];

            // יצירת רזולוציות עבור 22 רמות זום (0-21)
            for (let z = 0; z < 22; ++z) {
                resolutions[z] = maxResolution / Math.pow(2, z);
                matrixIds[z] = z;
            }

            const tileGrid = new WMTSTileGrid({
                origin: getTopLeft(projectionExtent),
                resolutions: resolutions,
                matrixIds: matrixIds,
                tileSize: rasterSource.tileSize || 256
            });

            return new WMTS({
                url: tileUrl,
                layer: 'layer', // ברירת מחדל - יעודכן לפי הצורך
                matrixSet: 'EPSG:4326',
                format: 'image/png',
                projection: 'EPSG:4326',
                tileGrid: tileGrid,
                style: 'default',
                attributions: rasterSource.attribution || '© MapColonies'
            });
        } catch (error) {
            console.error('Error creating WMTS source:', error);
            return null;
        }
    }, []);

    // יצירת שכבת רקע
    const createBaseLayer = useCallback(() => {
        if (mapStyle) {
            const wmtsSource = createWMTSSource(mapStyle);
            if (wmtsSource) {
                return new TileLayer({
                    source: wmtsSource,
                    title: mapStyle.name || 'WMTS Layer'
                });
            }
        }

        // ברירת מחדל - OSM
        return new TileLayer({
            source: new OSM(),
            title: 'OpenStreetMap'
        });
    }, [mapStyle, createWMTSSource]);

    // המרת נקודות ל-OpenLayers Features
    const convertPointsToFeatures = useCallback((pointsData) => {
        return pointsData.map((point, index) => {
            const coords = point.coordinates || [point.lng || point.lon || 0, point.lat || 0];
            const feature = new Feature({
                geometry: new Point(fromLonLat(coords)),
                ...point.properties,
                originalData: point
            });

            // עיצוב הנקודה
            const props = getPointProps ? getPointProps(point) : {};
            const style = new Style({
                image: new CircleStyle({
                    radius: props.radius || 6,
                    fill: new Fill({
                        color: props.color || '#ff0000'
                    }),
                    stroke: new Stroke({
                        color: '#ffffff',
                        width: 2
                    })
                })
            });

            feature.setStyle(style);
            feature.setId(`point-${index}`);
            return feature;
        });
    }, [getPointProps]);

    // המרת פוליגונים ל-OpenLayers Features
    const convertPolygonsToFeatures = useCallback((polygonsData) => {
        return polygonsData.map((polygon, index) => {
            let geometry;

            if (polygon.type === 'Feature' && polygon.geometry) {
                const coords = polygon.geometry.coordinates;
                if (polygon.geometry.type === 'Polygon') {
                    // המרת קואורדינטות ל-Web Mercator
                    const transformedCoords = coords.map(ring =>
                        ring.map(coord => fromLonLat(coord))
                    );
                    geometry = new Polygon(transformedCoords);
                }
            }

            if (!geometry) {
                console.warn('Could not create geometry for polygon:', polygon);
                return null;
            }

            const feature = new Feature({
                geometry: geometry,
                ...polygon.properties,
                originalData: polygon
            });

            // עיצוב הפוליגון
            const props = getPolygonProps ? getPolygonProps(polygon) : {};
            const style = new Style({
                fill: new Fill({
                    color: props.fillColor || 'rgba(0, 128, 255, 0.3)'
                }),
                stroke: new Stroke({
                    color: props.outlineColor || '#005cb2',
                    width: props.outlineWidth || 2
                })
            });

            feature.setStyle(style);
            feature.setId(`polygon-${index}`);
            return feature;
        }).filter(Boolean);
    }, [getPolygonProps]);

    // המרת קווים ל-OpenLayers Features
    const convertLinesToFeatures = useCallback((linesData) => {
        return linesData.map((line, index) => {
            let geometry;

            if (line.type === 'Feature' && line.geometry) {
                const coords = line.geometry.coordinates;
                if (line.geometry.type === 'LineString') {
                    const transformedCoords = coords.map(coord => fromLonLat(coord));
                    geometry = new LineString(transformedCoords);
                }
            }

            if (!geometry) {
                console.warn('Could not create geometry for line:', line);
                return null;
            }

            const feature = new Feature({
                geometry: geometry,
                ...line.properties,
                originalData: line
            });

            // עיצוב הקו
            const props = getLineProps ? getLineProps(line) : {};
            const style = new Style({
                stroke: new Stroke({
                    color: props.lineColor || '#0066ff',
                    width: props.lineWidth || 3
                })
            });

            feature.setStyle(style);
            feature.setId(`line-${index}`);
            return feature;
        }).filter(Boolean);
    }, [getLineProps]);

    // עדכון שכבות וקטוריות
    const updateVectorLayers = useCallback(() => {
        if (!olMap) return;

        // עדכון שכבת נקודות
        if (pointsLayerRef.current) {
            const pointFeatures = convertPointsToFeatures(points);
            pointsLayerRef.current.getSource().clear();
            pointsLayerRef.current.getSource().addFeatures(pointFeatures);
            pointsLayerRef.current.setVisible(pointsVisible);
        }

        // עדכון שכבת פוליגונים
        if (polygonsLayerRef.current) {
            const polygonFeatures = convertPolygonsToFeatures(polygons);
            polygonsLayerRef.current.getSource().clear();
            polygonsLayerRef.current.getSource().addFeatures(polygonFeatures);
            polygonsLayerRef.current.setVisible(polygonsVisible);
        }

        // עדכון שכבת קווים
        if (linesLayerRef.current) {
            const lineFeatures = convertLinesToFeatures(lines);
            linesLayerRef.current.getSource().clear();
            linesLayerRef.current.getSource().addFeatures(lineFeatures);
            linesLayerRef.current.setVisible(linesVisible);
        }
    }, [olMap, points, polygons, lines, pointsVisible, polygonsVisible, linesVisible,
        convertPointsToFeatures, convertPolygonsToFeatures, convertLinesToFeatures]);

    // אתחול המפה
    useEffect(() => {
        if (!mapContainerRef.current || olMap) return;

        console.log('Initializing OpenLayers map...');

        // יצירת המפה
        const map = new Map({
            target: mapContainerRef.current,
            view: new View({
                center: fromLonLat([initialCenter.lng, initialCenter.lat]),
                zoom: initialZoom,
                projection: 'EPSG:3857' // Web Mercator לתצוגה
            }),
            layers: [createBaseLayer()] // שכבת רקע
        });

        // יצירת שכבות וקטוריות
        const pointsLayer = new VectorLayer({
            source: new VectorSource(),
            title: 'Points'
        });

        const polygonsLayer = new VectorLayer({
            source: new VectorSource(),
            title: 'Polygons'
        });

        const linesLayer = new VectorLayer({
            source: new VectorSource(),
            title: 'Lines'
        });

        // הוספת השכבות למפה
        map.addLayer(linesLayer);    // קווים תחתונים
        map.addLayer(polygonsLayer); // פוליגונים באמצע
        map.addLayer(pointsLayer);   // נקודות עליונות

        // שמירת הפניות לשכבות
        pointsLayerRef.current = pointsLayer;
        polygonsLayerRef.current = polygonsLayer;
        linesLayerRef.current = linesLayer;

        // מאזיני אירועים
        map.on('moveend', () => {
            const view = map.getView();
            const center = view.getCenter();
            const zoom = view.getZoom();

            // המרה חזרה ל-WGS84
            const [lng, lat] = ol.proj.toLonLat(center);

            setCurrentPosition({ lng, lat });
            setCurrentZoom(zoom);

            if (onMapMove) {
                onMapMove({
                    center: { lng, lat },
                    zoom,
                    bounds: view.calculateExtent()
                });
            }
        });

        map.on('singleclick', (event) => {
            const [lng, lat] = ol.proj.toLonLat(event.coordinate);

            // בדיקה אם נלחץ על feature
            const feature = map.forEachFeatureAtPixel(event.pixel, (feature) => feature);

            if (feature) {
                const originalData = feature.get('originalData');
                const featureId = feature.getId();

                if (featureId.startsWith('point-') && onPointClick) {
                    onPointClick(originalData);
                } else if (featureId.startsWith('polygon-') && onPolygonClick) {
                    onPolygonClick(originalData);
                } else if (featureId.startsWith('line-') && onLineClick) {
                    onLineClick(originalData);
                }
            } else if (onMapClick) {
                onMapClick({
                    lngLat: { lng, lat },
                    coordinate: event.coordinate,
                    originalEvent: event.originalEvent
                });
            }
        });

        // שמירת המפה ב-state
        setOlMap(map);
        mapRef.current = map;

        // קריאה ל-onMapLoad
        if (onMapLoad) {
            onMapLoad({
                map: map,
                flyTo: (center, zoom, options = {}) => {
                    map.getView().animate({
                        center: fromLonLat([center.lng, center.lat]),
                        zoom: zoom,
                        duration: options.duration || 1000
                    });
                },
                getZoom: () => map.getView().getZoom(),
                getCenter: () => {
                    const [lng, lat] = ol.proj.toLonLat(map.getView().getCenter());
                    return { lng, lat };
                },
                getBounds: () => map.getView().calculateExtent()
            });
        }

        return () => {
            if (map) {
                map.setTarget(null);
            }
        };
    }, [initialCenter, initialZoom, createBaseLayer, onMapLoad, onMapMove, onMapClick,
        onPointClick, onPolygonClick, onLineClick]);

    // עדכון שכבת הרקע כשמשתנה הסגנון
    useEffect(() => {
        if (!olMap) return;

        const layers = olMap.getLayers().getArray();
        const baseLayer = layers[0]; // השכבה הראשונה היא הרקע

        if (baseLayer) {
            olMap.removeLayer(baseLayer);
        }

        const newBaseLayer = createBaseLayer();
        olMap.getLayers().insertAt(0, newBaseLayer);

        console.log('Base layer updated');
    }, [olMap, mapStyle, createBaseLayer]);

    // עדכון הנתונים כשמשתנים
    useEffect(() => {
        updateVectorLayers();
    }, [updateVectorLayers]);

    return (
        <div style={{ position: 'relative', width: '100%', height: '100%' }}>
            {/* מכל המפה */}
            <div
                ref={mapContainerRef}
                style={{
                    width: '100%',
                    height: '100%',
                    minHeight: '500px'
                }}
            />

            {/* מידע על המפה */}
            <div
                style={{
                    position: 'absolute',
                    bottom: '10px',
                    left: '10px',
                    backgroundColor: 'rgba(255, 255, 255, 0.9)',
                    padding: '8px 12px',
                    borderRadius: '4px',
                    fontSize: '12px',
                    zIndex: 10,
                    fontFamily: 'monospace',
                    border: '1px solid #ccc'
                }}
            >
                <div>📍 {currentPosition.lat.toFixed(4)}, {currentPosition.lng.toFixed(4)}</div>
                <div>🔍 Zoom: {currentZoom.toFixed(2)}</div>
                <div>🗺️ OpenLayers</div>
                <div>📐 WGS84 → Web Mercator</div>
            </div>
        </div>
    );
};

export default OpenLayersMap;