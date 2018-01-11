(function() {

    // Private vars
    var $content, map, markers, coords = {};

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
            appId: "CAE61A18D175262110E7DA593",
            url: "https://developer.trimet.org/ws/v2/vehicles"
        },

        timeout: 5000 // update timeout
    };

    // ----------------------------------------------------
    // Show an error message
    // ----------------------------------------------------
    function showError(msg) {
        var $el = document.getElementById('error');
        $el.style.display = 'block';
        $el.innerHTML = msg;
    }

    // ----------------------------------------------------
    // Markers class
    // ----------------------------------------------------
    function Markers() {
        var m = {};

        // Find a bus number in an array of bus data
        function find(num, data) {
            for (var i = 0; i < data.length; i++) {
                if (data[i].routeNumber === Number(num))
                    return true;
            }
            return false;
        };

        // Remove a bus number from the map
        function remove(num) {
            m[num].setMap(null);
            delete m[num];
        };

        return {

            // Add or update a marker for bus number at lat/lng
            add: (number, lat, lng) => {
                if (m[number]) {
                    m[number].setPosition({
                        lat: lat,
                        lng: lng
                    });
                } else {
                    m[number] = new google.maps.Marker({
                        position: {
                            lat: lat,
                            lng: lng
                        },
                        map: map,
                        label: String(number)
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
                markers.add(v.routeNumber, v.latitude, v.longitude);
            }
        }

        $content.innerHTML = '<ul>' + html + '</ul>';
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
                    lat: pos.coords.latitude,
                    lng: pos.coords.longitude
                });
                loadTrimetData();
                setInterval(loadTrimetData, config.timeout);
            });
        },

        // Callback for the Google maps initialization
        // -------------------------------------------
        initMap: () => {
            map = new google.maps.Map(document.getElementById('map'), {
                zoom: 12,
                center: {
                    lat: 45.4354834,
                    lng: -122.8311916
                } // Somewhere in Beaverton
            });
        }
    };
})();
