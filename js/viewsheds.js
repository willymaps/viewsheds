var mapTour = document.getElementById("mapTour");
var mapBones = document.getElementById("mapBones");

mapTour.addEventListener("click", function() {
    ani = 0;
    animateLine();
    this.style.pointerEvents = "none";
    this.style.opacity = 0.25;
    this.style.background = "#FFFFFF";
});

mapBones.addEventListener("click", function() {
  this.classList.toggle("active");
  if (this.classList.contains('active')) {
    map.setLayoutProperty('satellite', 'visibility', 'none');
    this.style.background = "#FFFFFF";
    this.innerHTML = 'add satellite';
  } else {
    map.setLayoutProperty('satellite', 'visibility', 'visible');
    this.style.background = "#efefef";
    this.innerHTML = 'bare bones';
  }
});


// options for viewshed
var centerX = 31.132941;
var centerY = 29.977597;

// Number of lines drawn (higher will increase the quality of the viewshed, but slow performance)
var qualityValue = 360;

// How large do you want the viewshed?
var radius = 250;

var ani;

var intersection;
var intersectionCoords;

var linesDrawn = false;
var conflictCheck = false;

var intersectionArray = [];
var pointsArray = [];

// Holds mousedown state for events. if this
// flag is active, we move the point on `mousemove`.
var isDragging;

// Is the cursor over a point? if this
// flag is active, we listen for a mousedown event.
var isCursorOverPoint;

// Add powerful sunglasses
var el = document.createElement('i');
el.classList.add('em');
el.classList.add('em-dark_sunglasses');

// don't steal this please
mapboxgl.accessToken = 'pk.eyJ1Ijoid2lsbGlhbWJlbmRhdmlzIiwiYSI6IlVrb3BGVzQifQ.jeHxDCnpXXvAXKfAFEYG-A';

var bounds = [
  [31.115562, 29.965652],
  [31.147014, 29.990302]
];

var map = new mapboxgl.Map({
  container: 'map',
  style: 'mapbox://styles/williambendavis/cizun3z39001d2ssj9wuoqmkl',
  center: [31.132695, 29.975549],
  zoom: 14.7,	
  minZoom:14.5,
  maxZoom:16,
  maxBounds: bounds
});

map.scrollZoom.disable();

var canvas = map.getCanvasContainer();

var geojsonPolyArray = [];

var geojsonPolyCoords = [];

var geojsonPoly = {
  "type": "Feature",
  "geometry": {
    "type": "Polygon",
    "coordinates": geojsonPolyCoords
  }
};

var geojsonPoint = {
  "type": "FeatureCollection",
  "features": [{
    "type": "Feature",
    "geometry": {
      "type": "Point",
      "coordinates": [centerX, centerY]
    }
  }]
};

map.on('load', function () {

  map.addSource('point', {
    "type": "geojson",
    "data": geojsonPoint
  });

	map.addLayer({
    'id': 'pyramids',
    'type': 'fill',
    'source': {
      'type': 'geojson',
      'data': buildings
    },
    'layout': {},
    'paint': {
      'fill-color': 'gold',
      'fill-opacity': 0.2
    }
  });

  map.addLayer({
    "id": "point",
    "type": "circle",
    "source": "point",
    "paint": {
      "circle-radius": 20,
      "circle-color": "#FFFFFF",
      "circle-opacity": 0
    }
  });

  map.on('mouseenter', 'point', function() {
      map.setPaintProperty('point', 'circle-opacity', 0);
      canvas.style.cursor = 'move';
      isCursorOverPoint = true;
      map.dragPan.disable();
  });

  map.on('mouseleave', 'point', function() {
      canvas.style.cursor = '';
      isCursorOverPoint = false;
      map.dragPan.enable();
  });

  map.on('mousedown', mouseDown);

  createPoly();

});

// Code from Mathieu Albrespy's fiddle http://jsfiddle.net/Themacprod/hy7vsa5m/3/
function Radians(degrees) {
  return degrees * Math.PI / 180;
};

function Degrees(radians) {
  return radians * 180 / Math.PI;
};

