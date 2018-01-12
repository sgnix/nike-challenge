(function() {

    // Private vars
    var $content, map, markers, watch, myloc, coords = {};

    // ----------------------------------------------------
    // Configuration
    // ----------------------------------------------------
    var config = {
        geolocation: {
            options: {
                enableHighAccuracy: true,
                timeout: 5000,
                maximumAge: 0
            },

            distance: 0.05 // distance in km around location (i.e. 5km or 3mi)
        },

        trimet: {
            url: "https://developer.trimet.org/ws/v2/vehicles",
            appId: "CAE61A18D175262110E7DA593"
        },

        googleMap: {
            zoom: 12,
            center: { lat: 45.4354834, lng: -122.8311916 } // Somewhere in Beaverton
        },

        timeout: 5000 // data refresh timeout
    };

    // ----------------------------------------------------
    // Show an error message
    // ----------------------------------------------------
    function showError(msg) {
        var $el = document.getElementById('error');
        $el.style.display = 'block';
        $el.innerHTML = msg;
    }

    // ====================================================
    // Markers class
    // ----------------------------------------------------
    // Maintains a list (map really) of currently displayed
    // markers, and provides methods to add/update and purge
    // the list of bus markers that no longer should be on
    // the map.
    // ====================================================
    function Markers() {
        var m = {};

        // Find a bus number in an array of bus data
        function find(id, data) {
            for (var i = 0; i < data.length; i++) {
                if (data[i].vehicleID === Number(id))
                    return true;
            }
            return false;
        };

        // Remove a bus number from the map
        function remove(id) {
            m[id].setMap(null);
            delete m[id];
        };

        return {

            // Add or update a marker for bus based on vehicle record
            add: (v) => {
                var id = v.vehicleID,
                    lat = v.latitude,
                    lng = v.longitude;

                if (m[id]) {
                    m[id].setPosition({ lat: lat, lng: lng });
                } else {
                    m[id] = new google.maps.Marker({
                        position: { lat: lat, lng: lng },
                        map: map,
                        label: String(v.routeNumber),
                        icon: {
                          url: '//maps.google.com/mapfiles/kml/shapes/bus.png',
                          scaledSize: new google.maps.Size(32, 32),
                          labelOrigin: new google.maps.Point(16, -7)
                        }
                    });
                }
            },

            // Remove all markers for busses that are not in the data array
            purge: (data) => {
                Object.keys(m).forEach((num) => {
                    if (!find(num, data)) remove(num);
                });
            }
        }
    }

    // ----------------------------------------------------
    // Display information about the busses
    // ----------------------------------------------------
    function showData(data) {
        var vehicle = data.resultSet.vehicle,
            found = Array.isArray(vehicle) && vehicle.length > 0,
            html = '';

        if (!found) {
            $content.innerHTML = "There are no vehicles around you";
            return;
        }

        markers.purge(vehicle);
        for (var i = 0; i < vehicle.length; i++) {
            var v = vehicle[i];
            if (v.type == "bus" && v.signMessage != null) {
                html += '<li>' + v.signMessage + '</li>';
                markers.add(v);
            }
        }

        $content.innerHTML = '<ul>' + html + '</ul>';

        // Trigger a resize event, in case the size of the text also changed the map
        google.maps.event.trigger(map, "resize");
    }

    function formatParams(params) {
        return "?" + Object.keys(params).map((key) => {
            return key + "=" + encodeURIComponent(params[key])
        }).join("&");
    }

    // ----------------------------------------------------
    // Access the Trimet API to get data on the busses
    // ----------------------------------------------------
    function loadTrimetData() {
        var distance = config.geolocation.distance;
        var params = {
            appId: config.trimet.appId,
            bbox: (coords.longitude - distance) + ',' + (coords.latitude - distance) + ',' + (coords.longitude + distance) + ',' + (coords.latitude + distance)
        };

        var xmlhttp = new XMLHttpRequest();
        xmlhttp.open('GET', config.trimet.url + formatParams(params), true);
        xmlhttp.onreadystatechange = function() {
            if (xmlhttp.readyState == 4) {
                if (xmlhttp.status === 200) {
                    var json;
                    try {
                        json = JSON.parse(xmlhttp.responseText)
                    } catch (ex) {
                        showError(ex);
                    }
                    if (typeof json !== "undefined") {
                        showData(json);
                    }
                } else {
                    showError('Unknown error');
                }
            }
        }
        xmlhttp.send();
    }

    // Get the geolocation data and fire the `success` callback
    function getCoords(success) {
        var error = (e) => showError("Error: " + e);
        navigator.geolocation.getCurrentPosition(success, error, config.geolocation.options);
    }

    // Place a blue pin at the user's location
    function setUserLocation() {
        myloc = new google.maps.Marker({
            position: {
                lat: coords.latitude,
                lng: coords.longitude
            },
            map: map,
            icon: {
              url: '//maps.google.com/mapfiles/kml/paddle/ltblu-circle.png',
              scaledSize: new google.maps.Size(48, 48)
            }
        });
    }

    // ----------------------------------------------------
    // Main application
    // ----------------------------------------------------
    window.app = {

        // Main application entry point
        // ----------------------------
        run: () => {

            // Initialize DOM elements
            $content = document.getElementById('content');

            // Markers
            markers = new Markers();

            // Get the coordinates
            getCoords((pos) => {
                coords = pos.coords;

                map.setCenter({
                    lat: coords.latitude,
                    lng: coords.longitude
                });

                loadTrimetData();
                setInterval(loadTrimetData, config.timeout);

                setUserLocation();

                // Watch the position for changes
                watch = navigator.geolocation.watchPosition((pos) => { 
                  coords = pos.coords;
                  myloc.setPosition({ lat: coords.latitude, lng: coords.longitude });
                });
            });

        },

        // Callback for the Google maps initialization
        // -------------------------------------------
        initMap: () => {
            map = new google.maps.Map(document.getElementById('map'), config.googleMap);
        }
    };
})();
