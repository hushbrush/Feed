// API key and data
const API = { asteroid: "iEtTLBumhiw8bLDvxDiPnuYqf3foQlYfWJDPZcmr" };

// Solar system state
const solarSystem = {
  asteroids: [],
  planets: [],
  loaded: false,
  container: null,
  ship: {
    x: 0,
    y: 0,
    angle: 0,
    speed: 0,
    maxSpeed: 5,
    acceleration: 0.2,
    deceleration: 0.1,
    rotationSpeed: 5,
    element: null,
  },
  camera: {
    x: 0,
    y: 0,
    scale: 1,
    zoomFactor: 5, // Reduced from 6 to 4 for a slightly wider view
  },
  keys: {
    up: false,
    down: false,
    left: false,
    right: false,
  },
  earthPosition: {
    x: 0,
    y: 0,
  },
  constants: {
    MIN_DISTANCE: 15000, // Reduced minimum distance
    MAX_DISTANCE: 100000000, // Reduced maximum distance to bring asteroids closer
    ORBIT_SEGMENTS: 100,
    ANIMATION_INTERVAL: 16, // ~60 FPS
    EARTH_SIZE: 60,
    TOOLTIP_DELAY: 500,
    SHIP_ON_EARTH: true, // Start with ship on Earth
  },
  tooltip: null,
  infoPanel: null,
  tooltipTimeout: null,
};

// Position ship over Earth
function positionShipOnEarth() {
  if (!solarSystem.constants.SHIP_ON_EARTH) return;

  const earthSize = solarSystem.constants.EARTH_SIZE * 2;
  const shipSize = 32; // Match the CSS size

  // Position ship at the top center of Earth
  const containerRect = solarSystem.container.getBoundingClientRect();
  const earthCenterX = containerRect.width / 2;
  const earthCenterY = containerRect.height / 2;

  solarSystem.ship.x = earthCenterX;
  solarSystem.ship.y = earthCenterY - earthSize / 2 + shipSize / 4; // Position near top of Earth
  solarSystem.ship.angle = 0; // Point up

  updateShipPosition();
}

// Initialize the solar system
async function initSolarSystem() {
  // Set up container
  solarSystem.container = document.getElementById("solar-system");

  // Create loading indicator
  const loading = document.createElement("div");
  loading.className = "loading";
  loading.innerHTML = "<span>Loading Solar System...</span>";
  solarSystem.container.appendChild(loading);

  // Setup tooltip
  solarSystem.tooltip = document.createElement("div");
  solarSystem.tooltip.className = "tooltip";
  solarSystem.container.appendChild(solarSystem.tooltip);

  // Setup info panel
  solarSystem.infoPanel = document.createElement("div");
  solarSystem.infoPanel.className = "info-panel";
  solarSystem.infoPanel.textContent = "Use arrow keys to navigate";
  solarSystem.container.appendChild(solarSystem.infoPanel);

  // Set up navigation ship
  setupNavShip();


  // Set up keyboard controls
  setupControls();

  // Load data
  try {
    await Promise.all([loadPlanetsData(), loadAsteroidData()]);

    // Remove loading indicator
    solarSystem.container.removeChild(loading);

    // Build the solar system
    createSolarSystem();

    // Position ship on Earth
    positionShipOnEarth();

    // Start game loop
    solarSystem.loaded = true;
    gameLoop();
  } catch (error) {
    console.error("Error initializing solar system:", error);
    loading.innerHTML = "<span>Error loading data. Please refresh.</span>";
  }
}

// Load planets data
async function loadPlanetsData() {
  try {
    const response = await fetch("planets.json");
    const data = await response.json();
    solarSystem.planets = data.celestial_bodies;
    console.log("Planets data loaded:", solarSystem.planets);
  } catch (error) {
    console.error("Error loading planets data:", error);
    throw error;
  }
}
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


// Load asteroid data
let previousData = null;

