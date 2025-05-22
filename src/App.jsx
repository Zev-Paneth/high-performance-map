import React from 'react';
import './App.css';
import MapExample from './components/MapExample';
import 'maplibre-gl/dist/maplibre-gl.css';

function App() {
    return (
        <div className="App" style={{ width: '100%', height: '100%'}}>
            <MapExample />
        </div>
    );
}

export default App;