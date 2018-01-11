(function(){

  // Private vars
  var $info, $error, $content, map, markers, coords = {};

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

      distance: 0.05        // distance in km around location
    },

    trimet: {
      appId: "CAE61A18D175262110E7DA593",
      url: "https://developer.trimet.org/ws/v2/vehicles"
    },

    timeout: 5000           // update timeout
  };

  // ----------------------------------------------------
  // Notify class
  // ----------------------------------------------------
  function Notify(id) {
    var $el = document.getElementById(id);
    return {
      show: (msg) => {
        $el.style.display = 'block';
        $el.innerHTML = msg;
      },
      hide: () => {
        $el.style.display = 'none';
      }
    };
  }
  
  // ----------------------------------------------------
  // Markers class
  // ----------------------------------------------------
  function Markers() {
    var m = {};

    return {
      add: (number, lat, lng) => {
        if (m[number]) {
          m[number].setPosition({lat: lat, lng: lng});
        }
        else {
          m[number] = new google.maps.Marker({
              position: {lat: lat, lng: lng},
              map: map,
              label: String(number)
          });
        }
      },

      remove: (number) => delete m[number]
    };
  }

  function showData(data) {
    var vehicle = data.resultSet.vehicle;
    var found = Array.isArray(vehicle) && vehicle.length > 0;

    if (!found) {
      $error.show("There are no vehicles around you");
      return;
    }

    var html = "";
    for (var i = 0; i < vehicle.length; i++) {
      var v = vehicle[i];
      if (v.signMessage != null) {
        //console.log(v);
        html += '<li>' + v.signMessage + '</li>';
        markers.add(v.routeNumber, v.latitude, v.longitude);
      }
    }

    $content.innerHTML = html;
  }

  function formatParams(params) {
    return "?" + Object.keys(params).map((key) => {
            return key + "=" + encodeURIComponent(params[key])
          }).join("&");
  }  

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
        if ( xmlhttp.status === 200 ) {
            var json;
            try {
              json = JSON.parse(xmlhttp.responseText)
            } catch (ex) {
              $error.show(ex);
            }
            if ( typeof json !== "undefined") {
              showData(json);
            }
        } else {
          $error.show('Unknown error');
        }
      }
    }
    xmlhttp.send();
  }

  function getCoords(success) {
    var error = (e) => console.log("Error: " + e);
    navigator.geolocation.getCurrentPosition(success, error, config.geolocation.options);
  }

  function poll() {
  }

  window.app = {
    run: () => {
      
      // Initialize DOM elements
      $info  = new Notify('info'),
      $error = new Notify('error');
      $content = document.getElementById('content');

      // Get the coordinates
      $info.show("Determining your location ...");
      getCoords((pos) => {
        $info.hide();
        coords = pos.coords;
        map.setCenter({lat: pos.coords.latitude, lng: pos.coords.longitude}); 
        loadTrimetData();
        setInterval(loadTrimetData, config.timeout);     
      });
    },

    initMap: () => {
        map = new google.maps.Map(document.getElementById('map'), {
          zoom: 12,
          center: { lat: 45.4354834, lng: -122.8311916 } // Library
        });
        markers = new Markers();
    }
  };
})();
