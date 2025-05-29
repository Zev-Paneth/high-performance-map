// src/components/Map/hooks/useMapColoniesWGS84.js
// Hook מעודכן לשימוש עם MapColonies WGS84 ו-OpenLayers

import { useState, useCallback, useMemo } from 'react';
import { mapColoniesWGS84Service } from '../../../services/mapColonies/mapColoniesWGS84Service.js';
import { MAP_COLONIES_CONFIG } from '../../../services/mapColonies/config.js';

/**
 * Hook לניהול שכבות MapColonies WGS84
 */
export const useMapColoniesWGS84 = () => {
    const [layers, setLayers] = useState(new Map());
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [activeLayerId, setActiveLayerId] = useState(null);

    /**
     * טעינת שכבה WGS84 חדשה
     */
    const loadWGS84Layer = useCallback(async (layerConfig) => {
        const { productType, productId, layerKey, name } = layerConfig;
        const layerId = layerKey || `${productType}_${productId}`;

        try {
            setLoading(true);
            setError(null);

            console.log('Loading MapColonies WGS84 layer:', layerConfig);

            // בניית הסגנון עבור השכבה WGS84
            const result = await mapColoniesWGS84Service.buildMapLibreStyleForWGS84(
                productType,
                productId,
                name
            );

            // שמירת השכבה במצב
            setLayers(prevLayers => {
                const newLayers = new Map(prevLayers);
                newLayers.set(layerId, {
                    id: layerId,
                    config: layerConfig,
                    style: result.style,
                    boundingBox: result.boundingBox,
                    metadata: result.metadata,
                    openLayersConfig: result.openLayersConfig,
                    projection: 'EPSG:4326',
                    loadedAt: new Date().toISOString()
                });
                return newLayers;
            });

            console.log('WGS84 Layer loaded successfully:', layerId);
            return { layerId, ...result };

        } catch (err) {
            console.error('Error loading WGS84 layer:', err);
            setError(`Failed to load WGS84 layer ${layerId}: ${err.message}`);
            throw err;
        } finally {
            setLoading(false);
        }
    }, []);

    /**
     * טעינת כל שכבות הרקע WGS84 מההגדרות
     */
    const loadWGS84BackgroundLayers = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);

            console.log('Loading MapColonies WGS84 background layers...');

            const backgroundLayers = MAP_COLONIES_CONFIG.BACKGROUND_LAYERS;
            const loadPromises = Object.entries(backgroundLayers).map(([key, config]) =>
                loadWGS84Layer({ ...config, layerKey: key })
                    .catch(err => {
                        console.warn(`Failed to load WGS84 background layer ${key}:`, err);
                        return null;
                    })
            );

            const results = await Promise.all(loadPromises);
            const successCount = results.filter(result => result !== null).length;

            console.log(`Loaded ${successCount}/${Object.keys(backgroundLayers).length} WGS84 background layers`);

            // הגדרת השכבה הראשונה כפעילה
            if (successCount > 0 && !activeLayerId) {
                const firstLayerKey = Object.keys(backgroundLayers)[0];
                setActiveLayerId(firstLayerKey);
            }

            return results.filter(Boolean);

        } catch (err) {
            console.error('Error loading WGS84 background layers:', err);
            setError(`Failed to load WGS84 background layers: ${err.message}`);
            throw err;
        } finally {
            setLoading(false);
        }
    }, [loadWGS84Layer, activeLayerId]);

    /**
     * קבלת שכבות זמינות מהשרת
     */
    const discoverWGS84Layers = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);

            console.log('Discovering available WGS84 layers...');
            const availableLayers = await mapColoniesWGS84Service.getAvailableWGS84Layers();

            console.log(`Discovered ${availableLayers.length} WGS84 layers`);
            return availableLayers;

        } catch (err) {
            console.error('Error discovering WGS84 layers:', err);
            setError(`Failed to discover WGS84 layers: ${err.message}`);
            return [];
        } finally {
            setLoading(false);
        }
    }, []);

    /**
     * הסרת שכבה
     */
    const removeLayer = useCallback((layerId) => {
        setLayers(prevLayers => {
            const newLayers = new Map(prevLayers);
            newLayers.delete(layerId);
            return newLayers;
        });

        if (activeLayerId === layerId) {
            const remainingLayers = [...layers.keys()].filter(id => id !== layerId);
            setActiveLayerId(remainingLayers.length > 0 ? remainingLayers[0] : null);
        }

        console.log('WGS84 Layer removed:', layerId);
    }, [activeLayerId, layers]);

    /**
     * החלפת השכבה הפעילה
     */
    const setActiveLayer = useCallback((layerId) => {
        if (layers.has(layerId)) {
            setActiveLayerId(layerId);
            console.log('Active WGS84 layer changed to:', layerId);
        } else {
            console.warn('Cannot set active WGS84 layer - layer not found:', layerId);
        }
    }, [layers]);

    /**
     * קבלת השכבה הפעילה
     */
    const activeLayer = useMemo(() => {
        return activeLayerId ? layers.get(activeLayerId) : null;
    }, [activeLayerId, layers]);

    /**
     * קבלת סגנון MapLibre של השכבה הפעילה
     */
    const activeMapStyle = useMemo(() => {
        return activeLayer?.style || null;
    }, [activeLayer]);

    /**
     * קבלת הגדרות OpenLayers של השכבה הפעילה
     */
    const activeOpenLayersConfig = useMemo(() => {
        return activeLayer?.openLayersConfig || null;
    }, [activeLayer]);

    /**
     * רשימת השכבות כמערך
     */
    const layersList = useMemo(() => {
        return Array.from(layers.values());
    }, [layers]);

    /**
     * מידע סטטיסטי
     */
    const stats = useMemo(() => ({
        totalLayers: layers.size,
        activeLayerId,
        isLoading: loading,
        hasError: !!error,
        errorMessage: error,
        projection: 'EPSG:4326',
        serviceType: 'MapColonies WGS84'
    }), [layers.size, activeLayerId, loading, error]);

    /**
     * בדיקת תקינות הגדרות
     */
    const validateConfiguration = useCallback(() => {
        return mapColoniesWGS84Service.validateWGS84Config();
    }, []);

    /**
     * קבלת bounding box של השכבה הפעילה ב-WGS84
     */
    const getActiveLayerBounds = useCallback(() => {
        if (!activeLayer || !activeLayer.boundingBox) {
            // ברירת מחדל - גבולות ישראל
            return {
                west: 34.2,
                south: 29.5,
                east: 35.9,
                north: 33.4,
                projection: 'EPSG:4326'
            };
        }

        return activeLayer.boundingBox;
    }, [activeLayer]);

    /**
     * ניקוי כל הנתונים
     */
    const clearAll = useCallback(() => {
        setLayers(new Map());
        setActiveLayerId(null);
        setError(null);
        mapColoniesWGS84Service.clearCache();
        console.log('All MapColonies WGS84 data cleared');
    }, []);

    /**
     * רענון שכבה
     */
    const refreshLayer = useCallback(async (layerId) => {
        const layer = layers.get(layerId);
        if (!layer) {
            throw new Error(`WGS84 Layer ${layerId} not found`);
        }

        const cacheKey = `${layer.config.productType}_${layer.config.productId}`;
        mapColoniesWGS84Service.cache.delete(cacheKey);

        await loadWGS84Layer(layer.config);
        console.log('WGS84 Layer refreshed:', layerId);
    }, [layers, loadWGS84Layer]);

    return {
        // State
        layers: layersList,
        activeLayer,
        activeMapStyle,
        activeOpenLayersConfig,
        activeLayerId,
        loading,
        error,
        stats,

        // Actions
        loadWGS84Layer,
        loadWGS84BackgroundLayers,
        discoverWGS84Layers,
        removeLayer,
        setActiveLayer,
        refreshLayer,
        clearAll,

        // Utilities
        validateConfiguration,
        getActiveLayerBounds
    };
};

/**
 * Hook פשוט יותר רק לשכבות רקע WGS84
 */
export const useMapColoniesWGS84Background = () => {
    const {
        activeMapStyle,
        activeOpenLayersConfig,
        activeLayerId,
        setActiveLayer,
        loadWGS84BackgroundLayers,
        loading,
        error,
        layers,
        getActiveLayerBounds
    } = useMapColoniesWGS84();

    // רשימת שכבות רקע בלבד
    const backgroundLayers = useMemo(() => {
        return layers.filter(layer =>
            Object.keys(MAP_COLONIES_CONFIG.BACKGROUND_LAYERS).includes(layer.id)
        );
    }, [layers]);

    return {
        mapStyle: activeMapStyle,
        openLayersConfig: activeOpenLayersConfig,
        activeLayerId,
        backgroundLayers,
        setActiveLayer,
        loadBackgroundLayers: loadWGS84BackgroundLayers,
        getLayerBounds: getActiveLayerBounds,
        loading,
        error
    };
};