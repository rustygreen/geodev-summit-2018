var database = firebase.database();
var map;
var panorama;
var marker;
var id = queryParam('id') || 'rustygreen';
var dbRef = firebase.database().ref('riders');
var markers = {};
var defaultLat = 51.255784575374086;
var defaultLng = 6.740793585777284;
var riderIcon = L.icon({
  iconUrl: 'https://cdn3.iconfinder.com/data/icons/internet-and-web-4/78/internt_web_technology-08-512.png',
  iconSize: [38, 95], // size of the icon
  iconAnchor: [22, 94], // point of the icon which will correspond to marker's location
});

function initFirebase(id) {
  dbRef.on("value", function (snapshot) {
    syncRiders(snapshot.val());
  }, function (errorObject) {
    console.log("The read failed: " + errorObject.code);
  });
}

function syncRiders(riders) {
  console.log('Received updated rider info');
  for (var key in riders) {
    var rider = riders[key];
    var foundMe = false;
    //(riders || {}).forEach(function (rider) {
    if (rider.id === id) {
      foundMe = true;
      continue;
    }

    if (!markers[rider.id]) {
      var riderMarker = new L.marker({ lat: rider.lat, lng: rider.lng }, { opacity: 0.5, title: rider.label || rider.id }).addTo(map);
      markers[rider.id] = riderMarker;
      console.log('Creating new marker for: ' + rider.id);
    } else {
      console.log('Updating existing marker location for: ' + rider.id);
      markers[rider.id].setLatLng({ lat: rider.lat, lng: rider.lng });
    }
  };

  if (!foundMe) {
    console.log('Creating new record for me: ' + rider.id);
    var latlng = marker ? marker.getLatLng() : { lat: defaultLat, lng: defaultLng };
    dbRef.child(id).set({ id: id, lat: latlng.lat, lng: latlng.lng });
  }
}

function syncMap(latLng) {
  if (marker) {
    marker.setLatLng(latLng);
  }

  map.panTo(latLng);

  console.log('Updating record location for me: ' + id);
  dbRef.child(id).set({ id: id, lat: latLng.lat, lng: latLng.lng });
}

function sync(latLng) {
  syncMap(latLng);
  syncPanoramic(latLng);
}

function syncPanoramic(latLng) {
  if (panorama) {
    panorama.setPosition(latLng);
  }
}

function initMap(lat, lng) {
  var geojsonLayer = new L.GeoJSON.AJAX("../data/layer_3.geojson");
  map = L.map('map', {
    center: { lat: lat, lng: lng },
    zoom: 18
  })

  L.esri.basemapLayer('Topographic').addTo(map);
  geojsonLayer.addTo(map);

  map.on('click', function (e) {
    sync(e.latlng);
  });

  marker = new L.marker({ lat: lat, lng: lng }).addTo(map);
  markers[id] = marker;
}

function initStreetView() {
  panorama = new google.maps.StreetViewPanorama(document.getElementById('pano'), {
    position: marker.getLatLng(),
    pov: {
      heading: 130,
      pitch: 0
    },
    visible: true
  });

  panorama.addListener('position_changed', function () {
    var pos = panorama.getPosition()
    syncMap({ lat: pos.lat(), lng: pos.lng() });
  });
}

initMap(defaultLat, defaultLng);
initFirebase();