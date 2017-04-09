// Global map variable
var map;
var placeInfoWindow;
// Global placemarkers array to use in multiple functions to have control
// over the number of places that show
var placeMarkers = [];
var defaultIcon;
var highlightedIcon;
// YELP API
var YELP_KEY = "OxZvVRYUynQrXWGlc5kGvQ";
var YELP_KEY_SECRET = "arYjXn2ei0ck3TIjAaNdoGlWDKQ";
var YELP_TOKEN = "Kk5NIETQjfaP7lCaa-qi7Es4TLTLYe1L";
var YELP_TOKEN_SECRET = "7I-_v-8Fvl_WQVdMxSTuq0CAwvo";

function resize() {
    var mapElement = document.getElementById('map');
    var buttonElement = document.getElementById('trigger');
    if (mapElement.style.left == '340px') {
        mapElement.style.left = '0px';
        buttonElement.style.left = '0px';
    } else {
        mapElement.style.left = '340px';
        buttonElement.style.left = '340px';
    }
    var center = map.getCenter();
    google.maps.event.trigger(map, 'resize');
    map.panTo(center);
}

function populate() {
    document.getElementById("zoom-to-area").click();
    setTimeout(function(){document.getElementById("go-places").click()},1000);
}



var stringStartsWith = function(string, startsWith) {          
    string = string || "";
    if (startsWith.length > string.length)
        return false;
    return string.substring(0, startsWith.length) === startsWith;
};

function mapError() {
    alert("Could not load Google Maps!!!");
}

function initMap() {
	// Create a map object and display it in the div of id="map"
	map = new google.maps.Map(document.getElementById('map'), {
		center: {lat:37.09024, lng:-95.712891},
		scrollwheel: false,
		mapTypeControl: false,
		// `styles` variable contained in map-style.js
		styles: styles,
		zoom: 4
	});
    // Create a single infowindow to be used with the place details information 
    // so that only one is open at once
    placeInfoWindow = new google.maps.InfoWindow();
    // Styled markers for each location
    defaultIcon = makeMarkerIcon('0091ff');
    // Highlighted marker for when users mouseover
    highlightedIcon = makeMarkerIcon('FFFF24');
    // This autocomplete is for use in the geocoder entry box
    var zoomAutocomplete = new google.maps.places.Autocomplete(
        document.getElementById('zoom-to-area-text'));

    // Bias the boundaries within the map for zoomAutocomplete 
    zoomAutocomplete.bindTo('bounds', map);

    // Create a searchbox in order to execute a places search
    var searchBox = new google.maps.places.SearchBox(
        document.getElementById('places-search'));
    // Bias the searchbox to within the bounds of the map
    searchBox.setBounds(map.getBounds());
}


// Function takes the user input value in the find nearby area text input
// locates it, and then zooms into that area. This is so that the user can
// show all of the listings and decide to focus on a single area of the map

function zoomToArea(destination) {
    // Initialize the geocoder
    var geocoder = new google.maps.Geocoder();
    // Gets the destination that the user entered and sets it to the global variable
    // var destination = document.getElementById('zoom-to-area-text').value;
    // Make sure input is not blank
    if (destination == '') {
        window.alert('You must enter a destination!');
    } else {
        // Geocode the address/area entered to get the center. Then center the map
        // on it and zoom in
        geocoder.geocode({
            address: destination
            //componentRestrictions: {locality: destination}
        }, function(results, status) {
            if (status == google.maps.GeocoderStatus.OK) {
                map.setCenter(results[0].geometry.location);
                map.setZoom(13);
            } else {
                window.alert('We could not find that location - try entering a more' +
                    ' specific place.');
            }
        });
    }
}


// Previously a hideListings function, made generic for Listings and  Places
function hideMarkers(markers) {
    for (var i = 0; i < markers.length; i++) {
        markers[i].setMap(null);
    };
}

function makeInvisible() {
	for (var i = 0; i < placeMarkers.length; i++) {
		placeMarkers[i].setVisible(false);
	}
}

