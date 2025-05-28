# 🌍 הדרכה: אינטגרציה של MapColonies

## שלב 1: עדכון קבצי ההגדרות

### 1.1 עדכון config.js
עדכן את הקובץ `src/services/mapColonies/config.js` עם הנתונים האמיתיים שלך:

```javascript
export const MAP_COLONIES_CONFIG = {
    // החלף עם הכתובות האמיתיות שלך
    CATALOG_SERVICE_URL: 'https://your-real-mapcolonies-catalog-server.com',
    SERVING_SERVICE_URL: 'https://your-real-mapcolonies-serving-server.com',
    
    // החלף עם הטוקן האמיתי שלך
    AUTH_TOKEN: 'your-real-jwt-token-here',
    
    // עדכן את שכבות הרקע לפי מה שיש לך בקטלוג
    BACKGROUND_LAYERS: {
        orthophoto_best: {
            name: 'אורתופוטו מיטבי',
            productType: 'OrthophotoBest', // החלף עם הערך האמיתי
            productId: 'ORTHOPHOTO_MOSAIC_BASE', // החלף עם הערך האמיתי
            description: 'שכבת רקע אורthoto באיכות מיטבית',
            icon: '🛰️'
        }
        // הוסף עוד שכבות לפי הצורך...
    }
};
```

## שלב 2: יצירת מבנה הקבצים

צור את הקבצים הבאים במבנה זה:

```
src/
├── services/
│   └── mapColonies/
│       ├── config.js
│       └── mapColoniesService.js
└── components/
    └── Map/
        ├── MapColoniesLayerSelector.jsx
        └── hooks/
            └── useMapColonies.js
```

## שלב 3: עדכון App.jsx

עדכן את `src/App.jsx` להשתמש ברכיב החדש:

```javascript
import React from 'react';
import './App.css';
import MapExampleWithMapColonies from './components/MapExample'; // הרכיב המעודכן
import 'maplibre-gl/dist/maplibre-gl.css';

function App() {
    return (
        <div className="App" style={{ width: '100%', height: '100%'}}>
            <MapExampleWithMapColonies />
        </div>
    );
}

export default App;
```

## שלב 4: איך לגלות את הנתונים הנדרשים

### 4.1 גלה את ה-URLs

1. **עבור לקטלוג שלכם** - תחפש דברים כמו:
   - `catalog-service` או `csw`
   - `serving-service` או `wmts`

2. **בדוק ב-network tab** של הדפדפן כשאתה פותח מפה קיימת

### 4.2 גלה את שכבות הרקע

1. **פתח את אפליקציית הקטלוג של MapColonies**
2. **חפש שכבות רקע** - לרוב יהיו עם שמות כמו:
   - `OrthophotoBest`
   - `Orthophoto`
   - `Topographic`
   - `BaseMap`

3. **העתק את הפרטים**:
   - `productType` - הסוג (למשל: "OrthophotoBest")
   - `productId` - המזהה (למשל: "ORTHOPHOTO_BASE_2023")

### 4.3 קבלת טוקן אימות

1. **צור קשר עם מנהל המערכת** שלכם
2. **בקש JWT token** עם הרשאות לקטלוג ולהגשה
3. **בדוק** שהטוקן עובד עם בקשת test פשוטה

## שלב 5: בדיקה ופתרון בעיות

### 5.1 בדיקה בסיסית

1. **פתח את הקונסולה** (F12)
2. **חפש הודעות** שמתחילות ב-"MapColonies"
3. **בדוק שגיאות רשת** בטאב Network

### 5.2 שגיאות נפוצות ופתרונות

#### שגיאת CORS
```
Access to fetch at 'https://...' from origin 'http://localhost:3000' has been blocked by CORS policy
```
**פתרון**: בקש מהמנהל להוסיף `http://localhost:3000` ל-CORS settings

#### שגיאת אימות
```
HTTP 401: Unauthorized
```
**פתרון**: בדוק שהטוקן נכון ועדיין תקף

#### שכבה לא נמצאת
```
Layer not found in capabilities
```
**פתרון**: בדוק ש-`productType` ו-`productId` נכונים בקטלוג

### 5.3 דיבוג מתקדם

הוסף דיבוג בקובץ config.js:
```javascript
// הוספת דיבוג
console.log('MapColonies Config:', MAP_COLONIES_CONFIG);

// בדיקת קישוריות
fetch(MAP_COLONIES_CONFIG.CATALOG_SERVICE_URL + '/csw')
    .then(res => console.log('Catalog accessible:', res.ok))
    .catch(err => console.error('Catalog not accessible:', err));
```

## שלב 6: התאמות מתקדמות

### 6.1 הוספת שכבות נוספות

```javascript
// בקובץ config.js
BACKGROUND_LAYERS: {
    // השכבות הקיימות...
    
    my_custom_layer: {
        name: 'השכבה שלי',
        productType: 'CustomType',
        productId: 'CUSTOM_LAYER_ID',
        description: 'תיאור השכבה',
        icon: '🗺️'
    }
}
```

### 6.2 שינוי הגדרות WMTS

```javascript
// בקובץ config.js
WMTS_CONFIG: {
    tileMatrixSet: 'InspireCRS84Quad', // או תבנית אחרת
    format: 'image/jpeg', // או פורמט אחר
    style: 'default',
    tileSize: 512, // או גודל אחר
    maxZoom: 20
}
```

## שלב 7: פריסה לייצור

### 7.1 משתני סביבה

צור קובץ `.env`:
```
REACT_APP_MAPCOLONIES_CATALOG_URL=https://your-production-catalog.com
REACT_APP_MAPCOLONIES_SERVING_URL=https://your-production-serving.com
REACT_APP_MAPCOLONIES_TOKEN=your-production-token
```

עדכן את config.js:
```javascript
export const MAP_COLONIES_CONFIG = {
    CATALOG_SERVICE_URL: process.env.REACT_APP_MAPCOLONIES_CATALOG_URL || 'fallback-url',
    SERVING_SERVICE_URL: process.env.REACT_APP_MAPCOLONIES_SERVING_URL || 'fallback-url',
    AUTH_TOKEN: process.env.REACT_APP_MAPCOLONIES_TOKEN || 'fallback-token',
    // ...
};
```

## 🎯 מה עכשיו?

1. **עדכן את config.js** עם הנתונים האמיתיים שלך
2. **הרץ `npm start`** ובדוק שהמפה נטענת
3. **פתח את הקונסולה** ובדוק הודעות
4. **אם יש שגיאות** - עקוב אחר החלק "פתרון בעיות" למעלה

**אם הכל עובד** - תראה מפה עם רקע MapColonies ואפשרות לבחור בין שכבות רקע שונות!

---

## 📞 צריך עזרה?

אם יש לך שאלות או בעיות:
1. בדוק את הקונסולה לשגיאות
2. ודא שיש לך את כל הנתונים הנדרשים (URLs, tokens, productType/productId)  
3. צלם screenshots של השגיאות
4. בקש עזרה עם הפרטים המלאים