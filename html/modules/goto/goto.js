$(document).ready(function() {

    // All regions are possible
    var availableRegionsJSON = [];
    var availableRegions = [];
    var selectedValue = "region";

    var availableCoverageIDs = [];

    $.ajax({
        type: "GET",
        url: ps2EndPoint + "html/data/region-goto.json",
        data: "{dataset: 'CRISM'}", // it will query later on database with dataset
        cache: false,
        async: false,
        success: function(data) {
            availableRegionsJSON = data;
            for (var i = 0; i < availableRegionsJSON.length; i++) {
                availableRegions.push(availableRegionsJSON[i].name);
            }

            console.log(availableRegions);
        }
    });

    // default load auto suggestion for region
    $(function() {
        loadAutoCompleteRegion();
    });


    // Handle event when select dropdownGoto
    $("#dropdownGoto").change(function () {
        // get the option value
        var value = this.value;
        if (value === "region") {
            // load the autocomple text on the text box for "region"
            loadAutoCompleteRegion();
            selectedValue = "region";
        } else if (value === "coverageID") {
            // load the autocomple text on the text box for "coverageID"
            // check if all the footprints's IDs were loaded to an array for auto complete

            if (availableCoverageIDs.length === 0) {
                // All footprints are possible
                for (var i = 0; i < allFootPrintsArray.length; i++) {
                    availableCoverageIDs.push(allFootPrintsArray[i].coverageID);
                }

                console.log("Loaded footprints's IDs for autocomplete: " + availableCoverageIDs.length);
            }

            // then load the footprint's IDs from the input text
            loadAutoCompleteCoverageID();
            selectedValue = "coverageID";
        } else {
            // lat,long goto
            loadAutoCompleteLatLong();
            selectedValue = "latlon";
        }
    });

    // Get the range when scroll
    $('body').bind('mousewheel', function(e) {
        if (e.originalEvent.wheelDelta / 120 > 0) {
            updateRange();
        } else {
            updateRange();
        }
    });


    function loadAutoCompleteRegion() {
        /* add goto regions search */
        $("#txtGoto").autocomplete({
            // Only get top 10 result for faster response
            minLength: 0, // need to show regions when focus
            source: function(request, response) {
                var results = $.ui.autocomplete.filter(availableRegions, request.term);
                response(results.slice(0, 10));
            }
        }).focus(function() {
            // Get all regions when focus on
            $(this).autocomplete("search", "");
        });

        $("#txtGoto").val("");
    }

    function loadAutoCompleteCoverageID() {
        /* add coverageID suggestion */
        $("#txtGoto").autocomplete({
            // Only get top 10 result for faster response
            source: function(request, response) {
                var results = $.ui.autocomplete.filter(availableCoverageIDs, request.term);
                response(results.slice(0, 10));
            }
        });

        $("#txtGoto").val("");
    }

    function loadAutoCompleteLatLong() {
        $("#txtGoto").autocomplete({
            // clear the auto complete on text box
            source: function(request, response) {
                var results = "";
                response(results);
            }
        });

        $("#txtGoto").val("");
    }


    // Handle button goto
    $("#btnGoto").on("click", function() {
        if (selectedValue === "region") {
            // goto region
            gotoRegion();
        } else if (selectedValue === "coverageID") {
            // goto coverageID
            gotoCoverageID();
        } else {
            // goto latlong
            gotoLatLon();
        }
    });


    // goto region to allow goto coverageID or (Latitude and Longitude)
    function gotoRegion() {
        var region = $("#txtGoto").val();
        // User want to go to region
        if (region !== "") {
            for (var i = 0; i < availableRegionsJSON.length; i++) {
                if (availableRegionsJSON[i].name == region) {
                    // Move to region
                    moveToFootPrint(availableRegionsJSON[i].latitude, availableRegionsJSON[i].longitude);
                    makeLinkGoTo("", availableRegionsJSON[i].latitude, availableRegionsJSON[i].longitude);
                    return true;
                }
            }
        }
        alert("You need to choose existing region on globe.");
        return false;
    }

    // goto CoverageID to allow goto CoverageID
    function gotoCoverageID() {
        var coverageID = $("#txtGoto").val();

        if (coverageID !== "") {
            moveToCoverageID(coverageID);

            makeLinkGoTo(coverageID, "", "");
            return true;
        }
        alert("Please type existing coverage name on globe.");
        return false;
    }

    // goto Latitude, Longitude to allow goto Latitude and Longitude (lat,lon)
    function gotoLatLon() {
        var latlon = $("#txtGoto").val().split(",");
        var latitude = latlon[0];
        var longitude = latlon[1];

        if (checkLatitude(latitude) && checkLongitude(longitude)) {
            moveToFootPrint(latitude, longitude);

            makeLinkGoTo("", latitude, longitude);
            return true;
        }
        alert("Please type valid Latitude,Longitude (e.g: 20.5,120.5)");
        return false;
    };


    /* Get the latitude, longitude of region/coverageID or manual latitude, longitude to goto */
    function makeLinkGoTo(coverageID, latitude, longitude) {
        // Generate a link to access to coverageID and/or Latitude and Longitude
        var link = ps2EndPoint + "index.html?";
        if (coverageID != "") {
            link = link + "covName=" + coverageID;
        }
        if (latitude != "" && longitude != "") {
            link = link + "&lat=" + latitude;
            link = link + "&lon=" + longitude;
        }

        // keep the current of range
        link = link + "&range=" + wwd.navigator.range;

        // add to goto panel
        $("#linkGoTo").attr("href", link);
        $("#linkGoTo").text(link);
    }


    // Check if latitude, longitude is valid
    function checkLatitude(latitude) {
        val = parseFloat(latitude);
        if (isNaN(latitude) || latitude === "") {
            alert("Latitude must be float value!");
            return false;
        } else if (latitude > 90 || latitude < -90) {
            alert("Latitude must be between (-90:90) degree.");
            return false;
        }
        return true;
    }

    function checkLongitude(longitude) {
        val = parseFloat(longitude);
        if (isNaN(longitude) || longitude === "") {
            alert("Longitude must be float value!");
            return false;
        } else if (longitude > 180 || longitude < -180) {
            alert("Longitude must be between (-180:180) degree.");
            return false;
        }
        return true;
    }


    // Get the center of coordinate and move to this footprint
    function moveToCoverageID(coverageID) {
        for (var i = 0; i < allFootPrintsArray.length; i++) {
            if (coverageID.toLowerCase() === allFootPrintsArray[i].coverageID.toLowerCase()) {
                var centerLatitude = (allFootPrintsArray[i].Maximum_latitude + allFootPrintsArray[i].Minimum_latitude) / 2;
                var centerLongitude = (allFootPrintsArray[i].Easternmost_longitude + allFootPrintsArray[i].Westernmost_longitude) / 2;
                moveToFootPrint(centerLatitude, centerLongitude);
                return;
            }
        }

        alert("Coverage Name: " + coverageID + " does not exist.");
    }

    // Move to latitude, longitude coordinate
    function moveToFootPrint(latitude, longitude) {
        // Keep the user current zoom
        //wwd.navigator.range = 2e6;
        wwd.goTo(new WorldWind.Location(latitude, longitude));

        // Put placemark, remove the last clicked point
        if (placemarkLayer != null) {
            wwd.removeLayer(placemarkLayer);
        }

        var placemark = new WorldWind.Placemark(new WorldWind.Position(latitude, longitude, 1e2), true, null);
        var placemarkAttributes = new WorldWind.PlacemarkAttributes(placemarkAttributes);
        placemarkAttributes.imageSource = "html/images/close.png";
        placemark.attributes = placemarkAttributes;

        placemarkLayer = new WorldWind.RenderableLayer("Placemarks");
        placemarkLayer.addRenderable(placemark);

        wwd.insertLayer(4, placemarkLayer);
    }


    // Update range in link of goto panel when scroll
    function updateRange() {
        var range = wwd.navigator.range;
        var linkText = $("#linkGoTo").text();

        //console.log(linkText);

        var tmp = "";
        // If user has not clicked on map and scroll
        if (linkText.indexOf("range") < 0) {
            tmp = ps2EndPoint + "index.html?range=" + range;
        } else {
            // update the new range
            var startIndex = linkText.lastIndexOf("=");

            tmp = linkText.substr(0, startIndex + 1);
            tmp = tmp + range;
        }

        // Set the new range to link
        $("#linkGoTo").text(tmp);
        $("#linkGoTo").attr("href", tmp);
    }
});