function makeDefault() {
    for (var i = 0; i < placeMarkers.length; i++) {
        placeMarkers[i].setIcon(defaultIcon);
    }
}
// Sets the map on all markers in the array.
function setMapOnAll(map) {
	for (var i = 0; i < placeMarkers.length; i++) {
		placeMarkers[i].setMap(map);
	}
}
// Removes the markers from the map, but keeps them in the array.
function clearMarkers() {
	setMapOnAll(null);
}
// Deletes all markers in the array by removing references to them.
function deleteMarkers() {
	clearMarkers();
	placeMarkers = [];
}

function makeVisible(name) {
	for (var i = 0; i < placeMarkers.length; i++) {
		if(placeMarkers[i].title === name) {
			placeMarkers[i].setVisible(true);
		}
	}
}

function infoWindow(name, infowindow) {
	for (var i = 0; i < placeMarkers.length; i++) {
		if(placeMarkers[i].title === name) {
			if(placeMarkers[i] == infowindow.marker) {
				console.log("This infowindow is already on this marker!");
			} else {
            	getYelpDetails(placeMarkers[i], infowindow);
            };
        };
    };
}


// This function takes in a color and creates a new marker icon of that color
// Icon will be 21px wide by 34 px high, have an origin of 0, 0 and anchored at 10, 34
function makeMarkerIcon(markerColor) {
    var markerImage = new google.maps.MarkerImage(
        'http://chart.googleapis.com/chart?chst=d_map_spin&chld=1.15|0|'+ markerColor +
        '|40|_|%E2%80%A2',
        new google.maps.Size(21, 34),
        new google.maps.Point(0, 0),
        new google.maps.Point(10, 34),
        new google.maps.Size(21,34));
    return markerImage;
}


// Generate the oauth token to use
function nonce_generate() {
    return (Math.floor(Math.random() * 1e12).toString());
}

function getYelp(place) {
	var deferred = $.Deferred();
	var bounds = map.getBounds();
	var ne_latlng = bounds.getNorthEast();
	var sw_latlng = bounds.getSouthWest();
    var YELP_URL = "https://api.yelp.com/v2/search/?";

	hideMarkers(placeMarkers);

    var parameters = {
    	oauth_consumer_key: YELP_KEY,
    	oauth_token: YELP_TOKEN,
    	oauth_signature_method: 'HMAC-SHA1',
    	oauth_timestamp: Math.floor(Date.now()/1000),
    	oauth_nonce: nonce_generate(),
    	oauth_version: '1.0',
    	callback: 'cb',
    	term: place,
		bounds: sw_latlng.lat() + ',' + sw_latlng.lng() +
			'|' + ne_latlng.lat() + ',' + ne_latlng.lng()
    }

	var encodedSignature = oauthSignature.generate('GET', YELP_URL, parameters, YELP_KEY_SECRET, YELP_TOKEN_SECRET);
	
	parameters.oauth_signature = encodedSignature;

	var settings = {
		url: YELP_URL,
		data: parameters,
		cache: true,
		dataType: 'jsonp',
		success: function(response) {
	        deferred.resolve(response.businesses);
		},
		error: function() {
			document.getElementById('error').innerHTML = "There was an issue retrieving results";
		}
	};

	$.ajax(settings);

	return deferred.promise();
}


// This function creates markers for each place found in either places search
function createMarker(place) {
    // Create a new google latlng for marker
    var latlng = new google.maps.LatLng(place.location.coordinate.latitude, 
    	place.location.coordinate.longitude);
    

    var marker = new google.maps.Marker({
        map: map,
        title: place.name,
        position: latlng,
        icon: defaultIcon,
        animation: google.maps.Animation.DROP,
        id: place.id
    });

    // If a marker is clicked, do a place details search on it in the next function
    marker.addListener('click', function() {
        if (placeInfoWindow.marker == this) {
            console.log("This infowindow is already on this marker!");
        } else {
            // `this` is the marker
            console.log('opening infowindow');
            getYelpDetails(this, placeInfoWindow);
        }
    });
    placeMarkers.push(marker);    
    return marker;
}