async function loadAsteroidData() {
  const today = new Date().toISOString().split('T')[0]; // Get YYYY-MM-DD

  // Correct API call: Fetch only today’s data
  const asteroidUrl = `https://api.nasa.gov/neo/rest/v1/feed?start_date=${today}&end_date=${today}&api_key=${API.asteroid}`;

  try {
    const response = await fetch(asteroidUrl);
    const newData = await response.json();

    if (!response.ok) throw new Error(`API Error: ${response.statusText}`);

    // Prevent redundant updates
    if (JSON.stringify(newData) !== JSON.stringify(previousData)) {
      
      previousData = newData; // Store the latest data
      solarSystem.asteroids = newData.near_earth_objects[today];
      console.log("Asteroids data loaded:", solarSystem.asteroids);
    } else {
      console.log("No new asteroid data, skipping update.");
    }
  } catch (error) {
    console.error("Error fetching asteroid data:", error);
  } finally {
    setTimeout(loadAsteroidData, 300000); // Fetch again in 5 minutes
  }
}

// Set up the navigation ship
function setupNavShip() {
  const ship = document.createElement("div");
  ship.className = "nav-ship";

  // Create an img element for the SVG
  const shipImage = document.createElement("img");
  shipImage.src = "assets/ship.svg";
  shipImage.alt = "Spaceship";
  shipImage.style.width = "100%";
  shipImage.style.height = "100%";

  // Add the image to the ship div
  ship.appendChild(shipImage);

  solarSystem.container.appendChild(ship);
  solarSystem.ship.element = ship;

  // Set initial ship position to be at Earth's center
  // The Earth is at the center of the coordinates
  const containerRect = solarSystem.container.getBoundingClientRect();
  solarSystem.ship.x = containerRect.width / 2; // Center of container
  solarSystem.ship.y = containerRect.height / 2; // Center of container

  // Position ship at center of screen (visual position never changes)
  updateShipPosition();
}

// Set up keyboard controls
function setupControls() {
  // Keyboard event listeners
  window.addEventListener("keydown", (e) => {
    switch (e.key) {
      case "ArrowUp":
        solarSystem.keys.up = true;
        break;
      case "ArrowDown":
        solarSystem.keys.down = true;
        break;
      case "ArrowLeft":
        solarSystem.keys.left = true;
        break;
      case "ArrowRight":
        solarSystem.keys.right = true;
        break;
    }
  });

  window.addEventListener("keyup", (e) => {
    switch (e.key) {
      case "ArrowUp":
        solarSystem.keys.up = false;
        break;
      case "ArrowDown":
        solarSystem.keys.down = false;
        break;
      case "ArrowLeft":
        solarSystem.keys.left = false;
        break;
      case "ArrowRight":
        solarSystem.keys.right = false;
        break;
    }
  });
}

// Create the solar system visualization
function createSolarSystem() {
  const containerRect = solarSystem.container.getBoundingClientRect();
  const centerX = containerRect.width / 2;
  const centerY = containerRect.height / 2;

  // Update earth position
  solarSystem.earthPosition = {
    x: centerX,
    y: centerY,
  };

  // Add Earth to the center
  createEarth(centerX, centerY);

  // Create orbits and planets
  createOrbits(centerX, centerY);

  // Create asteroids
  createAsteroids(centerX, centerY);
}

// Create Earth at the center
function createEarth(centerX, centerY) {
  const earthSize = solarSystem.constants.EARTH_SIZE * 2; // Make Earth significantly larger
  const earth = document.createElement("div");
  earth.className = "earth";
  earth.style.width = `${earthSize}px`;
  earth.style.height = `${earthSize}px`;
  earth.style.left = `${centerX - earthSize / 2}px`;
  earth.style.top = `${centerY - earthSize / 2}px`;
  earth.style.backgroundImage =
    "url('https://upload.wikimedia.org/wikipedia/commons/thumb/c/cb/The_Blue_Marble_%28remastered%29.jpg/240px-The_Blue_Marble_%28remastered%29.jpg')";

  earth.addEventListener("mouseover", () => {
    showTooltip(earth, "Earth", centerX, centerY - earthSize / 2 - 20);
  });

  earth.addEventListener("mouseout", () => {
    hideTooltip();
  });

  solarSystem.container.appendChild(earth);
}

