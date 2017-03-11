// Global map variable
var map;

// Global placemarkers array to use in multiple functions to have control
// over the number of places that show
var placeMarkers = [];


// Utility function

var stringStartsWith = function(string, startsWith) {          
    string = string || "";
    if (startsWith.length > string.length)
        return false;
    return string.substring(0, startsWith.length) === startsWith;
};



// MOVE: into viewModel
function initMap() {
	console.log('initMap');
	// Create a map object and display it in the div of id="map"
	map = new google.maps.Map(document.getElementById('map'), {
		center: {lat:37.09024, lng:-95.712891},
		scrollwheel: false,
		mapTypeControl: false,
		// `styles` variable contained in map-style.js
		styles: styles,
		zoom: 4
	});

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

function zoomToArea() {
    // Initialize the geocoder
    var geocoder = new google.maps.Geocoder();
    // Gets the destination that the user entered and sets it to the global variable
    var destination = document.getElementById('zoom-to-area-text').value;
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



// This function fires when the user selects "go" on the places search
// It will do a nearby search using the entered query string or place
function textSearchPlaces() {
	var deferred = $.Deferred();
    var bounds = map.getBounds();
    hideMarkers(placeMarkers);
    var placesService = new google.maps.places.PlacesService(map);
    placesService.textSearch({
        query: document.getElementById('places-search').value,
        bounds: bounds
    }, function(results, status) {
        if (status === google.maps.places.PlacesServiceStatus.OK) {
        	deferred.resolve(results);
            //createMarkersForPlaces(results);
        }
    });
    return deferred.promise();
}

// This function creates markers for each place found in either places search
function createMarkersForPlaces(places) {
	deleteMarkers();
	console.log(placeMarkers);
    var bounds = new google.maps.LatLngBounds();
    for (var i = 0; i < places.length; i++) {
        var place = places[i];
        var icon = {
            url: place.icon,
            size: new google.maps.Size(35, 35),
            origin: new google.maps.Point(0, 0),
            anchor: new google.maps.Point(15, 34),
            scaledSize: new google.maps.Size(25, 25)
        };
        // Create a marker for each place
        var marker = new google.maps.Marker({
            map: map,
            icon: icon,
            title: place.name,
            position: place.geometry.location,
            id: place.place_id
        });
        // Create a single infowindow to be used with the place details information 
        // so that only one is open at once
        var placeInfoWindow = new google.maps.InfoWindow();
        // If a marker is clicked, do a place details search on it in the next function
        marker.addListener('click', function() {
            if (placeInfoWindow.marker == this) {
                console.log("This infowindow is already on this marker@!");
            } else {
                // `this` is the marker
                console.log('opening infowindow');
                getPlacesDetails(this, placeInfoWindow);
            }
        });
        placeMarkers.push(marker);
        if (place.geometry.viewport) {
            // Only geocodes have viewport
            bounds.union(place.geometry.viewport);
        } else {
            bounds.extend(place.geometry.location);
        }
    }
    map.fitBounds(bounds);
}




// This is the PLACES DETAILS search - it's the most detailed so it is only
// executed when a marker is selected, indicating the user wants more details about place
function getPlacesDetails(marker, infowindow) {
    var service = new google.maps.places.PlacesService(map);
    service.getDetails({
        placeId: marker.id
    }, function(place, status) {
        if (status === google.maps.places.PlacesServiceStatus.OK) {
            // Set the marker property on this infowindow so it isn't created again
            infowindow.marker = marker;
            var innerHTML = '<div>';
            if (place.name) {
                innerHTML += '<strong>' + place.name + '</strong>';
            }
            if (place.formatted_address) {
                innerHTML += '<br>' + place.formatted_address;
            }
            if (place.formatted_phone_number) {
                innerHTML += '<br>' + place.formatted_phone_number;
            }
            if (place.opening_hours) {
                innerHTML += '<br><br><strong>Hours:</strong><br>' +
                    place.opening_hours.weekday_text[0] + '<br>' +
                    place.opening_hours.weekday_text[1] + '<br>' +
                    place.opening_hours.weekday_text[2] + '<br>' +
                    place.opening_hours.weekday_text[3] + '<br>' +
                    place.opening_hours.weekday_text[4] + '<br>' +
                    place.opening_hours.weekday_text[5] + '<br>' +
                    place.opening_hours.weekday_text[6];
            }
            if (place.photos) {
                innerHTML += '<br><br><img src="' + place.photos[0].getUrl(
                    {maxHeight: 100, maxWidth: 200}) + '">';
            }
            innerHTML += '</div>';
            infowindow.setContent(innerHTML);
            infowindow.open(map, marker);
            // Make sure the marker property is cleared if the infowindow is closed
            infowindow.addListener('closeclick', function() {
                infowindow.marker = null;
            });
        }
    });
}






// Each instance of the model is a business returned by Places API call
var Place = function(data) {
	this.name = ko.observable(data.name);
}

var ViewModel = function() {
	console.log('ViewModel');
	// self always maps to this ViewModel
	var self = this;
	// Stores name of destination user entered
	this.currentDestination = ko.observable();
	// Stores the keyword of the current places search
	this.currentPlace = ko.observable();
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
				return stringStartsWith(item.name().toLowerCase(), filter);
			});
		}
	}, this); 

	// Updates the currentDestination when user enters a new destination
	this.changeDestination = function() {
		var newDestination = document.getElementById('zoom-to-area-text').value;
		self.currentDestination(newDestination);
		zoomToArea();
	};
	// Updates the currentKeyword when user enters a new interest
	this.changePlaces = function() {
		// Checks if there is a user entered currentDestination 
		if (self.currentDestination() == null) {
			window.alert("Please enter a destination for specific results");
		};
		var newPlaces = document.getElementById('go-places').value;
		// Sets a deferred within textSearchPlaces and waits until that is done
		self.currentPlace(newPlaces);
		$.when(textSearchPlaces()).done(function(data){
			// Clears the observable
			self.placesList.removeAll();
			// Calls function to create markers
			createMarkersForPlaces(data);
			data.forEach(function(item){
				self.placesList.push(new Place(item));
			});
		});
	};

	this.filterMarkers = function(){
		makeInvisible();
	    //e.keyCode === 13 && that.search(); 
	    for (var i = 0; i < this.filteredList().length; i++) {
	    	makeVisible(this.filteredList()[i].name());
	    }
	};


}


ko.applyBindings(new ViewModel());



