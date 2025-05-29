import React from 'react';
import './App.css';
import OpenLayersMapExample from './components/OpenLayersMapExample.jsx';
import 'ol/ol.css'; // CSS של OpenLayers

function App() {
    return (
        <div className="App" style={{ width: '100%', height: '100%'}}>
            <OpenLayersMapExample />
        </div>
    );
}

export default App;