// Create orbit circles - with modifications to make them more visible with zoom
function createOrbits(centerX, centerY) {
  // Calculate orbit sizes based on asteroid and planet distances
  const distances = new Set();

  // Add asteroid distances
  solarSystem.asteroids.forEach((asteroid) => {
    const distance = parseFloat(
      asteroid.close_approach_data[0].miss_distance.kilometers
    );
    if (distance <= solarSystem.constants.MAX_DISTANCE) {
      distances.add(distance);
    }
  });

  // Add planet distances
  solarSystem.planets.forEach((planet) => {
    if (
      planet.name !== "Earth" &&
      planet.distance_km <= solarSystem.constants.MAX_DISTANCE
    ) {
      distances.add(planet.distance_km);
    }
  });

  // Sort distances and create orbits - limit the number of orbits for clarity
  const sortedDistances = Array.from(distances).sort((a, b) => a - b);

  // Only show some of the orbits to avoid clutter
  const maxOrbits = 15;
  const orbitsToShow =
    sortedDistances.length <= maxOrbits
      ? sortedDistances
      : sortedDistances.filter(
          (_, i) => i % Math.ceil(sortedDistances.length / maxOrbits) === 0
        );

  orbitsToShow.forEach((distance) => {
    const orbitRadius = distanceToPixels(distance);
    const orbit = document.createElement("div");
    orbit.className = "orbit";
    orbit.style.width = `${orbitRadius * 2}px`;
    orbit.style.height = `${orbitRadius * 2}px`;
    orbit.style.left = `${centerX - orbitRadius}px`;
    orbit.style.top = `${centerY - orbitRadius}px`;
    solarSystem.container.appendChild(orbit);
  });

  // Add planets to their orbits
  solarSystem.planets.forEach((planet) => {
    if (planet.name === "Earth") return; // Skip Earth as it's at the center

    const distance = planet.distance_km;
    if (distance > solarSystem.constants.MAX_DISTANCE) return;

    const orbitRadius = distanceToPixels(distance);
    const diameterInPixels = Math.max(
      10,
      Math.min(30, planet.diameter_km / 500)
    );

    // Create planet at random position on its orbit
    const angle = Math.random() * Math.PI * 2;
    const xPosition = 0 + orbitRadius * Math.cos(angle);
    const yPosition = 0 + orbitRadius * Math.sin(angle);

    const planetElement = document.createElement("div");
    planetElement.className = "planet";
    planetElement.style.width = `${diameterInPixels}px`;
    planetElement.style.height = `${diameterInPixels}px`;
    planetElement.style.left = `${xPosition - diameterInPixels / 2}px`;
    planetElement.style.top = `${yPosition - diameterInPixels / 2}px`;

    planetElement.dataset.distance = distance;
    planetElement.dataset.name = planet.name;

    planetElement.addEventListener("mouseover", () => {
      const tooltip = `${planet.name}\nDistance: ${(distance / 1000000).toFixed(
        2
      )}M km`;
      showTooltip(
        planetElement,
        tooltip,
        xPosition,
        yPosition - diameterInPixels - 20
      );
    });

    planetElement.addEventListener("mouseout", () => {
      hideTooltip();
    });

    solarSystem.container.appendChild(planetElement);
  });
}
function getRandomSize(maxSizeMeters, minSizeMeters) {
    return Math.random() * (maxSizeMeters - minSizeMeters) + minSizeMeters;
}
// Create asteroids on their orbits
function createAsteroids(centerX, centerY) {
  solarSystem.asteroids.forEach((asteroid) => {
    
    const missDistance = parseFloat(
      asteroid.close_approach_data[0].miss_distance.kilometers
    );

    // Skip if outside our range
    if (missDistance > solarSystem.constants.MAX_DISTANCE) return;

    const orbitRadius = distanceToPixels(missDistance);

    
    const minSizeMeters = asteroid.estimated_diameter.meters.estimated_diameter_min;
    const maxSizeMeters = asteroid.estimated_diameter.meters.estimated_diameter_max;

    const diameterInPixels = Math.max(2, Math.min(25, (minSizeMeters)/ 2));

    // Get velocity in km/s for tooltip display
    const velocityKmS = parseFloat(
      asteroid.close_approach_data[0].relative_velocity.kilometers_per_second
    );

    // Get velocity in km/h for animation calculations
    const velocityKmH = parseFloat(
      asteroid.close_approach_data[0].relative_velocity.kilometers_per_hour
    );

    // Create asteroid element
    const asteroidElement = document.createElement("div");
    asteroidElement.className = "asteroid";
    // Add sentry class if it's a sentry object
    if (asteroid.is_sentry_object === true) {
      asteroidElement.classList.add("sentry-object");
    }
    asteroidElement.style.width = `${diameterInPixels}px`;
    asteroidElement.style.height = `${diameterInPixels}px`;

    // Store asteroid data for animation
    asteroidElement.dataset.name = asteroid.name;
    asteroidElement.dataset.distance = missDistance;
    asteroidElement.dataset.velocityKmS = velocityKmS; // Store velocity in km/s for tooltip
    asteroidElement.dataset.orbitRadius = orbitRadius;
    asteroidElement.dataset.centerX = centerX;
    asteroidElement.dataset.centerY = centerY;
    asteroidElement.dataset.diameter = diameterInPixels;
    asteroidElement.dataset.actualDiameter = minSizeMeters; // Store actual size for tooltip
    asteroidElement.dataset.isSentry = asteroid.is_sentry_object; // Store sentry status

    // Create permanent tooltip for the asteroid with more information
    const tooltipElement = document.createElement("div");
    tooltipElement.className = "permanent-tooltip";
    tooltipElement.innerHTML = formatAsteroidTooltip(
      asteroid.name,
      velocityKmS,
      missDistance
    );
    tooltipElement.dataset.tooltipFor = asteroidElement.id =
      "asteroid-" + Math.random().toString(36).substr(2, 9);
    solarSystem.container.appendChild(tooltipElement);

    // Calculate how much of the circle (in radians) the asteroid should move per frame
    // A full circle (2π radians) represents a full day (24 hours)
    // So the velocity determines what fraction of the day is covered per hour
    // Then we adjust for the frame rate (60fps = 3600 frames per hour)
    const radiansPerHour = (2 * Math.PI) / 24; // Base movement: full circle in 24 hours
    const velocityFactor = velocityKmH / 50000; // Scale factor to make velocity differences visible
    const scaledRadiansPerHour = radiansPerHour * (1 + velocityFactor); // Adjust speed based on velocity
    const radiansPerFrame = scaledRadiansPerHour / 3600; // Convert to radians per frame (assuming 60fps)

    asteroidElement.dataset.velocity = radiansPerFrame;

    // Set initial position on orbit based on the time of day from epoch
    const epoch = asteroid.close_approach_data[0].epoch_date_close_approach;
    const date = new Date(epoch);
    const hoursOfDay = date.getUTCHours() + date.getUTCMinutes() / 60;
    const dayProgress = hoursOfDay / 24; // 0 to 1 representing progress through the day

    // Convert to angle in radians (0 to 2π)
    const angle = dayProgress * 2 * Math.PI;
    asteroidElement.dataset.angle = angle;

    // Calculate position
    const xPosition = centerX + orbitRadius * Math.cos(angle);
    const yPosition = centerY + orbitRadius * Math.sin(angle);

    // Set position
    asteroidElement.style.left = `${xPosition - diameterInPixels / 2}px`;
    asteroidElement.style.top = `${yPosition - diameterInPixels / 2}px`;

    solarSystem.container.appendChild(asteroidElement);
  });
}

