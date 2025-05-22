import {useEffect, useMemo, useRef, useCallback} from 'react'; // הוספתי useCallback
import * as turf from '@turf/turf';
import {GeoJSONSource} from "maplibre-gl";

const PolygonsLayer = ({
                           map,
                           data = [],
                           layerId = 'high-performance-polygons',
                           sourceId = 'high-performance-polygons-source',
                           fillColor = '#0080ff',
                           fillOpacity = 0.5,
                           outlineColor = '#005cb2',
                           outlineWidth = 1,
                           visible = true,
                           simplifyTolerance = 0.001,
                           onClick, // הוספתי את הפרופ הזה - חדש
                           getPolygonProps = polygon => ({
                               fillColor: polygon.properties?.fillColor || fillColor,
                               fillOpacity: polygon.properties?.fillOpacity || fillOpacity,
                               outlineColor: polygon.properties?.outlineColor || outlineColor,
                               outlineWidth: polygon.properties?.outlineWidth || outlineWidth,
                           })
                       }) => {
    const layerCreatedRef = useRef(false);

    // עיבוד הנתונים עם useMemo כדי למנוע חישובים מיותרים
    const processedData = useMemo(() => {
        // פונקציית עזר לעיבוד הנתונים
        const processData = (inputData) => {
            if (!inputData) return { type: 'FeatureCollection', features: [] };

            // אם הנתונים כבר בפורמט GeoJSON אוסף תכונות, נשתמש בהם כמו שהם
            if (inputData.type === 'FeatureCollection') {
                return inputData;
            }

            // אם זה פיצ'ר בודד, נעטוף אותו באוסף
            if (inputData.type === 'Feature') {
                return {
                    type: 'FeatureCollection',
                    features: [inputData]
                };
            }

            // אחרת, נניח שזה מערך של אובייקטים וננסה להמיר אותם
            const features = Array.isArray(inputData) ? inputData.map(item => {
                // אם זה כבר פיצ'ר, נתקן את הקואורדינטות שלו
                if (item.type === 'Feature' && item.geometry) {
                    return {
                        ...item,
                        properties: {
                            ...item.properties,
                            ...getPolygonProps(item)
                        }
                    }
                }

                // אחרת, ננסה לייצר פיצ'ר
                let geometry;

                // אם יש שדה coordinates מובנה, נשתמש בו
                if (item.coordinates) {
                    // בדיקה האם מדובר במולטי-פוליגון (מערך של מערכים של מערכי קואורדינטות)
                    if (
                        Array.isArray(item.coordinates) &&
                        Array.isArray(item.coordinates[0]) &&
                        Array.isArray(item.coordinates[0][0]) &&
                        Array.isArray(item.coordinates[0][0][0])) {
                        geometry = {
                            type: 'MultiPolygon',
                            coordinates: item.coordinates
                        };
                    } else {
                        // אחרת זה פוליגון רגיל
                        geometry = {
                            type: 'Polygon',
                            coordinates: item.coordinates
                        };
                    }
                }
                // אם יש שדה geometry, נשתמש בו
                else if (item.geometry) {
                    geometry = item.geometry;
                }
                // אם יש שדה polygons, זה כנראה מולטי-פוליגון
                else if (item.polygons) {
                    geometry = {
                        type: 'MultiPolygon',
                        coordinates: item.polygons
                    };
                }
                // אם יש שדה bounds, נייצר מלבן
                else if (item.bounds) {
                    const [west, south, east, north] = item.bounds;
                    geometry = turf.bboxPolygon([west, south, east, north]).geometry;
                }
                // אם אין לנו מידע, נדלג
                else {
                    console.warn('Could not determine geometry for item:', item);
                    return null;
                }

                return {
                    type: 'Feature',
                    geometry,
                    properties: {
                        ...item.properties,
                        ...getPolygonProps(item)
                    }
                }
            }).filter(Boolean) : []; // סינון ערכים null

            return { type: 'FeatureCollection', features };
        };

        // פונקציית פישוט גיאומטריות לביצועים טובים יותר
        const simplifyData = (data, tolerance) => {
            if (!tolerance || tolerance <= 0) return data;

            return {
                type: 'FeatureCollection',
                features: data.features.map(feature => {
                    try {
                        // פישוט רק לפוליגונים או מולטי-פוליגונים
                        if (feature.geometry &&
                            (feature.geometry.type.includes('Polygon') ||
                                feature.geometry.type.includes('MultiPolygon'))) {
                            // ניסיון לפשט את הפוליגון
                            const simplified = turf.simplify(feature, {
                                tolerance,
                                highQuality: true,
                                mutate: false
                            });

                            // קצת הגנה נגד שגיאות
                            if (simplified && simplified.geometry) {
                                return {
                                    ...feature,
                                    geometry: simplified.geometry
                                };
                            }
                        }
                        return feature;
                    } catch (e) {
                        console.warn('Failed to simplify feature:', e);
                        return feature;
                    }
                })
            };
        };

        // הכנת הנתונים
        const geoJsonData = processData(data);

        // החלטה אם לפשט הנתונים בהתאם לרמת הזום הנוכחית
        const currentZoom = map?.getZoom() || 0;
        const useSimplification = currentZoom < 12; // פישוט רק ברמות זום נמוכות
        const tolerance = useSimplification ?
            simplifyTolerance * Math.pow(2, 12 - currentZoom) : 0;

        return useSimplification ?
            simplifyData(geoJsonData, tolerance) : geoJsonData;

    }, [data, map, simplifyTolerance, getPolygonProps]);

    // מאזיני אירועים כ-useCallback - חדש
    const handlePolygonClick = useCallback((e) => {
        if (!map || !onClick) return;

        const features = map.queryRenderedFeatures(e.point, { layers: [layerId] });
        if (features.length > 0) {
            onClick(features[0]);
        }
    }, [map, layerId, onClick]);

    const handleMouseEnter = useCallback(() => {
        if (map) map.getCanvas().style.cursor = 'pointer';
    }, [map]);

    const handleMouseLeave = useCallback(() => {
        if (map) map.getCanvas().style.cursor = '';
    }, [map]);

    // אפקט יחיד ומאוחד לניהול השכבה - עודכן לחלוטין
    useEffect(() => {
        if (!map) return;

        // פונקציית ניקוי
        const cleanup = () => {
            if (!map || !map.loaded()) return;

            // הסרת מאזיני אירועים
            if (map.getLayer(layerId)) {
                map.off('click', layerId, handlePolygonClick);
                map.off('mouseenter', layerId, handleMouseEnter);
                map.off('mouseleave', layerId, handleMouseLeave);
            }

            // הסרת שכבות
            if (map.getLayer(`${layerId}-outline`)) {
                map.removeLayer(`${layerId}-outline`);
            }

            if (map.getLayer(layerId)) {
                map.removeLayer(layerId);
            }

            // הסרת מקור
            if (map.getSource(sourceId)) {
                map.removeSource(sourceId);
            }

            layerCreatedRef.current = false;
        };

        try {
            // ניקוי שכבות קיימות אם יש
            if (layerCreatedRef.current) {
                cleanup();
            }

            // יצירת מקור נתונים או עדכון קיים
            if (!map.getSource(sourceId)) {
                map.addSource(sourceId, {
                    type: 'geojson',
                    data: processedData
                });
            } else {
                const source = map.getSource(sourceId);
                if (source && source instanceof GeoJSONSource) {
                    source.setData(processedData);
                }
            }

            // יצירת שכבות אם עוד לא נוצרו
            if (!layerCreatedRef.current) {
                // שכבת מילוי (fill)
                map.addLayer({
                    id: layerId,
                    type: 'fill',
                    source: sourceId,
                    paint: {
                        'fill-color': ['get', 'fillColor'],
                        'fill-opacity': ['get', 'fillOpacity']
                    }
                });

                // שכבת קווי מתאר (outline)
                map.addLayer({
                    id: `${layerId}-outline`,
                    type: 'line',
                    source: sourceId,
                    paint: {
                        'line-color': ['get', 'outlineColor'],
                        'line-width': ['get', 'outlineWidth']
                    }
                });

                // הוספת אירועי לחיצה ומעבר עכבר
                if (onClick) {
                    map.on('click', layerId, handlePolygonClick);
                }

                map.on('mouseenter', layerId, handleMouseEnter);
                map.on('mouseleave', layerId, handleMouseLeave);

                layerCreatedRef.current = true;
            }

            // עדכון נראות השכבות
            if (map.getLayer(layerId)) {
                map.setLayoutProperty(layerId, 'visibility', visible ? 'visible' : 'none');
            }

            if (map.getLayer(`${layerId}-outline`)) {
                map.setLayoutProperty(`${layerId}-outline`, 'visibility', visible ? 'visible' : 'none');
            }

            return cleanup;

        } catch (err) {
            console.error('Error managing polygon layers:', err);
            return cleanup;
        }

    }, [
        map,
        layerId,
        sourceId,
        processedData,
        visible,
        onClick,
        handlePolygonClick,
        handleMouseEnter,
        handleMouseLeave
    ]);

    return null;
};

export default PolygonsLayer;