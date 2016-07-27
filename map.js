var noSqlDb = "capture";

var myLatLng = {lat: 37.76703763908325, lng: -122.399161844198};
var map;

var arrX;
var arrY;
var results;
var markers = [];

function zoomToMe() {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(setCurrentPosition);
  } else {
    alert("Geolocation is not supported by this browser.");
  }
}

function setCurrentPosition(position) {
  myLatLng = {lat: position.coords.latitude, lng: position.coords.longitude};
  console.log(myLatLng);
  map.setCenter(myLatLng);
}

function initMap() {
  map = new google.maps.Map(document.getElementById('map'), {
    zoom: 17,
    center: myLatLng
  });

  map.addListener('center_changed', function() {
    deleteMarkers();
  });


}

function search() {
  results = [];
  $.couch.urlPrefix = "http://localhost:5984";

  searchLat(function() {
    searchLng(function() {
      mergeResults(function() {
        showResults();
      });
    })
  });
}

function showResults() {
  results.forEach(function(item, index){
    console.log("Marker: " + item);
    var marker = new google.maps.Marker({
      position: item.coords,
      map: map,
      title: item.id
    });

    marker.addListener('click', function() {
      showInfo(item);
    });

    markers.push(marker);
  });
}

function showInfo(item) {
  var infoDiv = document.getElementById("itemInfo");
  infoDiv.innerHTML = item.id + "<br>";
  var thumbnail = document.createElement("img");
  thumbnail.src = "http://127.0.0.1:5984/capture/" + item.id + "/thumbnail.png";
  infoDiv.appendChild(thumbnail);
}

function searchLat(callback) {
  $.couch.db(noSqlDb).view("map/lat", {
    success: function(data) {
      arrX = data.rows;
      callback();
    },
    error: function(status) {
      console.log(status);
    },
    reduce: false,
    startkey: map.getBounds().getSouthWest().lat(),
    endkey: map.getBounds().getNorthEast().lat()
  });
}

function searchLng(callback) {
  $.couch.db(noSqlDb).view("map/lng", {
    success: function(data) {
      arrY = data.rows;
      callback();
    },
    error: function(status) {
      console.log(status);
    },
    reduce: false,
    startkey: map.getBounds().getSouthWest().lng(),
    endkey: map.getBounds().getNorthEast().lng()
  });
}

function mergeResults(callback) {
  arrX.forEach(function(xItem, xIndex) {
    arrY.forEach(function(yItem, yIndex) {
      if (xItem.id === yItem.id) {
        if ($.inArray(xItem.id,results)){
          results.push({id: xItem.id,
            coords:{
              lat: xItem.key,
              lng: yItem.key
            }});
          }
        }
      });
    });
    callback();
  }

  //Marker Helper Functions
  // Sets the map on all markers in the array.
  function setMapOnAll(map) {
    for (var i = 0; i < markers.length; i++) {
      markers[i].setMap(map);
    }
  }

  // Removes the markers from the map, but keeps them in the array.
  function clearMarkers() {
    setMapOnAll(null);
  }

  // Shows any markers currently in the array.
  function showMarkers() {
    setMapOnAll(map);
  }

  // Deletes all markers in the array by removing references to them.
  function deleteMarkers() {
    clearMarkers();
    markers = [];
  }