// This is the YELP DETAILS search - it's the most detailed so it is only
// executed when a marker is selected, indicating the user wants more details about place
function getYelpDetails(marker, infowindow) {
    makeDefault();
	marker.setIcon(highlightedIcon);

	var YELP_URL = "https://api.yelp.com/v2/business/" + marker.id;
	var parameters = {
    	oauth_consumer_key: YELP_KEY,
    	oauth_token: YELP_TOKEN,
    	oauth_signature_method: 'HMAC-SHA1',
    	oauth_timestamp: Math.floor(Date.now()/1000),
    	oauth_nonce: nonce_generate(),
    	oauth_version: '1.0',
    	callback: 'cb'
    }

	var encodedSignature = oauthSignature.generate('GET', YELP_URL, parameters, YELP_KEY_SECRET, YELP_TOKEN_SECRET);
	
	parameters.oauth_signature = encodedSignature;

	var settings = {
		url: YELP_URL,
		data: parameters,
		cache: true,
		dataType: 'jsonp',
		success: function(place) {
	        infowindow.marker = marker;
            var innerHTML = '<div>';
            if (place.name) {
                innerHTML += '<strong>' + place.name + '</strong><hr>';
            }
            if (place.review_count) {
                innerHTML += place.review_count + ' reviews';
            }
            if (place.rating_img_url) {
                innerHTML += '<br><img src="' + place.rating_img_url + '">';
            }
            if (place.location.address) {
                innerHTML += '<br>' + place.location.address;
            }
            if (place.location.address) {
                innerHTML += '<br>' + place.location.city + ', ' + place.location.state_code;
            }
            if (place.display_phone) {
                innerHTML += '<br>' + place.display_phone;
            }
            if (place.image_url) {
                innerHTML += '<br><br><img src="' + place.image_url + '">';
            }
            innerHTML += '</div>';
            infowindow.setContent(innerHTML);
            infowindow.open(map,marker);
            // Make sure the marker property is cleared if the infowindow is closed
            infowindow.addListener('closeclick', function() {
            	marker.setIcon(defaultIcon);
                infowindow.marker = null;
            });
		},
		error: function() {
            console.log("error");
            infowindow.marker = marker;
			infowindow.setContent("<div>Could not retrieve Yelp data!</div>");
            infowindow.open(map,marker);
		}
	};

	$.ajax(settings);
}




// Each instance of the model is a business returned by Places API call
var Place = function(data) {
	this.name = ko.observable(data.title);
	
	this.infoWindow = function() {
		infoWindow(this.name(), placeInfoWindow);
	}
}

var ViewModel = function() {
	// self always maps to this ViewModel
	var self = this;
	// Stores name of destination user entered
	this.currentDestination = ko.observable('Santa Barbara, CA');
	// Stores the keyword of the current places search
	this.currentPlace = ko.observable('coffee');
	// current list of places returned by textSearchPlaces
	this.placesList = ko.observableArray([]);
	// Current filter value
	this.filter = ko.observable('');
	// Filtered observable array
	this.filteredList = ko.computed(function() {
		var filter = self.filter().toLowerCase();
		if(!filter) {
			return self.placesList();
		} else {
			return ko.utils.arrayFilter(self.placesList(), function(item) {
				if (item.name().toLowerCase().indexOf(filter) > -1){
                    return item.name();
                }
			});
		}
	}, this); 

	// Updates the currentDestination when user enters a new destination
	this.changeDestination = function() {
		// var newDestination = document.getElementById('zoom-to-area-text').value;
		// self.currentDestination(newDestination);
		zoomToArea(this.currentDestination());
	};
	// Updates the currentKeyword when user enters a new interest
	this.changePlaces = function() {
		// Checks if there is a user entered currentDestination 
		if (self.currentDestination() == null) {
			window.alert("Please enter a destination for specific results");
		};
		// Sets a deferred within textSearchPlaces and waits until that is done
		self.currentPlace(this.currentPlace());

		$.when(getYelp(this.currentPlace())).done(function(data){
			self.placesList.removeAll();
			deleteMarkers();

    		var bounds = new google.maps.LatLngBounds();

            google.maps.event.addDomListener(window, 'resize', function() {
                map.fitBounds(bounds); // `bounds` is a `LatLngBounds` object
            });

			data.forEach(function(item){
				var marker = createMarker(item);
				self.placesList.push(new Place(marker));
				bounds.extend(marker.position);
			});
			map.fitBounds(bounds);
		});
	};

	this.filterMarkers = function(){
		// Hides all markers, then unhides filtered list
		makeInvisible();
	    for (var i = 0; i < this.filteredList().length; i++) {
	    	makeVisible(this.filteredList()[i].name());
	    }
	};

}


ko.applyBindings(new ViewModel());
window.onload = populate;