// Format tooltip text for asteroids
function formatAsteroidTooltip(name, velocity, distance) {
  return `${name}<br>Velocity: ${velocity.toFixed(2)} km/s<br>Distance: ${(
    distance / 1000000
  ).toFixed(2)}M km`;
}

// Convert astronomical distance to pixels for visualization with zoom consideration
function distanceToPixels(distance) {
  const { MIN_DISTANCE, MAX_DISTANCE } = solarSystem.constants;

  // Use log scale for better visualization
  const logMin = Math.log10(MIN_DISTANCE + 1);
  const logMax = Math.log10(MAX_DISTANCE);
  const logDist = Math.log10(distance + 1);

  // Calculate radius proportion (0 to 1)
  const proportion = (logDist - logMin) / (logMax - logMin);

  // Calculate radius in pixels (min 40px, max is 40% of the smaller container dimension)
  const containerRect = solarSystem.container.getBoundingClientRect();
  const maxRadius = Math.min(containerRect.width, containerRect.height) * 0.4;

  // Apply zoom factor to make orbits appear larger
  return (40 + proportion * (maxRadius - 40)) * solarSystem.camera.zoomFactor;
}

// Show tooltip with information
function showTooltip(element, text, x, y) {
    clearTimeout(solarSystem.tooltipTimeout);

    solarSystem.tooltipTimeout = setTimeout(() => {
        solarSystem.tooltip.innerHTML = `<h4>${text}</h4>`;
        solarSystem.tooltip.style.left = `${x}px`;
        solarSystem.tooltip.style.top = `${y}px`;
        solarSystem.tooltip.style.opacity = "1";
    }, solarSystem.constants.TOOLTIP_DELAY);
}

