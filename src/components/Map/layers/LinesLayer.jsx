import React, {useEffect, useRef, useMemo, useCallback} from 'react'; // הוספתי useCallback
import * as turf from '@turf/turf';
import {GeoJSONSource} from "maplibre-gl"; // הוספתי import

const LinesLayer = ({
                        map,
                        data = [],
                        layerId = 'high-performance-lines',
                        sourceId = 'high-performance-lines-source',
                        lineColor = '#0066ff',
                        lineWidth = 2,
                        lineDashArray = [0], // 0 משמעו קו רציף
                        visible = true,
                        simplifyTolerance = 0.001,
                        onClick, // הוספתי את הפרופ הזה - חדש
                        getLineProps = line => ({
                            lineColor: line.properties?.lineColor || lineColor,
                            lineWidth: line.properties?.lineWidth || lineWidth,
                            lineDashArray: line.properties?.lineDashArray || lineDashArray
                        })
                    }) => {
    const layerCreatedRef = useRef(false);

    // עיבוד הנתונים עם useMemo כדי למנוע חישובים מיותרים
    const processedData = useMemo(() => {
        // פונקציית עזר לעיבוד הנתונים
        const processData = (inputData) => {
            if (!inputData) return {type: 'FeatureCollection', features: []};

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
                            ...getLineProps(item)
                        }
                    }
                }

                // אחרת, ננסה לייצר פיצ'ר
                let geometry;

                // אם יש שדה coordinates מובנה, נשתמש בו
                if (item.coordinates) {
                    // תיקון: MultiLineString במקום MultiLine - עודכן
                    geometry = {
                        type: 'MultiLineString',
                        coordinates: item.coordinates
                    };
                }
                // אם יש שדה geometry, נשתמש בו
                else if (item.geometry) {
                    geometry = item.geometry;
                }
                // אם יש שדה path או points, ננסה להשתמש בהם
                else if (item.path || item.points) {
                    const points = item.path || item.points;
                    if (Array.isArray(points)) {
                        geometry = {
                            type: 'LineString',
                            coordinates: points.map(p =>
                                Array.isArray(p) ? p : [p.lng || p.lon || p.x, p.lat || p.y]
                            )
                        };
                    }
                }
                // אם לא הצלחנו לחלץ גיאומטריה, נדלג על הפריט
                else {
                    console.warn('Could not determine geometry for line item:', item);
                    return null;
                }

                if (geometry && geometry.coordinates) {
                    if (geometry.type === 'LineString') {
                        geometry.coordinates = geometry.coordinates.map((coord) => {
                            if (Array.isArray(coord) && coord.length === 2) {
                                const [firstPoint, secondPoint] = coord;

                                if (
                                    firstPoint >= -180 &&
                                    firstPoint <= 180 &&
                                    secondPoint >= -90 &&
                                    secondPoint <= 90
                                ) {
                                    return coord;
                                } else if (
                                    secondPoint >= -180 &&
                                    secondPoint <= 180 &&
                                    firstPoint >= -90 &&
                                    firstPoint <= 90
                                ) {
                                    return [secondPoint, firstPoint];
                                }
                            }
                            return coord;
                        });
                    }
                }

                return {
                    type: 'Feature',
                    geometry,
                    properties: {
                        ...item.properties, // שמירה על תכונות קיימות
                        ...getLineProps(item)
                    }
                };
            }).filter(Boolean) : []; // סינון ערכים null

            return {type: 'FeatureCollection', features};
        };

        // פונקציית פישוט גיאומטריות לביצועים טובים יותר
        const simplifyData = (data, tolerance) => {
            if (!tolerance || tolerance <= 0) return data;

            return {
                type: 'FeatureCollection',
                features: data.features.map((feature) => {
                    try {
                        // פישוט רק לקווים
                        if (feature.geometry && feature.geometry.type.includes('Line')) {
                            const simplified = turf.simplify(feature, {
                                tolerance,
                                highQuality: true,
                                mutate: false
                            });

                            return {
                                ...feature,
                                geometry: simplified.geometry
                            };
                        }
                        return feature;
                    } catch (e) {
                        console.warn('Failed to simplify feature:', feature, e);
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

    }, [data, map, simplifyTolerance, getLineProps]); // הוספתי getLineProps לתלויות

    // מאזיני אירועים כ-useCallback - חדש
    const handleLineClick = useCallback((e) => {
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

    // פונקציית עדכון פישוט - חדש
    const updateSimplification = useCallback(() => {
        if (!map || !map.loaded() || !layerCreatedRef.current) return;

        const zoom = map.getZoom();
        const shouldSimplify = zoom < 12;
        const newTolerance = shouldSimplify ?
            simplifyTolerance * Math.pow(2, 12 - zoom) : 0;

        if (shouldSimplify) {
            // שימוש ב-processedData במקום geoJsonData לא מוגדר
            const simplifiedData = {
                type: 'FeatureCollection',
                features: processedData.features.map((feature) => {
                    try {
                        if (feature.geometry && feature.geometry.type.includes('Line')) {
                            const simplified = turf.simplify(feature, {
                                tolerance: newTolerance,
                                highQuality: true,
                                mutate: false
                            });
                            return {
                                ...feature,
                                geometry: simplified.geometry
                            };
                        }
                        return feature;
                    } catch (e) {
                        console.warn('Failed to simplify feature:', feature, e);
                        return feature;
                    }
                })
            };

            const source = map.getSource(sourceId);
            if (source && source instanceof GeoJSONSource) {
                source.setData(simplifiedData);
            }
        }
    }, [map, processedData, sourceId, simplifyTolerance]);

    // אפקט מאוחד לניהול השכבה - עודכן לחלוטין
    useEffect(() => {
        if (!map) return;

        // פונקציית ניקוי
        const cleanup = () => {
            if (!map || !map.loaded()) return;

            // הסרת מאזיני אירועים
            if (map.getLayer(layerId)) {
                map.off('click', layerId, handleLineClick);
                map.off('mouseenter', layerId, handleMouseEnter);
                map.off('mouseleave', layerId, handleMouseLeave);
            }

            // הסרת מאזין זום
            map.off('zoomend', updateSimplification);

            // הסרת שכבה
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

            // יצירת שכבה אם עוד לא נוצרה
            if (!layerCreatedRef.current) {
                // הוספת תמיכה ב-lineDashArray - עודכן
                map.addLayer({
                    id: layerId,
                    type: 'line',
                    source: sourceId,
                    paint: {
                        'line-color': ['get', 'lineColor'],
                        'line-width': ['get', 'lineWidth'],
                    },
                    layout: {
                        'line-cap': 'round',
                        'line-join': 'round'
                    }
                });

                // הוספת אירועי לחיצה ומעבר עכבר
                if (onClick) {
                    map.on('click', layerId, handleLineClick);
                }

                map.on('mouseenter', layerId, handleMouseEnter);
                map.on('mouseleave', layerId, handleMouseLeave);

                // הוספת מאזין זום
                map.on('zoomend', updateSimplification);

                layerCreatedRef.current = true;
            }

            // עדכון נראות השכבה
            if (map.getLayer(layerId)) {
                map.setLayoutProperty(layerId, 'visibility', visible ? 'visible' : 'none');
            }

            return cleanup;

        } catch (err) {
            console.error('Error managing lines layer:', err);
            return cleanup;
        }

    }, [
        map,
        layerId,
        sourceId,
        processedData,
        visible,
        onClick,
        handleLineClick,
        handleMouseEnter,
        handleMouseLeave,
        updateSimplification
    ]);

    return null;
};

export default LinesLayer;