function Earthradius(lat) {
  var An = 6378137.0 * 6378137.0 * Math.cos(lat);
  var Bn = 6356752.3 * 6356752.3 * Math.sin(lat);
  var Ad = 6378137.0 * Math.cos(lat);
  var Bd = 6356752.3 * Math.sin(lat);

  return Math.sqrt((An * An + Bn * Bn) / (Ad * Ad + Bd * Bd));
};

function DestinationPoint(latdeg, lngdeg, distInMeter, angleDeg) {
  var θ = Radians(Number(angleDeg));
  var δ = Number(distInMeter / Earthradius(latdeg));

  var φ1 = Radians(latdeg);
  var λ1 = Radians(lngdeg);

  var φ2 = Math.asin(
    Math.sin(φ1) * Math.cos(δ) +
    Math.cos(φ1) * Math.sin(δ) * Math.cos(θ));
  var λ2 = λ1 + Math.atan2(
    Math.sin(θ) * Math.sin(δ) * Math.cos(φ1),
    Math.cos(δ) - Math.sin(φ1) * Math.sin(φ2));

  // Normalise to -180..+180°.
  λ2 = (λ2 + 3 * Math.PI) % (2 * Math.PI) - Math.PI;

  return [Degrees(φ2), Degrees(λ2)];
};


function evalPoly() {

	for (i = 0; i < qualityValue; i++) {

		var lineName = 'line-animation' + i;

		var geojson = {
	    "type": "FeatureCollection",
	    "features": [{
        "type": "Feature",
        "geometry": {
          "type": "LineString",
          "coordinates": [
              [centerX, centerY]
          ]
        }
	    }]
		};

		var AngleDeg = (360 * (i / qualityValue));

    var LatLong = DestinationPoint(
      centerY,
      centerX,
      radius,
      AngleDeg
    );

    // var x = centerX + radius * Math.cos(2 * Math.PI * i / qualityValue);
    // var y = centerY + radius * Math.sin(2 * Math.PI * i / qualityValue);

    var x = LatLong[1];
    var y = LatLong[0];

    // ADD LINES

    // geojson.features[0].geometry.coordinates.push([x, y]);

    // if (linesDrawn == false) {
    //   map.addLayer({
    //       'id': lineName,
    //       'type': 'line',
    //       'source': {
    //           'type': 'geojson',
    //           'data': geojson
    //       },
    //       "layout": {
    //           "line-join": "round",
    //           "line-cap": "round"
    //       },
    //       "paint": {
    //           "line-color": "#888",
    //           "line-width": 1,
    //           "line-opacity": 0.5
    //       }
    //   });
    // } else {
    //   map.getSource(lineName).setData(geojson);
    // }

		new mapboxgl.Marker(el)
			.setLngLat([centerX, centerY])
			.addTo(map);

    getBuildings(x, y);

	}

	geojsonPolyCoords.push(geojsonPolyArray);
  // linesDrawn = true;

}

function getBuildings(x, y) {

  pointsArray = [];
  intersectionArray = [];
  conflictCheck = false;


  var matchLine = turf.lineString([[centerX, centerY], [x, y]], null);

  for (n = 0; n < buildings.features.length; n++) {
    var polyInfo = [buildings.features[n].geometry.coordinates[0]];
    var matchPoly = turf.polygon(polyInfo);

    intersection = turf.lineIntersect(matchLine, matchPoly);

    if (intersection.features.length == 0) {
      
    } else {
      intersectionArray.push(intersection.features);
    }
  }

  if (intersectionArray.length >= 1) {
    conflictCheck = true;
    for (p = 0; p < intersectionArray.length; p++) {
      var intersectionNumber = intersectionArray[p];
      if (intersectionArray[p].length == 2) {
        var intersectConflictOne = intersectionNumber[0].geometry.coordinates;
        pointsArray.push(turf.point([intersectConflictOne[0], intersectConflictOne[1]]));
        var intersectConflictTwo = intersectionNumber[1].geometry.coordinates;
        pointsArray.push(turf.point([intersectConflictTwo[0], intersectConflictTwo[1]]));
      } else if (intersectionArray[p].length >= 3){
        var intersectConflictOne = intersectionNumber[0].geometry.coordinates;
        pointsArray.push(turf.point([intersectConflictOne[0], intersectConflictOne[1]]));
        var intersectConflictTwo = intersectionNumber[1].geometry.coordinates;
        pointsArray.push(turf.point([intersectConflictTwo[0], intersectConflictTwo[1]]));
        var intersectConflictThree = intersectionNumber[3].geometry.coordinates;
        pointsArray.push(turf.point([intersectConflictThree[0], intersectConflictThree[1]]));
      } else {
        var intersectConflictOne = intersectionNumber[0].geometry.coordinates;
        pointsArray.push(turf.point([intersectConflictOne[0], intersectConflictOne[1]]));
      }
    }
  }

  getConflict(x, y);

}