// Hide tooltip
function hideTooltip() {
  clearTimeout(solarSystem.tooltipTimeout);
  solarSystem.tooltip.style.opacity = "0";
}

// Game loop
function gameLoop() {
  if (!solarSystem.loaded) return;

  // Update ship position and rotation based on controls
  updateShip();

  // Update camera to follow ship (keeps ship centered)
  updateCamera();

  // Update all celestial bodies
  updateAsteroids();
  updateElementPositions();

  // Update info panel
  updateInfoPanel();

  // Request next frame
  requestAnimationFrame(gameLoop);
}

// Update ship position and rotation based on controls
function updateShip() {
  const prevX = solarSystem.ship.x;
  const prevY = solarSystem.ship.y;

  // Update rotation
  if (solarSystem.keys.left) {
    solarSystem.ship.angle -= solarSystem.ship.rotationSpeed;
  }
  if (solarSystem.keys.right) {
    solarSystem.ship.angle += solarSystem.ship.rotationSpeed;
  }

  // Update speed
  if (solarSystem.keys.up) {
    solarSystem.ship.speed = Math.min(
      solarSystem.ship.maxSpeed,
      solarSystem.ship.speed + solarSystem.ship.acceleration
    );
    // When we start moving, ship is no longer on Earth
    solarSystem.constants.SHIP_ON_EARTH = false;
  } else if (solarSystem.keys.down) {
    solarSystem.ship.speed = Math.max(
      -solarSystem.ship.maxSpeed / 2,
      solarSystem.ship.speed - solarSystem.ship.acceleration
    );
    // When we start moving, ship is no longer on Earth
    solarSystem.constants.SHIP_ON_EARTH = false;
  } else {
    // Apply deceleration when no keys are pressed
    if (solarSystem.ship.speed > 0) {
      solarSystem.ship.speed = Math.max(
        0,
        solarSystem.ship.speed - solarSystem.ship.deceleration
      );
    } else if (solarSystem.ship.speed < 0) {
      solarSystem.ship.speed = Math.min(
        0,
        solarSystem.ship.speed + solarSystem.ship.deceleration
      );
    }
  }

  // Update position
  const radians = (solarSystem.ship.angle * Math.PI) / 180;

  // If ship is still on Earth, keep it positioned there
  if (solarSystem.constants.SHIP_ON_EARTH) {
    // Position ship on Earth's surface
    const containerRect = solarSystem.container.getBoundingClientRect();
    solarSystem.ship.x = containerRect.width / 2;
    solarSystem.ship.y = containerRect.height / 2;
  } else {
    // Normal movement physics
    solarSystem.ship.x += Math.sin(radians) * solarSystem.ship.speed;
    solarSystem.ship.y -= Math.cos(radians) * solarSystem.ship.speed;
  }

  // Update visual position and rotation
  updateShipPosition();
}

// Update ship's DOM element
function updateShipPosition() {
  if (!solarSystem.ship.element) return;

  // Ship stays fixed at the center of the screen
  const containerRect = solarSystem.container.getBoundingClientRect();
  const screenCenterX = containerRect.width / 2;
  const screenCenterY = containerRect.height / 2;

  // Only update rotation, position is always center of screen
  solarSystem.ship.element.style.transform = `translate(-50%, -50%) rotate(${solarSystem.ship.angle}deg)`;
  solarSystem.ship.element.style.left = `${screenCenterX}px`;
  solarSystem.ship.element.style.top = `${screenCenterY}px`;
}

