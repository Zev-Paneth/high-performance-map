// src/components/Map/components/StyleSelector.jsx
// קומפוננטה לבחירת סגנון מפה

import React from 'react';
import { STYLE_INFO, getAvailableStyles } from './styles';

const StyleSelector = ({
                           currentStyle,
                           onStyleChange,
                           layout = 'buttons', // 'buttons' או 'dropdown'
                           showIcons = true,
                           showDescriptions = false
                       }) => {
    const availableStyles = getAvailableStyles();

    if (layout === 'dropdown') {
        return (
            <div style={{ marginBottom: '15px' }}>
                <label htmlFor="style-select" style={{ display: 'block', marginBottom: '5px' }}>
                    <strong>סגנון מפה:</strong>
                </label>
                <select
                    id="style-select"
                    value={currentStyle}
                    onChange={(e) => onStyleChange(e.target.value)}
                    style={{
                        width: '100%',
                        padding: '8px',
                        borderRadius: '4px',
                        border: '1px solid #ccc',
                        backgroundColor: 'white'
                    }}
                >
                    {availableStyles.map(styleKey => {
                        const info = STYLE_INFO[styleKey];
                        return (
                            <option key={styleKey} value={styleKey}>
                                {showIcons ? `${info.icon} ` : ''}{info.name}
                            </option>
                        );
                    })}
                </select>
            </div>
        );
    }

    // Layout כפתורים (ברירת מחדל)
    return (
        <div style={{ marginBottom: '15px' }}>
            <strong>סגנון מפה:</strong>
            <div style={{
                marginTop: '8px',
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(80px, 1fr))',
                gap: '5px'
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
                                padding: '8px 6px',
                                backgroundColor: isActive ? '#007cba' : '#f0f0f0',
                                color: isActive ? 'white' : '#333',
                                border: '1px solid #ccc',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                fontSize: '11px',
                                textAlign: 'center',
                                transition: 'all 0.2s ease',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                gap: '2px',
                                minHeight: '50px'
                            }}
                        >
                            {showIcons && (
                                <span style={{ fontSize: '16px' }}>
                                    {info.icon}
                                </span>
                            )}
                            <span style={{ fontSize: '10px', lineHeight: '1.2' }}>
                                {info.name}
                            </span>
                        </button>
                    );
                })}
            </div>

            {showDescriptions && currentStyle && (
                <div style={{
                    marginTop: '8px',
                    padding: '8px',
                    backgroundColor: '#f8f9fa',
                    borderRadius: '4px',
                    fontSize: '12px',
                    color: '#666'
                }}>
                    {STYLE_INFO[currentStyle].description}
                </div>
            )}
        </div>
    );
};

export default StyleSelector;