// Define Bhutan National Grid (EPSG:5266)
proj4.defs("EPSG:5266","+proj=tmerc +lat_0=0 +lon_0=90 +k=1 +x_0=250000 +y_0=0 +ellps=GRS80 +units=m +no_defs");

const districts = [
    {name: "NATIONAL GRID", cmLon: 90},
    {name: "BUMTHANG", cmLon: 90.733333},
    {name: "CHUKHA", cmLon: 89.55},
    {name: "GASA", cmLon: 90.033333},
    {name: "DAGANA", cmLon: 89.85},
    {name: "HA", cmLon: 90.15},
    {name: "LHUENTSE", cmLon: 91.133333},
    {name: "MONGAR", cmLon: 91.233333},
    {name: "PARO", cmLon: 89.35},
    {name: "PEMAGATSHEL", cmLon: 91.35},
    {name: "PUNAKHA", cmLon: 89.85},
    {name: "SAMDRUP JONGKHAR", cmLon: 91.566667},
    {name: "SAMTSE", cmLon: 89.066667},
    {name: "SARPANG", cmLon: 90.266667},
    {name: "THIMPHU", cmLon: 89.55},
    {name: "TRASHIGANG", cmLon: 91.75},
    {name: "TRONGSA", cmLon: 90.5},
    {name: "TSIRANG", cmLon: 90.166667},
    {name: "WANGDUE PHODRANG", cmLon: 90.116667},
    {name: "YANGTSE", cmLon: 91.566667},
    {name: "ZHEMGANG", cmLon: 90.866667}
    // Add all other districts from previous example
];

let map;
let marker;
// Initialize Leaflet map
async function initApp() {
    initMap();
    loadDistricts();
    await addDistrictLayer();
}

function initMap() {
    map = L.map('map').setView([27.5142, 90.4336], 7);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
    }).addTo(map);

    map.on('click', function(e) {
        if (marker) map.removeLayer(marker);
        marker = L.marker(e.latlng).addTo(map);
        const converted = proj4('WGS84', 'EPSG:5266', [e.latlng.lng, e.latlng.lat]);
        document.getElementById('easting').value = Math.round(converted[0]);
    });
}

function loadDistricts() {
    const select = document.getElementById('districtSelect');
    districts.forEach(district => {
        const option = document.createElement('option');
        option.value = district.cmLon;
        option.textContent = `${district.name} (${district.cmLon.toFixed(6)}°E)`;
        select.appendChild(option);
    });
}

async function addDistrictLayer() {
    try {
        const response = await fetch('data/districts.geojson');
        const geoJsonData = await response.json();
        
        const convertedGeoJson = {
            ...geoJsonData,
            features: geoJsonData.features.map(feature => {
                const convertedCoords = feature.geometry.coordinates.map(polygon =>
                    polygon.map(ring =>
                        ring.map(coord => 
                            proj4('EPSG:5266', 'WGS84', [coord[0], coord[1]])
                        )
                    )
                );
                
                return {
                    ...feature,
                    geometry: {
                        ...feature.geometry,
                        coordinates: convertedCoords
                    }
                };
            })
        };

        L.geoJSON(convertedGeoJson, {
            style: {
                fillColor: '#3498db',
                fillOpacity: 0.2,
                color: '#2c3e50',
                weight: 1
            },
            onEachFeature: function(feature, layer) {
                if (feature.properties.NAME) {
                    layer.bindPopup(`<b>${feature.properties.NAME}</b>`);
                }
            }
        }).addTo(map);

    } catch (error) {
        console.error('Error loading GeoJSON:', error);
        alert('Failed to load district boundaries. Please try refreshing the page.');
    }
}

function calculateGridDistance() {
    const cmLon = parseFloat(document.getElementById('districtSelect').value);
    const currentEasting = parseFloat(document.getElementById('easting').value);

    if (!cmLon || isNaN(currentEasting)) {
        alert('Please select a district and provide easting value');
        return;
    }
 // Convert CM longitude to grid easting
    const cmEasting = proj4('WGS84', 'EPSG:5266', [cmLon, 0])[0];
    const gridDistance = Math.abs(currentEasting - cmEasting)/1000;
// Display results
    document.getElementById('distanceResult').textContent = gridDistance.toFixed(2);
    document.getElementById('cmValue').textContent = cmEasting.toFixed(2);
    document.getElementById('result').style.display = 'block';
}

// Initialize application
window.onload = initApp;