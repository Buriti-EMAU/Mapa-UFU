// js/bloco1i.js

export function addRectangleToMap(map) {
    if (!map || typeof map.addSource !== 'function') {
        console.error("Map object is invalid or not fully loaded.");
        return;
    }

    // Coordinates for the first rectangle (Bloco 1I)
    const bloco1ICoordinates = [
        [-48.25608556211708, -18.918630620018476], // Bottom-left
        [-48.255146117841576, -18.918427805573955], // Bottom-right
        [-48.25520848758572, -18.91811436458586], // Top-right
        [-48.256159626189, -18.918313491870535], // Top-left
        [-48.25608556211708, -18.918630620018476]  // Closing coordinate (same as bottom-left)
    ];

    // Coordinates for the second rectangle (New Bloco)
    // Extracted from the provided GeoJSON-like structure
    const bloco5obCoordinates = [
        [-48.256942054615195, -18.916814186892722],
        [-48.25676345736369,  -18.917466416068592],
        [-48.25648310121295,  -18.91741140888618],
        [-48.25665131490379,  -18.916751321295934],
        [-48.256942054615195, -18.916814186892722]
    ];

    // Check if source and layer already exist to prevent errors on hot-reloads or multiple calls
    // Cleanup for Bloco 1I
    if (map.getSource('bloco1i-source')) {
        // Check if layers exist before trying to remove them
        if (map.getLayer('bloco1i-layer-outline')) {
            map.removeLayer('bloco1i-layer-outline');
        }
        // Add fill layer removal if you re-add it
        map.removeSource('bloco1i-source');
    }
    // Cleanup for New Bloco
    if (map.getSource('bloco5ob-source')) {
        if (map.getLayer('bloco5ob-layer-outline')) {
            map.removeLayer('bloco5ob-layer-outline');
        }
        // Add fill layer removal if you add it
        map.removeSource('bloco5ob-source');
    }

    // Add source and layer for Bloco 1I
    map.addSource('bloco1i-source', {
        'type': 'geojson',
        'data': {
            'type': 'Feature',
            'geometry': {
                'type': 'Polygon',
                'coordinates': [bloco1ICoordinates]
            }
        }
    });

    map.addLayer({
        'id': 'rectangle-layer-outline',
        'type': 'line',
        'source': 'bloco1i-source', // Use the correct source ID
        'layout': {},
        'paint': {
            'line-color': '#000', 
            'line-width': 2,
        },
        
    });

    // Add source and layer for the New Bloco
    map.addSource('bloco5ob-source', {
        'type': 'geojson',
        'data': {
            'type': 'Feature',
            'geometry': {
                'type': 'Polygon',
                'coordinates': [bloco5obCoordinates]
            }
        }
    });

    map.addLayer({
        'id': 'bloco5ob-layer-outline',
        'type': 'line',
        'source': 'bloco5ob-source',
        'layout': {},
        'paint': {
            'line-color': '#000', 
            'line-width': 2,
        }
    });

    console.log("Rectangle features added to the map.");
}