// Update asteroids' positions based on time
function updateAsteroids() {
  const asteroidElements = document.querySelectorAll(".asteroid");
  const containerRect = solarSystem.container.getBoundingClientRect();
  const viewportBuffer = 100; // Extra buffer beyond viewport to keep asteroids active

  asteroidElements.forEach((asteroidElement) => {
    // Get asteroid data
    const orbitRadius = parseFloat(asteroidElement.dataset.orbitRadius);
    const centerX = parseFloat(asteroidElement.dataset.centerX);
    const centerY = parseFloat(asteroidElement.dataset.centerY);
    const diameter = parseFloat(asteroidElement.dataset.diameter);
    const velocity = parseFloat(asteroidElement.dataset.velocity);

    // Update angle
    let angle = parseFloat(asteroidElement.dataset.angle);
    angle = (angle + velocity) % (Math.PI * 2);
    asteroidElement.dataset.angle = angle;

    // Calculate new position
    const xPosition = centerX + orbitRadius * Math.cos(angle);
    const yPosition = centerY + orbitRadius * Math.sin(angle);

    // Apply camera offset
    const screenX = xPosition - solarSystem.camera.x;
    const screenY = yPosition - solarSystem.camera.y;

    // Check if asteroid is within viewport (plus buffer)
    const isVisible =
      screenX >= -viewportBuffer &&
      screenX <= containerRect.width + viewportBuffer &&
      screenY >= -viewportBuffer &&
      screenY <= containerRect.height + viewportBuffer;

    // Only update visible asteroids for performance
    if (isVisible) {
      asteroidElement.style.display = "block";
      asteroidElement.style.left = `${screenX - diameter / 2}px`;
      asteroidElement.style.top = `${screenY - diameter / 2}px`;

      // Update permanent tooltip position - position it to the right of the asteroid
      const tooltip = document.querySelector(
        `.permanent-tooltip[data-tooltip-for="${asteroidElement.id}"]`
      );
      if (tooltip) {
        tooltip.style.display = "block";
        // Position tooltip to the right of the asteroid with a small gap
        tooltip.style.left = `${screenX + diameter + 10}px`;
        tooltip.style.top = `${
          screenY - tooltip.offsetHeight / 2 + diameter / 2
        }px`;
        // Reset transform that was centering it above
        tooltip.style.transform = "none";
      }
    } else {
      asteroidElement.style.display = "none";

      // Hide tooltip when asteroid is not visible
      const tooltip = document.querySelector(
        `.permanent-tooltip[data-tooltip-for="${asteroidElement.id}"]`
      );
      if (tooltip) {
        tooltip.style.display = "none";
      }
    }
  });
}

// Update camera position to follow ship
function updateCamera() {
  // Camera is always centered on the ship
  // Calculate camera position based on ship's position
  const containerRect = solarSystem.container.getBoundingClientRect();
  const screenCenterX = containerRect.width / 2;
  const screenCenterY = containerRect.height / 2;

  // Calculate camera offset to keep ship centered
  solarSystem.camera.x = solarSystem.ship.x - screenCenterX;
  solarSystem.camera.y = solarSystem.ship.y - screenCenterY;

  // Update positions of all elements based on camera
  updateElementPositions();
}