function getConflict(x, y) {
  var nearest = null;
	if (conflictCheck == true) {
    var targetPoint = turf.point([centerX, centerY]);
    var points = turf.featureCollection(pointsArray);

    nearest = turf.nearestPoint(targetPoint, points);

		var intersectCon = nearest.geometry.coordinates;

	  geojsonPolyArray.push([intersectCon[0], intersectCon[1]]);

	} else {
	 geojsonPolyArray.push([x, y]);
	}
}


function updatePoly() {
	geojsonPolyArray = [];
	geojsonPolyCoords = [];
	geojsonPoly = {
    "type": "Feature",
    "geometry": {
      "type": "Polygon",
      "coordinates": geojsonPolyCoords
    }
	};

	evalPoly();

	map.getSource('polygon').setData(geojsonPoly);
}


function createPoly() {

	evalPoly();

	map.addLayer({
    'id': 'polygon',
    'type': 'fill',
    'source': {
      'type': 'geojson',
      'data': geojsonPoly
    },
    'layout': {},
    'paint': {
      'fill-color': '#FFFFFF',
      'fill-opacity': 0.65,
      'fill-outline-color': '#000'
    }
 	});
}

function animateLine() {

  var width = window.innerWidth;
  console.log(animationPoints.geometries.length);

  function myLoop () {
   var mapInt = setInterval(function () {
    ani++;
    if (ani < animationPoints.geometries.length) {
      var coords = animationPoints.geometries[ani].coordinates

      qualityValue = 60;
      centerX = coords[0];
      centerY = coords[1];

      geojsonPoint.features[0].geometry.coordinates = [centerX, centerY];
      map.getSource('point').setData(geojsonPoint);

      if (width <= 550) {
        map.flyTo({
            center: [centerX, centerY]
        });
      }

      updatePoly();
    } else {
      document.getElementById('mapNote').classList.add('show');
      mapTour.style.pointerEvents = "inherit";
      mapTour.style.opacity = 1;
      mapTour.style.background = "#efefef";
      clearInterval(mapInt);
    }
   }, 45);
  }
  myLoop();
} 


function mouseDown() {
    if (!isCursorOverPoint) return;

    isDragging = true;

    // Set a cursor indicator
    canvas.style.cursor = 'grab';

    // Mouse events
    map.on('mousemove', onMove);
    map.once('mouseup', onUp);

    document.getElementById('mapNote').classList.add('hide');
}

function onMove(e) {
  if (!isDragging) return;
  var coords = e.lngLat;

  // Set a UI indicator for dragging.
  canvas.style.cursor = 'grabbing';

  // Update the Point feature in `geojson` coordinates
  // and call setData to the source layer `point` on it.
  // geojson.features[0].geometry.coordinates = [coords.lng, coords.lat];
  // map.getSource('point').setData(geojson);

  new mapboxgl.Marker(el)
	.setLngLat(e.lngLat)
	.addTo(map);

  qualityValue = 60;
	centerX = e.lngLat.lng;
	centerY = e.lngLat.lat;

	geojsonPoint.features[0].geometry.coordinates = [centerX, centerY];
  map.getSource('point').setData(geojsonPoint);

	updatePoly();
}

function onUp(e) {
  if (!isDragging) return;
  var coords = e.lngLat;

  // Print the coordinates of where the point had
  // finished being dragged to on the map.
  // coordinates.style.display = 'block';
  // coordinates.innerHTML = 'Longitude: ' + coords.lng + '<br />Latitude: ' + coords.lat;
  canvas.style.cursor = '';
  isDragging = false;

  qualityValue = 360;
  updatePoly();

  // Unbind mouse events
  map.off('mousemove', onMove);
    
}