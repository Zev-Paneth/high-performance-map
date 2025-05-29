// src/utils/testMapColoniesConnection.js
// סקריפט עזרה לבדיקת חיבור לשרת MapColonies

import {
    MAP_COLONIES_CONFIG,
    validateWGS84Config,
    testMapColoniesConnection,
    printSetupInstructions
} from '../../../services/mapColonies/config.js';

/**
 * בדיקה מקיפה של הגדרות MapColonies
 */
export const runFullDiagnostics = async () => {
    console.clear();
    console.log('🔍 מתחיל אבחון מלא של MapColonies WGS84...\n');

    // שלב 1: בדיקת הגדרות
    console.log('📋 שלב 1: בדיקת הגדרות');
    console.log('='.repeat(50));

    const validation = validateWGS84Config();

    if (validation.isValid) {
        console.log('✅ כל ההגדרות תקינות');
    } else {
        console.log('❌ נמצאו בעיות בהגדרות:');
        validation.errors.forEach(error => console.log(`   • ${error}`));
    }

    if (validation.warnings.length > 0) {
        console.log('⚠️  אזהרות:');
        validation.warnings.forEach(warning => console.log(`   • ${warning}`));
    }

    console.log('\n' + '=' .repeat(50));

    // שלב 2: בדיקת חיבור לשרת
    console.log('🌐 שלב 2: בדיקת חיבור לשרת');
    console.log('=' .repeat(50));

    try {
        const connectionResult = await testMapColoniesConnection();

        if (connectionResult.success) {
            console.log('✅ החיבור לשרת MapColonies הצליח');
            console.log(`   סטטוס: ${connectionResult.status} ${connectionResult.statusText}`);
        } else {
            console.log('❌ החיבור לשרת נכשל:');
            console.log(`   שגיאה: ${connectionResult.error}`);
        }
    } catch (error) {
        console.log('❌ שגיאה בבדיקת החיבור:', error.message);
    }

    console.log('\n' + '=' .repeat(50));

    // שלב 3: בדיקת שכבות רקע
    console.log('🗺️  שלב 3: בדיקת שכבות רקע');
    console.log('=' .repeat(50));

    const backgroundLayers = MAP_COLONIES_CONFIG.BACKGROUND_LAYERS;
    const layerCount = Object.keys(backgroundLayers).length;

    console.log(`📊 נמצאו ${layerCount} שכבות רקע מוגדרות:`);

    Object.entries(backgroundLayers).forEach(([key, layer]) => {
        console.log(`   • ${key}: ${layer.name}`);
        console.log(`     ProductType: ${layer.productType}`);
        console.log(`     ProductId: ${layer.productId}`);
    });

    if (layerCount === 0) {
        console.log('⚠️  לא הוגדרו שכבות רקע - עדכן את קובץ הקונפיגורציה');
    }

    console.log('\n' + '=' .repeat(50));

    // שלב 4: הצגת הוראות התקנה אם נדרש
    if (!validation.isValid || layerCount === 0) {
        console.log('📋 הוראות התקנה:');
        printSetupInstructions('hebrew');
    }

    // סיכום
    console.log('\n🎯 סיכום אבחון:');
    console.log('=' .repeat(50));

    const issues = validation.errors.length + validation.warnings.length;
    if (issues === 0 && layerCount > 0) {
        console.log('✅ המערכת מוכנה לשימוש!');
        console.log('   ניתן להפעיל את המפה עם תמיכה מלאה ב-MapColonies WGS84');
    } else {
        console.log('⚠️  נדרשים תיקונים לפני השימוש');
        console.log(`   ${validation.errors.length} שגיאות, ${validation.warnings.length} אזהרות`);
    }

    return {
        valid: validation.isValid && layerCount > 0,
        errors: validation.errors,
        warnings: validation.warnings,
        layerCount
    };
};

/**
 * בדיקה מהירה של שכבה ספציפית
 */
export const testSpecificLayer = async (productType, productId) => {
    console.log(`🔍 בודק שכבה: ${productType}/${productId}`);

    try {
        // ניבא את השירות
        const { mapColoniesWGS84Service } = await import('../../../services/mapColonies/mapColoniesWGS84Service.js');

        const layerData = await mapColoniesWGS84Service.queryLayer(productType, productId);

        console.log('✅ השכבה נמצאה בהצלחה:');
        console.log(`   שם: ${layerData.productName}`);
        console.log(`   תיאור: ${layerData.description}`);

        if (layerData.boundingBox) {
            const bbox = layerData.boundingBox;
            console.log(`   גבולות: [${bbox.west}, ${bbox.south}, ${bbox.east}, ${bbox.north}]`);
        }

        if (layerData.wmtsLinks) {
            const linkCount = Object.keys(layerData.wmtsLinks).length;
            console.log(`   קישורי WMTS: ${linkCount}`);
        }

        return { success: true, data: layerData };

    } catch (error) {
        console.log('❌ שגיאה בטעינת השכבה:', error.message);
        return { success: false, error: error.message };
    }
};

/**
 * בדיקת ביצועים
 */
export const testPerformance = async () => {
    console.log('⚡ בדיקת ביצועים...');

    const startTime = performance.now();

    try {
        // בדיקת זמן חיבור
        const connectionStart = performance.now();
        await testMapColoniesConnection();
        const connectionTime = performance.now() - connectionStart;

        console.log(`📊 זמן חיבור לשרת: ${connectionTime.toFixed(0)}ms`);

        if (connectionTime > 5000) {
            console.log('⚠️  החיבור איטי - בדוק את חיבור האינטרנט או ביצועי השרת');
        } else if (connectionTime > 2000) {
            console.log('⚠️  החיבור איטי במעט');
        } else {
            console.log('✅ זמן חיבור טוב');
        }

    } catch (error) {
        console.log('❌ שגיאה בבדיקת ביצועים:', error.message);
    }

    const totalTime = performance.now() - startTime;
    console.log(`⏱️  סך הכל: ${totalTime.toFixed(0)}ms`);
};

// פונקציה לבדיקה ממודול אחר
export const quickHealthCheck = () => {
    const validation = validateWGS84Config();
    const layerCount = Object.keys(MAP_COLONIES_CONFIG.BACKGROUND_LAYERS).length;

    return {
        healthy: validation.isValid && layerCount > 0,
        issues: validation.errors.length + validation.warnings.length,
        configured: MAP_COLONIES_CONFIG.AUTH_TOKEN !== 'your-jwt-token-here',
        layerCount
    };
};

// ייצוא ברירת מחדל
export default {
    runFullDiagnostics,
    testSpecificLayer,
    testPerformance,
    quickHealthCheck
};