// Update all element positions based on camera offset
function updateElementPositions() {
  // Update Earth position
  const earth = document.querySelector(".earth");
  if (earth) {
    const earthSize = solarSystem.constants.EARTH_SIZE * 2; // Match the size used in createEarth
    const screenX = solarSystem.earthPosition.x - solarSystem.camera.x;
    const screenY = solarSystem.earthPosition.y - solarSystem.camera.y;

    earth.style.left = `${screenX - earthSize / 2}px`;
    earth.style.top = `${screenY - earthSize / 2}px`;
  }

  // Update planets position
  const planets = document.querySelectorAll(".planet");
  planets.forEach((planet) => {
    const left = parseFloat(planet.style.left) + planet.offsetWidth / 2;
    const top = parseFloat(planet.style.top) + planet.offsetHeight / 2;

    // Convert to world coordinates, then back to screen with camera offset
    const worldX = left + solarSystem.camera.x;
    const worldY = top + solarSystem.camera.y;

    // Calculate new screen position
    const screenX = worldX - solarSystem.camera.x;
    const screenY = worldY - solarSystem.camera.y;

    planet.style.left = `${screenX - planet.offsetWidth / 2}px`;
    planet.style.top = `${screenY - planet.offsetHeight / 2}px`;
  });

  // Update orbits position
  const orbits = document.querySelectorAll(".orbit");
  orbits.forEach((orbit) => {
    const width = parseFloat(orbit.style.width);
    const radius = width / 2;

    const worldX = solarSystem.earthPosition.x;
    const worldY = solarSystem.earthPosition.y;

    const screenX = worldX - solarSystem.camera.x;
    const screenY = worldY - solarSystem.camera.y;

    orbit.style.left = `${screenX - radius}px`;
    orbit.style.top = `${screenY - radius}px`;
  });
}

// Update the info panel with current data
function updateInfoPanel() {
  // Calculate distance from Earth
  const dx = solarSystem.ship.x - solarSystem.earthPosition.x;
  const dy = solarSystem.ship.y - solarSystem.earthPosition.y;
  const pixelDistance = Math.sqrt(dx * dx + dy * dy);

  // Find the closest visible asteroid to use as reference
  let closestAsteroid = null;
  let closestDistance = Infinity;

  const asteroidElements = document.querySelectorAll(".asteroid");
  asteroidElements.forEach((asteroid) => {
    if (asteroid.style.display === "none") return;

    // Get the asteroid's screen position
    const asteroidX =
      parseFloat(asteroid.style.left) + asteroid.offsetWidth / 2;
    const asteroidY =
      parseFloat(asteroid.style.top) + asteroid.offsetHeight / 2;

    // Get the ship's screen position (center of screen)
    const containerRect = solarSystem.container.getBoundingClientRect();
    const shipX = containerRect.width / 2;
    const shipY = containerRect.height / 2;

    // Calculate pixel distance between ship and asteroid
    const dx = shipX - asteroidX;
    const dy = shipY - asteroidY;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance < closestDistance) {
      closestDistance = distance;
      closestAsteroid = asteroid;
    }
  });

  // Calculate distance from Earth based on the closest asteroid's actual distance
  let distanceKm = 0;

  if (closestAsteroid) {
    // Get the asteroid's actual distance from Earth in km
    const asteroidDistance = parseFloat(closestAsteroid.dataset.distance);

    // Calculate the ship's distance using the closest asteroid as reference
    // The closer the ship is to the asteroid visually, the closer it is to the asteroid's actual distance
    const asteroidOrbitRadius = parseFloat(closestAsteroid.dataset.orbitRadius);

    // Calculate what percentage of the asteroid's orbit radius the ship is at
    const shipOrbitRatio = pixelDistance / asteroidOrbitRadius;

    // Scale the actual distance accordingly
    distanceKm = asteroidDistance * shipOrbitRatio;
  } else {
    // Fallback to the old calculation if no asteroids are visible
    const containerRect = solarSystem.container.getBoundingClientRect();
    const maxRadius =
      Math.min(containerRect.width, containerRect.height) * 0.45;
    const proportion = (pixelDistance - 50) / (maxRadius - 50);

    if (proportion > 0) {
      const { MIN_DISTANCE, MAX_DISTANCE } = solarSystem.constants;
      const logMin = Math.log10(MIN_DISTANCE + 1);
      const logMax = Math.log10(MAX_DISTANCE);
      const logDist = proportion * (logMax - logMin) + logMin;
      distanceKm = Math.pow(10, logDist) - 1;
    }
  }
  addButtons();
  // Update info text
solarSystem.infoPanel.innerHTML = `
    <h3 style="font-weight: bold; font-size:18px;">Use Arrows to navigate and explore:</h3>
    <h3>Speed: ${solarSystem.ship.speed.toFixed(1)} px/s</h3>
    <h3>Distance from Earth: ${(distanceKm / 1000000).toFixed(2)}M km</h3>
    
`;
}

