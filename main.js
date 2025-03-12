
const API ={ satellite: "iEtTLBumhiw8bLDvxDiPnuYqf3foQlYfWJDPZcmr", flight: "33235ba0527c53e9bf0f37a80df07f10", asteroid: "iEtTLBumhiw8bLDvxDiPnuYqf3foQlYfWJDPZcmr"}


//Pseudocode:
//1. Fetch satellite data, flight data, and asteroid data from respective apis
//2. convert data into json in satelliteData, flightData, and asteroidData
//3. filter out inactive satellites, flights, and asteroids
//4. get the coordinates
//5. display active satellites, flights, and asteroids that are currently moving, in real time according to their locations(X and Y)


async function fetchAllData() {
// Fetch asteroid data from NASA using the global API key for asteroid
const asteroidUrl = `https://api.nasa.gov/neo/rest/v1/feed?start_date=2025-03-11&end_date=2025-03-11&api_key=${API.asteroid}`;
    
// Fetch flight data using the global API key for flight
const flightUrl = `https://api.aviationstack.com/v1/flights?access_key=${API.flight}`;

// Fetch satellite data using the global API key for satellite
const satelliteUrl = `https://sscweb.gsfc.nasa.gov/WS/sscr/2/api_key=${API.satellite}`;

    try {
        // Fetch asteroid data
        const asteroidResponse = await fetch(asteroidUrl);
        const asteroidData = await asteroidResponse.json();
        console.log("Asteroids:", asteroidData);

        // display today's data on screen
        display_asteroids(asteroidData);
       
    } catch (error) {
        console.error("Error fetching data:", error);
    }
}

// Call the function to fetch and display data
fetchAllData();

// Function to display asteroids as circles
function display_asteroids(data) {
    var  xPosition = 10; // Initial x position for first asteroid
    const asteroids = data.near_earth_objects['2025-03-11'];
    
    // Add a container div if necessary
    const container = d3.select("#asteroids");
    // Loop through each asteroid and display it as a circle using D3.js
    asteroids.forEach(asteroid => {
        const estimatedDiameter = asteroid.estimated_diameter.meters;
        const diameterInPixels = estimatedDiameter.estimated_diameter_min ; // Scale down diameter for visibility
        console.log("Diameter:", diameterInPixels);
        // Create a new circle element for each asteroid
        container
        .append("div")
        .attr("class", "asteroid")
        .style("width", `${diameterInPixels}px`)
        .style("height", `${diameterInPixels}px`)
        .style("left", `${xPosition}px`) // Set left position for horizontal layout
        .attr("title", asteroid.name); // Add asteroid name as title

    // Increase xPosition for next asteroid, adding a gap between them
        xPosition += diameterInPixels + 10; // Add a 10px gap between asteroids
        });
}








function xmlToJson(xml) {
    let obj = {};

    // Check if XML is an element node (i.e., not text)
    if (xml.nodeType === 1) { 
        // If the element has attributes, add them to the JSON object
        if (xml.attributes.length > 0) {
            obj["@attributes"] = {};
            for (let i = 0; i < xml.attributes.length; i++) {
                const attribute = xml.attributes.item(i);
                obj["@attributes"][attribute.nodeName] = attribute.nodeValue;
            }
        }
    } else if (xml.nodeType === 3) { // Text node
        obj = xml.nodeValue;
    }

    // Process child nodes (recursively)
    if (xml.hasChildNodes()) {
        for (let i = 0; i < xml.childNodes.length; i++) {
            const item = xml.childNodes.item(i);
            const nodeName = item.nodeName;
            if (typeof obj[nodeName] === "undefined") {
                obj[nodeName] = xmlToJson(item);  // Recursively process children
            } else {
                if (typeof obj[nodeName].push === "undefined") {
                    const old = obj[nodeName];
                    obj[nodeName] = [];
                    obj[nodeName].push(old);
                }
                obj[nodeName].push(xmlToJson(item));  // Push multiple elements of the same name
            }
        }
    }
    return obj;
}
