// src/components/Map/hooks/useMapColonies.js
// Hook לניהול שכבות MapColonies ב-React

import { useState, useCallback, useMemo } from 'react';
import { mapColoniesService } from '../../../services/mapColonies/mapColoniesService.js';
import { MAP_COLONIES_CONFIG } from '../../../services/mapColonies/config.js';

/**
 * Hook לניהול שכבות MapColonies
 */
export const useMapColonies = () => {
    const [layers, setLayers] = useState(new Map());
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [activeLayerId, setActiveLayerId] = useState(null);

    /**
     * טעינת שכבה חדשה
     */
    const loadLayer = useCallback(async (layerConfig) => {
        const { productType, productId, layerKey, name } = layerConfig;
        const layerId = layerKey || `${productType}_${productId}`;

        try {
            setLoading(true);
            setError(null);

            console.log('Loading MapColonies layer:', layerConfig);

            // בניית הסגנון עבור השכבה
            const result = await mapColoniesService.buildMapLibreStyle(
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
                    loadedAt: new Date().toISOString()
                });
                return newLayers;
            });

            console.log('Layer loaded successfully:', layerId);
            return { layerId, ...result };

        } catch (err) {
            console.error('Error loading layer:', err);
            setError(`Failed to load layer ${layerId}: ${err.message}`);
            throw err;
        } finally {
            setLoading(false);
        }
    }, []);

    /**
     * טעינת כל שכבות הרקע מההגדרות
     */
    const loadBackgroundLayers = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);

            const backgroundLayers = MAP_COLONIES_CONFIG.BACKGROUND_LAYERS;
            const loadPromises = Object.entries(backgroundLayers).map(([key, config]) =>
                loadLayer({ ...config, layerKey: key })
                    .catch(err => {
                        console.warn(`Failed to load background layer ${key}:`, err);
                        return null; // לא נכשיל את כל הטעינה בגלל שכבה אחת
                    })
            );

            const results = await Promise.all(loadPromises);
            const successCount = results.filter(result => result !== null).length;

            console.log(`Loaded ${successCount}/${Object.keys(backgroundLayers).length} background layers`);

            // הגדרת השכבה הראשונה כפעילה
            if (successCount > 0 && !activeLayerId) {
                const firstLayerKey = Object.keys(backgroundLayers)[0];
                setActiveLayerId(firstLayerKey);
            }

            return results.filter(Boolean);

        } catch (err) {
            console.error('Error loading background layers:', err);
            setError(`Failed to load background layers: ${err.message}`);
            throw err;
        } finally {
            setLoading(false);
        }
    }, [loadLayer, activeLayerId]);

    /**
     * הסרת שכבה
     */
    const removeLayer = useCallback((layerId) => {
        setLayers(prevLayers => {
            const newLayers = new Map(prevLayers);
            newLayers.delete(layerId);
            return newLayers;
        });

        // אם זו השכבה הפעילה, נבחר שכבה אחרת
        if (activeLayerId === layerId) {
            const remainingLayers = [...layers.keys()].filter(id => id !== layerId);
            setActiveLayerId(remainingLayers.length > 0 ? remainingLayers[0] : null);
        }

        console.log('Layer removed:', layerId);
    }, [activeLayerId, layers]);

    /**
     * החלפת השכבה הפעילה
     */
    const setActiveLayer = useCallback((layerId) => {
        if (layers.has(layerId)) {
            setActiveLayerId(layerId);
            console.log('Active layer changed to:', layerId);
        } else {
            console.warn('Cannot set active layer - layer not found:', layerId);
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
        errorMessage: error
    }), [layers.size, activeLayerId, loading, error]);

    /**
     * ניקוי כל הנתונים
     */
    const clearAll = useCallback(() => {
        setLayers(new Map());
        setActiveLayerId(null);
        setError(null);
        mapColoniesService.clearCache();
        console.log('All MapColonies data cleared');
    }, []);

    /**
     * רענון שכבה (טעינה מחדש)
     */
    const refreshLayer = useCallback(async (layerId) => {
        const layer = layers.get(layerId);
        if (!layer) {
            throw new Error(`Layer ${layerId} not found`);
        }

        // הסרת השכבה מהקאש ולטעינה מחדש
        const cacheKey = `${layer.config.productType}_${layer.config.productId}`;
        mapColoniesService.cache.delete(cacheKey);

        await loadLayer(layer.config);
        console.log('Layer refreshed:', layerId);
    }, [layers, loadLayer]);

    return {
        // State
        layers: layersList,
        activeLayer,
        activeMapStyle,
        activeLayerId,
        loading,
        error,
        stats,

        // Actions
        loadLayer,
        loadBackgroundLayers,
        removeLayer,
        setActiveLayer,
        refreshLayer,
        clearAll
    };
};

/**
 * Hook פשוט יותר רק לשכבות רקע
 */
export const useMapColoniesBackground = () => {
    const {
        activeMapStyle,
        activeLayerId,
        setActiveLayer,
        loadBackgroundLayers,
        loading,
        error,
        layers
    } = useMapColonies();

    // רשימת שכבות רקע בלבד
    const backgroundLayers = useMemo(() => {
        return layers.filter(layer =>
            Object.keys(MAP_COLONIES_CONFIG.BACKGROUND_LAYERS).includes(layer.id)
        );
    }, [layers]);

    return {
        mapStyle: activeMapStyle,
        activeLayerId,
        backgroundLayers,
        setActiveLayer,
        loadBackgroundLayers,
        loading,
        error
    };
};