// Start the solar system
document.addEventListener("DOMContentLoaded", initSolarSystem);



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

function addButtons() {
    // Create and set up the reset button
    const resetButton = document.createElement("button");
    resetButton.innerHTML = `<img src="/assets/reset.svg" alt="Reset" width="40" height="40">`;
    resetButton.id = "reset-button";

    resetButton.addEventListener("click", () => {
        // Reset ship's position to Earth's position
        solarSystem.ship.x = solarSystem.earthPosition.x;
        solarSystem.ship.y = solarSystem.earthPosition.y;
        
        // Update camera to the new position
        updateCamera(); 
    });

    // Append the reset button to the body
    document.body.appendChild(resetButton);

    //this is half-balked code for the zoom button:

    // // Create and set up the zoom toggle button
    // const toggleZoom = document.createElement("button");
    // toggleZoom.innerHTML = "Zoom in/out";
    // toggleZoom.id = "zoom-toggle";
    
    // let zoomFactor = 1;  // Initial zoom state (zoomed out)
    
    // toggleZoom.addEventListener("click", () => {
    //     console.log("Zoom factor:", zoomFactor);
    
    //     if (zoomFactor === 1) {
    //         // Zoom in (change zoom factor to 5)
    //         solarSystem.camera.zoomFactor = 5;
            
    //         // Clear previous elements before creating new ones
    //         d3.select("#solar-system").selectAll("*").remove(); // This will remove all child elements inside the container
    
    //         createSolarSystem();
    
    //         console.log("Zoomed in, zoom factor:", zoomFactor);
    //     } else {
    //         // Zoom out (reset zoom factor to 1)
    //         solarSystem.camera.zoomFactor = 1;
            
    //         // Clear previous elements before creating new ones
    //         d3.select("#solar-system").selectAll("*").remove(); // This will remove all child elements inside the container
            
    //         // Recreate the entire solar system at the zoomed-out level
    //         createSolarSystem();
    
    //         console.log("Zoomed out, zoom factor:", zoomFactor);
    //     }
    
    //     // Apply the zoom factor with smooth transition
    //     const container = d3.select("#solar-system");
    //     container.transition()
    //         .duration(500) // Smooth transition
    //         .style("transform", `scale(${zoomFactor})`); // Apply zoom
    // });
    
    // // Append the zoom toggle button to the body
    // document.body.appendChild(toggleZoom);
    
}


  
  // Call the function to add the reset button

  

  function createLegend() {
    // Create a container for the legend
    const legend = d3.select("body").append("div")
        .attr("id", "legend");
       

    // Add title to the legend
    legend.append("h1")
        .text("Rock-et Science: Near Earth Objects")
        .style("text-align", "left-align")
        .style("margin-bottom", "10px");

    legend.append("h2")
        .text("A speculative map of near Earth objects using the ")
        .style("text-align", "left-align")
        .style("margin-bottom", "10px")
        .append("a")
        .attr("href", "https://api.nasa.gov/neo/rest/v1/feed?start_date=2015-09-07&end_date=2015-09-08&api_key=DEMO_KEY")
        .attr("target", "_blank")
        .style("color", "lightblue")
        .text("NASA API");

    // Define the legend entries (You can modify these based on your requirements)
    const legendEntries = [
    
        { label: "Near Earth Asteroids", color: "white", description: "Safe" },
        { label: "Sentry Object", color: "#ff4444", description: "Potentially hazardous" },
        { label: "Planets and satellites", color: "#00ff00", description: "Moon, Mars, Venus, Mercury" }
    ];

    // Append each legend entry
    const entry = legend.selectAll(".legend-entry")
        .data(legendEntries)
        .enter().append("div")
        .attr("class", "legend-entry")
        .style("display", "flex")
        .style("align-items", "center")
        .style("margin-bottom", "8px");

    // Add color boxes and labels
    entry.append("div")
        .style("width", "20px")
        .style("height", "20px")
        .style("background-color", d => d.color)
        .style("margin-right", "10px")
        .style("border-radius", "10px");

    // Add labels and descriptions

    entry.append("h3")
        .text(d => `${d.label}`);
}

// Call the function to create the legend
createLegend();


