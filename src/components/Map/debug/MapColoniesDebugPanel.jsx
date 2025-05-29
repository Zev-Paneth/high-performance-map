// src/components/Map/debug/MapColoniesDebugPanel.jsx
// פאנל ניפוי באגים עבור MapColonies WGS84

import React, { useState, useEffect } from 'react';
import {
    validateWGS84Config,
    testMapColoniesConnection,
    MAP_COLONIES_CONFIG
} from '../../../services/mapColonies/config.js';
import { runFullDiagnostics, testSpecificLayer } from '../utils/testMapColoniesConnection.js';

const MapColoniesDebugPanel = ({
                                   isVisible = false,
                                   onClose = null,
                                   mapColoniesService = null
                               }) => {
    const [diagnosticsResult, setDiagnosticsResult] = useState(null);
    const [connectionStatus, setConnectionStatus] = useState('unknown');
    const [isRunningDiagnostics, setIsRunningDiagnostics] = useState(false);
    const [testLayerForm, setTestLayerForm] = useState({
        productType: '',
        productId: ''
    });

    // בדיקה אוטומטית בעת פתיחת הפאנל
    useEffect(() => {
        if (isVisible && !diagnosticsResult) {
            runQuickCheck();
        }
    }, [isVisible]);

    const runQuickCheck = async () => {
        setIsRunningDiagnostics(true);

        try {
            // בדיקת הגדרות
            const validation = validateWGS84Config();

            // בדיקת חיבור
            let connectionResult = { success: false, error: 'Not tested' };
            try {
                connectionResult = await testMapColoniesConnection();
                setConnectionStatus(connectionResult.success ? 'connected' : 'failed');
            } catch (error) {
                setConnectionStatus('error');
                connectionResult.error = error.message;
            }

            setDiagnosticsResult({
                validation,
                connection: connectionResult,
                timestamp: new Date().toLocaleString('he-IL')
            });

        } catch (error) {
            console.error('Error in quick check:', error);
        } finally {
            setIsRunningDiagnostics(false);
        }
    };

    const runFullCheck = async () => {
        setIsRunningDiagnostics(true);

        try {
            const result = await runFullDiagnostics();
            console.log('Full diagnostics completed:', result);

            // רענון התוצאות
            await runQuickCheck();

        } catch (error) {
            console.error('Error in full diagnostics:', error);
        } finally {
            setIsRunningDiagnostics(false);
        }
    };

    const testLayer = async () => {
        if (!testLayerForm.productType || !testLayerForm.productId) {
            alert('נא למלא את productType ו-productId');
            return;
        }

        setIsRunningDiagnostics(true);

        try {
            const result = await testSpecificLayer(
                testLayerForm.productType,
                testLayerForm.productId
            );

            if (result.success) {
                alert(`השכבה נמצאה: ${result.data.productName}`);
            } else {
                alert(`שגיאה: ${result.error}`);
            }

        } catch (error) {
            alert(`שגיאה: ${error.message}`);
        } finally {
            setIsRunningDiagnostics(false);
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'connected': return '#28a745';
            case 'failed': return '#dc3545';
            case 'error': return '#ffc107';
            default: return '#6c757d';
        }
    };

    const getStatusText = (status) => {
        switch (status) {
            case 'connected': return '✅ מחובר';
            case 'failed': return '❌ נכשל';
            case 'error': return '⚠️ שגיאה';
            default: return '❓ לא נבדק';
        }
    };

    if (!isVisible) return null;

    return (
        <div style={{
            position: 'fixed',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '90%',
            maxWidth: '600px',
            maxHeight: '80vh',
            backgroundColor: 'white',
            borderRadius: '12px',
            boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
            zIndex: 10000,
            overflow: 'hidden',
            border: '2px solid #007cba'
        }}>
            {/* כותרת */}
            <div style={{
                backgroundColor: '#007cba',
                color: 'white',
                padding: '15px 20px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
            }}>
                <h3 style={{ margin: 0, fontSize: '18px' }}>
                    🔍 ניפוי באגים - MapColonies WGS84
                </h3>
                {onClose && (
                    <button
                        onClick={onClose}
                        style={{
                            background: 'none',
                            border: 'none',
                            color: 'white',
                            fontSize: '24px',
                            cursor: 'pointer',
                            padding: '0 5px'
                        }}
                    >
                        ×
                    </button>
                )}
            </div>

            {/* תוכן */}
            <div style={{
                padding: '20px',
                maxHeight: '60vh',
                overflowY: 'auto'
            }}>
                {/* סטטוס חיבור */}
                <div style={{
                    marginBottom: '20px',
                    padding: '15px',
                    backgroundColor: '#f8f9fa',
                    borderRadius: '8px',
                    border: '1px solid #dee2e6'
                }}>
                    <h4 style={{ margin: '0 0 10px 0', color: '#333' }}>
                        🌐 סטטוס חיבור לשרת
                    </h4>
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px'
                    }}>
                        <span style={{
                            padding: '4px 12px',
                            borderRadius: '20px',
                            backgroundColor: getStatusColor(connectionStatus),
                            color: 'white',
                            fontSize: '12px',
                            fontWeight: 'bold'
                        }}>
                            {getStatusText(connectionStatus)}
                        </span>
                        <span style={{ fontSize: '14px', color: '#666' }}>
                            {MAP_COLONIES_CONFIG.CATALOG_SERVICE_URL}
                        </span>
                    </div>
                </div>

                {/* תוצאות אבחון */}
                {diagnosticsResult && (
                    <div style={{
                        marginBottom: '20px',
                        padding: '15px',
                        backgroundColor: '#f8f9fa',
                        borderRadius: '8px',
                        border: '1px solid #dee2e6'
                    }}>
                        <h4 style={{ margin: '0 0 10px 0', color: '#333' }}>
                            📋 תוצאות אבחון
                        </h4>

                        <div style={{ fontSize: '14px', lineHeight: '1.5' }}>
                            <div style={{ marginBottom: '8px' }}>
                                <strong>⏰ זמן בדיקה:</strong> {diagnosticsResult.timestamp}
                            </div>

                            <div style={{ marginBottom: '8px' }}>
                                <strong>⚙️ הגדרות:</strong>{' '}
                                {diagnosticsResult.validation.isValid ? (
                                    <span style={{ color: '#28a745' }}>✅ תקינות</span>
                                ) : (
                                    <span style={{ color: '#dc3545' }}>
                                        ❌ {diagnosticsResult.validation.errors.length} שגיאות
                                    </span>
                                )}
                            </div>

                            <div style={{ marginBottom: '8px' }}>
                                <strong>🗺️ שכבות רקע:</strong>{' '}
                                {Object.keys(MAP_COLONIES_CONFIG.BACKGROUND_LAYERS).length} מוגדרות
                            </div>

                            <div style={{ marginBottom: '8px' }}>
                                <strong>🔑 טוקן:</strong>{' '}
                                {MAP_COLONIES_CONFIG.AUTH_TOKEN === 'your-jwt-token-here' ? (
                                    <span style={{ color: '#dc3545' }}>❌ לא מוגדר</span>
                                ) : (
                                    <span style={{ color: '#28a745' }}>✅ מוגדר</span>
                                )}
                            </div>
                        </div>

                        {/* שגיאות */}
                        {diagnosticsResult.validation.errors.length > 0 && (
                            <div style={{
                                marginTop: '15px',
                                padding: '10px',
                                backgroundColor: '#f8d7da',
                                borderRadius: '6px',
                                border: '1px solid #f5c6cb'
                            }}>
                                <strong style={{ color: '#721c24' }}>🚨 שגיאות:</strong>
                                <ul style={{ margin: '5px 0 0 20px', color: '#721c24' }}>
                                    {diagnosticsResult.validation.errors.map((error, index) => (
                                        <li key={index} style={{ fontSize: '13px' }}>{error}</li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {/* אזהרות */}
                        {diagnosticsResult.validation.warnings.length > 0 && (
                            <div style={{
                                marginTop: '15px',
                                padding: '10px',
                                backgroundColor: '#fff3cd',
                                borderRadius: '6px',
                                border: '1px solid #ffeaa7'
                            }}>
                                <strong style={{ color: '#856404' }}>⚠️ אזהרות:</strong>
                                <ul style={{ margin: '5px 0 0 20px', color: '#856404' }}>
                                    {diagnosticsResult.validation.warnings.map((warning, index) => (
                                        <li key={index} style={{ fontSize: '13px' }}>{warning}</li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>
                )}

                {/* בדיקת שכבה ספציפית */}
                <div style={{
                    marginBottom: '20px',
                    padding: '15px',
                    backgroundColor: '#e8f4fd',
                    borderRadius: '8px',
                    border: '1px solid #b3d9ff'
                }}>
                    <h4 style={{ margin: '0 0 10px 0', color: '#0066cc' }}>
                        🧪 בדיקת שכבה ספציפית
                    </h4>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '10px' }}>
                        <input
                            type="text"
                            placeholder="Product Type"
                            value={testLayerForm.productType}
                            onChange={(e) => setTestLayerForm(prev => ({
                                ...prev, productType: e.target.value
                            }))}
                            style={{
                                padding: '8px',
                                border: '1px solid #ccc',
                                borderRadius: '4px',
                                fontSize: '14px'
                            }}
                        />
                        <input
                            type="text"
                            placeholder="Product ID"
                            value={testLayerForm.productId}
                            onChange={(e) => setTestLayerForm(prev => ({
                                ...prev, productId: e.target.value
                            }))}
                            style={{
                                padding: '8px',
                                border: '1px solid #ccc',
                                borderRadius: '4px',
                                fontSize: '14px'
                            }}
                        />
                    </div>

                    <button
                        onClick={testLayer}
                        disabled={isRunningDiagnostics}
                        style={{
                            padding: '8px 16px',
                            backgroundColor: '#0066cc',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: isRunningDiagnostics ? 'not-allowed' : 'pointer',
                            fontSize: '14px',
                            opacity: isRunningDiagnostics ? 0.6 : 1
                        }}
                    >
                        🔍 בדוק שכבה
                    </button>
                </div>

                {/* כפתורי פעולה */}
                <div style={{
                    display: 'flex',
                    gap: '10px',
                    flexWrap: 'wrap'
                }}>
                    <button
                        onClick={runQuickCheck}
                        disabled={isRunningDiagnostics}
                        style={{
                            padding: '12px 20px',
                            backgroundColor: '#28a745',
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px',
                            cursor: isRunningDiagnostics ? 'not-allowed' : 'pointer',
                            fontSize: '14px',
                            fontWeight: '500',
                            opacity: isRunningDiagnostics ? 0.6 : 1
                        }}
                    >
                        {isRunningDiagnostics ? '⏳ בודק...' : '🔄 בדיקה מהירה'}
                    </button>

                    <button
                        onClick={runFullCheck}
                        disabled={isRunningDiagnostics}
                        style={{
                            padding: '12px 20px',
                            backgroundColor: '#007cba',
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px',
                            cursor: isRunningDiagnostics ? 'not-allowed' : 'pointer',
                            fontSize: '14px',
                            fontWeight: '500',
                            opacity: isRunningDiagnostics ? 0.6 : 1
                        }}
                    >
                        📊 אבחון מלא
                    </button>

                    <button
                        onClick={() => {
                            console.clear();
                            console.log('MapColonies Configuration:', MAP_COLONIES_CONFIG);
                        }}
                        style={{
                            padding: '12px 20px',
                            backgroundColor: '#6c757d',
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontSize: '14px',
                            fontWeight: '500'
                        }}
                    >
                        📝 הדפס הגדרות
                    </button>
                </div>
            </div>
        </div>
    );
};

export default MapColoniesDebugPanel;