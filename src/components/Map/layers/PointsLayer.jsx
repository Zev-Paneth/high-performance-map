
import React, { useEffect, useRef, useCallback } from 'react';
import { GeoJSONSource } from 'maplibre-gl';

const PointsLayerFixed = ({
                              map,
                              data = [],
                              layerId = 'high-performance-points',
                              sourceId = 'high-performance-points-source',
                              pointColor = '#ff0000',
                              pointRadius = 5,
                              visible = true,
                              enableClustering = true, // הוספתי פרמטר זה
                              getPointProps = point => ({
                                  color: point.properties?.color || pointColor,
                                  radius: point.properties?.radius || pointRadius,
                              }),
                              onClick
                          }) => {
    const layerCreatedRef = useRef(false);

    // מאזיני אירועים
    const handleClusterClick = useCallback((e) => {
        if (!map || !enableClustering) return;

        const features = map.queryRenderedFeatures(e.point, { layers: [`${layerId}-clusters`] });
        if (features.length > 0 && features[0].properties.cluster_id) {
            const clusterId = features[0].properties.cluster_id;
            const source = map.getSource(sourceId);
            if (source && typeof source.getClusterExpansionZoom === 'function') {
                source.getClusterExpansionZoom(clusterId, (err, zoom) => {
                    if (err) return;
                    map.easeTo({
                        center: features[0].geometry.coordinates,
                        zoom: zoom
                    });
                });
            }
        }
    }, [map, layerId, sourceId, enableClustering]);

    const handlePointClick = useCallback((e) => {
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

    useEffect(() => {
        if (!map) return;

        const cleanup = () => {
            if (!map || !map.loaded()) return;

            try {
                // הסרת מאזיני אירועים
                if (map.getLayer(`${layerId}-clusters`)) {
                    map.off('click', `${layerId}-clusters`, handleClusterClick);
                    map.off('mouseenter', `${layerId}-clusters`, handleMouseEnter);
                    map.off('mouseleave', `${layerId}-clusters`, handleMouseLeave);
                }

                if (map.getLayer(`${layerId}-cluster-count`)) {
                    map.off('mouseenter', `${layerId}-cluster-count`, handleMouseEnter);
                    map.off('mouseleave', `${layerId}-cluster-count`, handleMouseLeave);
                }

                if (map.getLayer(layerId)) {
                    map.off('click', layerId, handlePointClick);
                    map.off('mouseenter', layerId, handleMouseEnter);
                    map.off('mouseleave', layerId, handleMouseLeave);
                }

                // הסרת שכבות
                if (map.getLayer(`${layerId}-cluster-count`)) {
                    map.removeLayer(`${layerId}-cluster-count`);
                }
                if (map.getLayer(`${layerId}-clusters`)) {
                    map.removeLayer(`${layerId}-clusters`);
                }
                if (map.getLayer(layerId)) {
                    map.removeLayer(layerId);
                }

                // הסרת מקור
                if (map.getSource(sourceId)) {
                    map.removeSource(sourceId);
                }
            } catch (error) {
                console.error('Error in cleanup:', error);
            }

            layerCreatedRef.current = false;
        };

        try {
            const geoJsonData = Array.isArray(data) ? {
                type: 'FeatureCollection',
                features: data.map(point => {
                    if (point.type === 'Feature' && point.geometry) {
                        return {
                            ...point,
                            properties: {
                                ...point.properties,
                                ...getPointProps(point)
                            }
                        };
                    }

                    return {
                        type: 'Feature',
                        geometry: {
                            type: 'Point',
                            coordinates: Array.isArray(point.coordinates)
                                ? point.coordinates
                                : [point.lng || point.lon || 0, point.lat || 0]
                        },
                        properties: {
                            ...point.properties,
                            ...getPointProps(point)
                        }
                    };
                })
            } : data;

            if (layerCreatedRef.current) {
                cleanup();
            }

            // יצירת מקור נתונים
            const sourceConfig = {
                type: 'geojson',
                data: geoJsonData
            };

            // הוספת קלסטרינג אם מופעל
            if (enableClustering) {
                sourceConfig.cluster = true;
                sourceConfig.clusterMaxZoom = 14;
                sourceConfig.clusterRadius = 50;
            }

            if (!map.getSource(sourceId)) {
                map.addSource(sourceId, sourceConfig);
            } else {
                const source = map.getSource(sourceId);
                if (source && source instanceof GeoJSONSource) {
                    source.setData(geoJsonData);
                }
            }

            if (!layerCreatedRef.current) {
                // שכבת קלאסטרים - רק אם מופעל
                if (enableClustering) {
                    map.addLayer({
                        id: `${layerId}-clusters`,
                        type: 'circle',
                        source: sourceId,
                        filter: ['has', 'point_count'],
                        paint: {
                            'circle-color': [
                                'step',
                                ['get', 'point_count'],
                                '#51bbd6',
                                100, '#f1f075',
                                750, '#f28cb1'
                            ],
                            'circle-radius': [
                                'step',
                                ['get', 'point_count'],
                                20,
                                100, 30,
                                750, 40
                            ]
                        }
                    });

                    // שכבת מספרי קלאסטר - פשוטה יותר ללא פונטים מותאמים
                    map.addLayer({
                        id: `${layerId}-cluster-count`,
                        type: 'symbol',
                        source: sourceId,
                        filter: ['has', 'point_count'],
                        layout: {
                            'text-field': ['get', 'point_count_abbreviated'], // שימוש ב-expression במקום string
                            'text-size': 12,
                            'text-allow-overlap': true
                        },
                        paint: {
                            'text-color': '#ffffff'
                        }
                    });

                    // מאזיני אירועים לקלסטרים
                    map.on('click', `${layerId}-clusters`, handleClusterClick);
                    map.on('mouseenter', `${layerId}-clusters`, handleMouseEnter);
                    map.on('mouseleave', `${layerId}-clusters`, handleMouseLeave);
                    map.on('mouseenter', `${layerId}-cluster-count`, handleMouseEnter);
                    map.on('mouseleave', `${layerId}-cluster-count`, handleMouseLeave);
                }

                // שכבת נקודות בודדות
                const pointFilter = enableClustering ? ['!', ['has', 'point_count']] : true;

                map.addLayer({
                    id: layerId,
                    type: 'circle',
                    source: sourceId,
                    filter: pointFilter,
                    paint: {
                        'circle-color': ['get', 'color'],
                        'circle-radius': ['get', 'radius'],
                        'circle-stroke-width': 1,
                        'circle-stroke-color': '#fff'
                    }
                });

                // מאזיני אירועים לנקודות
                if (onClick) {
                    map.on('click', layerId, handlePointClick);
                }
                map.on('mouseenter', layerId, handleMouseEnter);
                map.on('mouseleave', layerId, handleMouseLeave);

                layerCreatedRef.current = true;
            }

            // עדכון נראות השכבות
            const visibility = visible ? 'visible' : 'none';

            if (map.getLayer(layerId)) {
                map.setLayoutProperty(layerId, 'visibility', visibility);
            }

            if (enableClustering) {
                if (map.getLayer(`${layerId}-clusters`)) {
                    map.setLayoutProperty(`${layerId}-clusters`, 'visibility', visibility);
                }
                if (map.getLayer(`${layerId}-cluster-count`)) {
                    map.setLayoutProperty(`${layerId}-cluster-count`, 'visibility', visibility);
                }
            }

            return cleanup;

        } catch (error) {
            console.error('PointsLayer error:', error);
            return cleanup;
        }

    }, [map, layerId, sourceId, data, visible, pointColor, pointRadius, enableClustering, getPointProps, onClick, handleClusterClick, handlePointClick, handleMouseEnter, handleMouseLeave]);

    return null;
};

export default PointsLayerFixed;