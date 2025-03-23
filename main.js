
const API ={  asteroid: "iEtTLBumhiw8bLDvxDiPnuYqf3foQlYfWJDPZcmr"}



let previousData = null; // Store the last dataset to prevent redundant updates

async function fetchAllData() {
    const today = new Date().toISOString().split('T')[0]; // Get YYYY-MM-DD

    // Correct API call: Fetch only today’s data
    const asteroidUrl = `https://api.nasa.gov/neo/rest/v1/feed?start_date=${today}&end_date=${today}&api_key=${API.asteroid}`;

    try {
        const response = await fetch(asteroidUrl);
        const newData = await response.json();

        if (!response.ok) throw new Error(`API Error: ${response.statusText}`);

        // Prevent redundant updates
        if (JSON.stringify(newData) !== JSON.stringify(previousData)) {
            console.log("New Asteroid Data:", newData);
            previousData = newData; // Store the latest data
            display_asteroids(newData, today);
        } else {
            console.log("No new asteroid data, skipping update.");
        }
    } catch (error) {
        console.error("Error fetching asteroid data:", error);
    } finally {
        setTimeout(fetchAllData, 300000); // Fetch again in 5 minutes
    }
}

function display_asteroids(data, today) {
    const container = d3.select("#asteroids");
    container.html(""); // Clear old data

    let xPosition = 10;
    const asteroids = data.near_earth_objects[today] || []; // Default to empty array if no data

    container.style("background-color", "black");

    asteroids.forEach(asteroid => {
        console.log("Asteroid:", asteroid.name);
        const estimatedDiameter = asteroid.estimated_diameter.meters;
        const diameterInPixels = estimatedDiameter.estimated_diameter_min; 

        // Main asteroid circle
        container
            .append("div")
            .attr("class", "asteroid")
            .style("width", `${diameterInPixels}px`)
            .style("height", `${diameterInPixels}px`)
            .style("left", `${xPosition}px`)
            .style("position", "absolute")
            .style("background-color", "black")
            .style("border-radius", "50%")
            .style("opacity", "1")
            .attr("title", asteroid.name);

        xPosition += diameterInPixels + 10; 
    });
}

// Run immediately, then every 5 minutes
fetchAllData();


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



//code for a different iteration conceptually
// function lookalikesDataFetcher(){
//     const marsUrl = `https://api.nasa.gov/mars-photos/api/v1/rovers/curiosity/photos?earth_date=2025-3-16&api_key=${API.asteroid}`;
//     fetch(marsUrl)
//     .then(response => response.json())
//     .then(data => {
//         console.log("Mars data:", data);
//         lookalikes(data)
//     })
//     .catch(error => {
//         console.error("Error fetching data:", error);
//     });


// }
// lookalikesDataFetcher()

// console.log(lookalikesDataFetcher());
// function lookalikes(mars_data){
    
//     const container2 = d3.select("#earth_lookalikes");
//     mars_data.photos.forEach(photo => {
        
//         const img = document.createElement("img");
//         img.src = photo.img_src;
//         const text = document.createElement("p");
//         text.textContent = photo.rover.name;
//         container2
//         .append("div")
//         .attr("class", "mars-photo-container") // A class for styling if needed
//         .append("img")
//         .attr("src", photo.img_src)
//         .attr("alt", `Mars photo taken by ${photo.rover.name}`)
//         .style("width", "200px") // Adjust width as needed
//         .style("height", "auto") // Maintain aspect ratio
//         .append(() => text);
     
  

    

// }  )}

