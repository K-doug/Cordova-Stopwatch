/**
 * TM352-20J Block 3 Part 5 Stopwatch example
 * To function correctly this file must be placed in a Cordova project with camera and geolocation plugins
 * Created by Chris Thomson: 1 Aug 2019
 * Updated by Stephen Rice: 11 Nov 2020
 */

// Execute in strict mode to prevent some common mistakes
"use strict";

// Declare a Stopwatch object for use by the HTML view
var controller;

document.addEventListener("deviceready", onDeviceReady, false);

function onDeviceReady() {
    console.log("Running cordova-" + cordova.platformId + "@" + cordova.version);
    // Create the Stopwatch object for use by the HTML view
    controller = new Stopwatch();
}

// JavaScript "class" containing the model, providing controller "methods" for the HTML view
function Stopwatch() {
    console.log("Creating controller/model");

    // PRIVATE VARIABLES AND FUNCTIONS - available only to code inside the controller/model
    // Note these are declared as function functionName() { ... }

    // Return the number of milliseconds since the UNIX epoch
    function getTime() {
        return new Date().getTime();
    }

    // Convert a time in milliseconds to a string minutes:seconds.hundredths
    function formatTime(milliseconds) {
        var seconds = ((milliseconds / 1000) % 60).toFixed(2);
        var minutes = Math.floor(milliseconds / 1000 / 60);
        return ("0" + minutes).substr(-2) + ":" + ("0" + seconds).substr(-5);
    }

    // Stopwatch state
    var timerInterval;
    var startTime;

    // Calculate elapsed time and display as minutes:seconds.hundredths
    function updateTimer() {
        var milliseconds = getTime() - startTime;
        document.getElementById("stopwatch").innerHTML = formatTime(milliseconds);
    }

    // Map state
    var icon = new H.map.DomIcon("<div>&#x1F3C3;</div>");
    var mapInterval;
    var destination;
    var marker;
    var bubble;

    function updateMap() {
        function onSuccess(position) {
            console.log("Obtained position", position);
            var point = {
                lng: position.coords.longitude,
                lat: position.coords.latitude,
            };

            if (marker) {
                // Remove marker if it already exists
                map.removeObject(marker);
            }

            if (bubble) {
                // Remove bubble if it already exists
                ui.removeBubble(bubble);
            }

            map.setCenter(point);
            marker = new H.map.DomMarker(point, { icon: icon });
            map.addObject(marker);

            // Set destination to position of first marker
            if (destination) {
                bubble = new H.ui.InfoBubble(destination, {
                    content: "<b>You want to get there!</b>",
                });
                ui.addBubble(bubble);
            }
        }

        function onError(error) {
            console.error("Error calling getCurrentPosition", error);
        }

        navigator.geolocation.getCurrentPosition(onSuccess, onError, {
            enableHighAccuracy: true,
        });
    }

    // Update map on startup
    updateMap();

    // HERE Maps code, based on:
    // https://developer.here.com/documentation/maps/3.1.19.2/dev_guide/topics/map-controls-ui.html
    // https://developer.here.com/documentation/maps/3.1.19.2/dev_guide/topics/map-events.html

    // Initialize the platform object:
    var platform = new H.service.Platform({
        // TODO: Change to your own API key or map will NOT work!
        apikey: "5ej74Wx64IYW86Il7Se6gQ",
    });
    // Obtain the default map types from the platform object:
    var defaultLayers = platform.createDefaultLayers();
    // Instantiate (and display) a map object:
    var map = new H.Map(
        document.getElementById("mapContainer"),
        defaultLayers.vector.normal.map,
        {
            zoom: 14,
            center: { lat: 52.5, lng: 13.4 },
        }
    );
    // Create the default UI:
    var ui = H.ui.UI.createDefault(map, defaultLayers);
    var mapSettings = ui.getControl("mapsettings");
    var zoom = ui.getControl("zoom");
    var scalebar = ui.getControl("scalebar");
    mapSettings.setAlignment("top-left");
    zoom.setAlignment("top-left");
    scalebar.setAlignment("top-left");
    // Enable the event system on the map instance:
    var mapEvents = new H.mapevents.MapEvents(map);
    // Instantiate the default behavior, providing the mapEvents object:
    new H.mapevents.Behavior(mapEvents);

    // Add an event listener to set intended destination
    map.addEventListener("tap", function (evt) {
        // Update destination
        destination = map.screenToGeo(
            evt.currentPointer.viewportX,
            evt.currentPointer.viewportY
        );
        // Update map now
        updateMap();
    });

    // PUBLIC FUNCTIONS - available to the view
    // Note these are declared as this.functionName = function () { ... };

    // Controller function for Start button
    this.start = function () {
        // Press Stop to clear existing intervals
        this.stop();

        // Reset display
        startTime = getTime();
        document.getElementById("stopwatch").innerText = "00:00:00";

        // Start new intervals
        timerInterval = setInterval(updateTimer, 100);
        mapInterval = setInterval(updateMap, 10000);

        // Update map now
        updateMap();
    };

    // Controller function for Stop button
    this.stop = function () {
        clearInterval(timerInterval);
        clearInterval(mapInterval);
    };

    // Controller function for Photo button
    this.photo = function () {
        function onSuccess(data) {
            console.log("Obtained picture data");

            if (cordova.platformId === "browser") {
                // Set source of image on the page (plugin returns base64 data on browser platform)
                document.getElementById("image").src = "data:image/jpeg;base64," + data;
            } else {
                // Set source of image on the page
                document.getElementById("image").src = data;
            }

            // Show the image on the page
            document.getElementById("image").style.display = "block";
        }

        function onError(error) {
            console.error("Error calling getPicture", error);
        }

        // Hide the image on the page
        document.getElementById("image").style.display = "none";

        // Call the cordova-plugin-camera API
        navigator.camera.getPicture(onSuccess, onError);
    };
}
