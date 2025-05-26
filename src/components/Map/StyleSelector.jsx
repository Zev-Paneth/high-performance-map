import React from 'react';
import { STYLE_INFO, getAvailableStyles } from './styles';

const StyleSelector = ({
                           currentStyle,
                           onStyleChange,
                           layout = 'buttons', // 'buttons' או 'dropdown'
                           showIcons = true,
                           showDescriptions = false,
                           compact = false, // מצב צפוף יותר
                           columns = 2 // כמה עמודות בתצוגת כפתורים
                       }) => {
    const availableStyles = getAvailableStyles();

    // אם אין סגנונות זמינים
    if (availableStyles.length === 0) {
        return (
            <div style={{
                padding: '10px',
                textAlign: 'center',
                color: '#666',
                fontStyle: 'italic'
            }}>
                אין סגנונות זמינים
            </div>
        );
    }

    // תצוגת רשימה נפתחת
    if (layout === 'dropdown') {
        return (
            <div style={{ marginBottom: '15px' }}>
                <label
                    htmlFor="style-select"
                    style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}
                >
                    סגנון מפה:
                </label>
                <select
                    id="style-select"
                    value={currentStyle}
                    onChange={(e) => onStyleChange(e.target.value)}
                    style={{
                        width: '100%',
                        padding: '10px',
                        borderRadius: '6px',
                        border: '1px solid #ccc',
                        backgroundColor: 'white',
                        fontSize: '14px',
                        cursor: 'pointer'
                    }}
                >
                    {availableStyles.map(styleKey => {
                        const info = STYLE_INFO[styleKey];
                        return (
                            <option key={styleKey} value={styleKey}>
                                {showIcons ? `${info.icon} ` : ''}{info.name}
                                {showDescriptions ? ` - ${info.description}` : ''}
                            </option>
                        );
                    })}
                </select>
            </div>
        );
    }

    // תצוגת כפתורים - ברירת מחדל
    const gridColumns = Math.min(columns, availableStyles.length);

    return (
        <div style={{ marginBottom: '15px' }}>
            <div style={{ marginBottom: '8px', fontWeight: 'bold', fontSize: '14px' }}>
                סגנון מפה:
            </div>

            <div style={{
                display: 'grid',
                gridTemplateColumns: `repeat(${gridColumns}, 1fr)`,
                gap: compact ? '4px' : '6px',
                width: '100%'
            }}>
                {availableStyles.map(styleKey => {
                    const info = STYLE_INFO[styleKey];
                    const isActive = currentStyle === styleKey;

                    return (
                        <button
                            key={styleKey}
                            onClick={() => onStyleChange(styleKey)}
                            title={showDescriptions ? info.description : info.name}
                            style={{
                                padding: compact ? '6px 4px' : '10px 8px',
                                backgroundColor: isActive ? '#007cba' : '#f8f9fa',
                                color: isActive ? 'white' : '#333',
                                border: isActive ? '2px solid #005a8b' : '2px solid #dee2e6',
                                borderRadius: '8px',
                                cursor: 'pointer',
                                fontSize: compact ? '11px' : '12px',
                                textAlign: 'center',
                                transition: 'all 0.2s ease',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                gap: '3px',
                                minHeight: compact ? '45px' : '60px',
                                fontWeight: isActive ? '600' : '500',
                                transform: isActive ? 'scale(1.02)' : 'scale(1)',
                                boxShadow: isActive
                                    ? '0 2px 8px rgba(0, 124, 186, 0.3)'
                                    : '0 1px 3px rgba(0, 0, 0, 0.1)'
                            }}
                            onMouseEnter={(e) => {
                                if (!isActive) {
                                    e.target.style.backgroundColor = '#e9ecef';
                                    e.target.style.transform = 'scale(1.01)';
                                }
                            }}
                            onMouseLeave={(e) => {
                                if (!isActive) {
                                    e.target.style.backgroundColor = '#f8f9fa';
                                    e.target.style.transform = 'scale(1)';
                                }
                            }}
                        >
                            {showIcons && (
                                <span style={{
                                    fontSize: compact ? '16px' : '18px',
                                    lineHeight: '1'
                                }}>
                                    {info.icon}
                                </span>
                            )}
                            <span style={{
                                fontSize: compact ? '9px' : '10px',
                                lineHeight: '1.2',
                                textAlign: 'center',
                                wordBreak: 'break-word'
                            }}>
                                {info.name}
                            </span>
                        </button>
                    );
                })}
            </div>

            {/* תיאור הסגנון הנוכחי */}
            {showDescriptions && currentStyle && STYLE_INFO[currentStyle] && (
                <div style={{
                    marginTop: '10px',
                    padding: '10px',
                    backgroundColor: '#f8f9fa',
                    borderRadius: '6px',
                    border: '1px solid #dee2e6',
                    fontSize: '12px',
                    color: '#666',
                    textAlign: 'center'
                }}>
                    <strong>{STYLE_INFO[currentStyle].name}:</strong>{' '}
                    {STYLE_INFO[currentStyle].description}
                </div>
            )}

            {/* מידע על כמות הסגנונות */}
            <div style={{
                marginTop: '8px',
                fontSize: '11px',
                color: '#999',
                textAlign: 'center'
            }}>
                {availableStyles.length} סגנונות זמינים
            </div>
        </div>
    );
};

export default StyleSelector;