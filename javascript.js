var map = L.map('map').setView([47.5, -122.3], 9);
L.tileLayer('https://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}?access_token={accessToken}', {
    attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
    maxZoom: 18,
    id: 'mapbox/streets-v11',
    tileSize: 512,
    zoomOffset: -1,
    accessToken: 'pk.eyJ1IjoiZW10YWMiLCJhIjoiY2w5ejR0bXZyMGJpbDNvbG5jMTFobGJlZCJ9.UMi2J2LPPuz0qbFaCh0uRA'
}).addTo(map);

var drawnItems = L.featureGroup().addTo(map);

var tableData = L.layerGroup().addTo(map);
var url = "https://gisdb.xyz/sql?q=";
var sqlQuery = "SELECT * FROM mushroom_foraging";
function addPopup(feature, layer) {
    layer.bindPopup(
        "<b>" + feature.properties.variety + "</b><br>" +
        feature.properties.description
    );
}

fetch(url + sqlQuery)
    .then(function(response) {
    return response.json();
    })
    .then(function(data) {
        L.geoJSON(data, {onEachFeature: addPopup}).addTo(tableData);
    });

new L.Control.Draw({
    draw : {
        polygon : false,
        polyline : false,
        rectangle : false,     // Rectangles disabled
        circle : false,        // Circles disabled
        circlemarker : false,  // Circle markers disabled
        marker: true
    },
    edit : {
        featureGroup: drawnItems
    }
}).addTo(map);

function createFormPopup() {
    var popupContent =  
    '	<form>' + 
    '		What mushroom variety was found?<br><input type="text" id="variety"><br>' + 
    '		Attach a photo<br><input type="file" id="photo" onchange="loadFile(event);" accept="image/*" style="display: none;">' + 
    '		<div class="photo">' + 
    '			<label for="photo" style="cursor: pointer;"><span class="fa fa-image"></span></label><br><img id="output" width="200" /><br>' + 
    '		</div>' + 
    '		Provide a brief description of the area.<br><textarea name = "Description" id= "description" rows="5" cols="35"></textarea><br>' + 
    '		What were the surrounding tree species (if any)?<br><input type="text" id="trees"><br>' + 
    '		What were the dominant plant species in the area?<br><input type="text" id="plants"><br>' + 
    '		What has the weather been like in the past few days?<br>' + 
    '		<div class="weather">' + 
    '			<input id="sunny" name="weather" type="radio" value="sunny" class="radio-btn" />' + 
    '			<label for="sunny" >Sunny</label><br>' + 
    '			<input id="cloudy" name="weather" type="radio" value="cloudy" class="radio-btn" />' + 
    '			<label for="cloudy" >Cloudy</label><br>' + 
    '			<input id="rainy" name="weather" type="radio" value="rainy" class="radio-btn" />' + 
    '			<label for="rainy" >Rainy</label><br>' + 
    '			<input id="snowy" name="weather" type="radio" value="snowy" class="radio-btn" />' + 
    '			<label for="snowy" >Snowy</label><br>' + 
    '		</div><br>' + 
    '		What is the current temperature (in degrees fahrenheit)?<br><input type="number" id="temperature"><br>' + 
    '		Rate the quality of this site.<br>' + 
    '		<div class="rating">' + 
    '            <input id="star5" name="star" type="radio" value="5" class="radio-btn hide" />' + 
    '            <label for="star5" ><span class="fa fa-star"></span></label>' + 
    '            <input id="star4" name="star" type="radio" value="4" class="radio-btn hide" />' + 
    '            <label for="star4" ><span class="fa fa-star checked"></span></label>' + 
    '            <input id="star3" name="star" type="radio" value="3" class="radio-btn hide" />' + 
    '            <label for="star3" ><span class="fa fa-star checked"></span></label>' + 
    '            <input id="star2" name="star" type="radio" value="2" class="radio-btn hide" />' + 
    '            <label for="star2" ><span class="fa fa-star checked"></span></label>' + 
    '            <input id="star1" name="star" type="radio" value="1" class="radio-btn hide" />' + 
    '            <label for="star1" ><span class="fa fa-star checked"></span></label>' + 
    '            <div class="clear"></div>' + 
    '		</div>' + 
    '		What is the current date and time?<br><input type="datetime-local" id="date"><br>' + 
    '		<input type="button" value="Submit" id="submit">' + 
    '	</form>'
    drawnItems.bindPopup(popupContent).openPopup();
}

map.addEventListener("draw:created", function(e) {
    e.layer.addTo(drawnItems);
    createFormPopup();
});

function setData(e) {

    if(e.target && e.target.id == "submit") {

        var enteredVariety = document.getElementById("variety").value;
        var enteredImage = document.getElementById("photo").value;
        var enteredDescription = document.getElementById("description").value;
        var enteredTrees = document.getElementById("trees").value;
        var enteredPlants = document.getElementById("plants").value;
        var enteredWeather = document.querySelector('input[name="weather"]:checked').value
        var enteredTemperature = document.getElementById("temperature").value;
        var enteredRating = document.querySelector('input[name="star"]:checked').value
        var enteredDate = document.getElementById("date").value;

        // For each drawn layer
        drawnItems.eachLayer(function(layer) {
           
        // Create SQL expression to insert layer
        var drawing = JSON.stringify(layer.toGeoJSON().geometry);
        var sql =
            "INSERT INTO mushroom_foraging (geom, variety, image, description, trees, plants, weather, temperature, rating, date) " +
            "VALUES (ST_SetSRID(ST_GeomFromGeoJSON('" +
            drawing + "'), 4326), '" +
            enteredVariety + "', '" + 
            enteredImage + "', '" +
            enteredDescription + "', '" +
            enteredTrees + "', '" +
            enteredPlants + "', '" +
            enteredWeather + "', '" +
            enteredTemperature + "', '" +
            enteredRating + "', '" +
            enteredDate + "');";
        console.log(sql);

        // Send the data
        fetch(url + encodeURI(sql))
        .then(function(response) {
            return response.json();
        })
        .then(function(data) {
            console.log("Data saved:", data);
        })
        .catch(function(error) {
            console.log("Problem saving the data:", error);
        });

    // Transfer submitted drawing to the tableData layer 
    //so it persists on the map without you having to refresh the page
    var newData = layer.toGeoJSON();
    newData.properties.variety = enteredVariety;
    newData.properties.description = enteredDescription;
    L.geoJSON(newData, {onEachFeature: addPopup}).addTo(tableData);

});

        // Clear drawn items layer
        drawnItems.closePopup();
        drawnItems.clearLayers();

    }
}

document.addEventListener("click", setData);

map.addEventListener("draw:editstart", function(e) {
    drawnItems.closePopup();
});
map.addEventListener("draw:deletestart", function(e) {
    drawnItems.closePopup();
});
map.addEventListener("draw:editstop", function(e) {
    drawnItems.openPopup();
});
map.addEventListener("draw:deletestop", function(e) {
    if(drawnItems.getLayers().length > 0) {
        drawnItems.openPopup();
    }
});

var loadFile = function(event) {
    var image = document.getElementById('output');
    var file = event.target.files[0];

    image.src = URL.createObjectURL(file);
};
