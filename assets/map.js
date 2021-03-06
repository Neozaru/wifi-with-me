$( document ).ready(function() {

    // Defaults
    defaults = {
        lat: 47.218371,
        lng: -1.553621,
        zoom: 13,
    }

    // Icons
    var leecherIcon = L.icon({
    iconUrl: 'assets/leaflet/images/marker-icon.png',
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [0, -28]
    });


    var seederIcon = L.icon({
    iconUrl: 'assets/leaflet/images/marker-icon-red.png',
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [0, -28]
    });


    // Create map
    var map = L.map('map', {scrollWheelZoom: false}).setView([defaults.lat,defaults.lng], defaults.zoom);
    L.tileLayer('//{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: 'Map data &copy; <a href="//openstreetmap.org">OpenStreetMap</a> contributors, <a href="//creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="//mapbox.com">Mapbox</a>',
        maxZoom: 18
    }).addTo(map);

    // Add scale control
    L.control.scale({
        position: 'bottomleft',
        metric: true,
        imperial: false,
        maxWidth: 200
    }).addTo(map);

    // Get JSON
    var GeoJsonPath = $('#map').data('json')
    $.getJSON(GeoJsonPath, function(data){

        function buildPopupContent(feature, layer) {
            feature.properties.popupContent = '';

            var featureIdLink = '<a href="#' + feature.id + '">#' + feature.id + '</a>';
            if (feature.properties.name) {
                feature.properties.popupContent += '<h2>'+featureIdLink+': '+feature.properties.name+'</h2>';
            }
            else {
                feature.properties.popupContent += '<h2>'+ featureIdLink +'</h2>';
            }

            if (feature.properties.place) {
                feature.properties.popupContent += '<ul>';
                if (feature.properties.place.hasOwnProperty('floor')) feature.properties.popupContent += '<li>Étage: '+feature.properties.place.floor+'</li>';
                if (feature.properties.place.orientations[0]) feature.properties.popupContent += '<li>Orientation: '+feature.properties.place.orientations.join(', ')+'</li>';
                if (feature.properties.place.roof) feature.properties.popupContent += '<li>Accès au toit'+'</li>';
                feature.properties.popupContent += '</ul>';
            }

            if (feature.properties.comment) {
                feature.properties.popupContent += '<p>'+feature.properties.comment+'</p>';
            }

            layer.bindPopup(feature.properties.popupContent);
            layer.id = feature.id;
        }

        function drawSemiCircles(feature, layer) {
            if (feature.properties.place) {
                feature.properties.place.angles.map(function(angles) {
                    // Strangely enough, we need to invert the coordinates.
                    L.circle([feature.geometry.coordinates[1],
                              feature.geometry.coordinates[0]], 150, {
                                  startAngle: angles[0],
                                  stopAngle: angles[1]
                              }).addTo(map);
                });
            }
        }

        // Add to map
        var featureLayer = L.geoJson(data, {
            onEachFeature: function(feature, layer) {
                buildPopupContent(feature, layer);
                drawSemiCircles(feature, layer);
            },
            pointToLayer: function(feature, latlng) {
                var icon;
                if (feature.properties.contrib_type == 'connect') {
                    icon = leecherIcon;
                } else {
                    icon = seederIcon;
                }
                return L.marker(latlng, {icon: icon});
            }
        }).addTo(map);


        function openMarker(id) {
            for (var i in featureLayer._layers) {
                if (featureLayer._layers[i].id == id) {
                    // Get desired marker
                    var thisMarker = featureLayer._layers[i];
                    // Center map on marker and zoom
                    map.panTo(thisMarker.getLatLng());
                    map.setZoom(16);
                    //  Open popup
                    thisMarker.openPopup();
                }
            }
        }

        // Open popup if hash is present.
        if (window.location.hash) {
            var id = window.location.hash.substr(-1);
            openMarker(id);
        }
        else {
            // Auto Zoom
            // Strange leaflet bug, we need to set a null timeout
            setTimeout(function () {
                map.fitBounds(featureLayer.getBounds())
            }, 2);
        }

        // Bind window hash change
        window.onhashchange = function() {
            var id = window.location.hash.substr(-1);
            openMarker(id);
        }

    });

});
