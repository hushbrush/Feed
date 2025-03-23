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
    zoomFactor: 6, // Higher value for much more zoomed in view
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
    MIN_DISTANCE: 20000,
    MAX_DISTANCE: 150000000,
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

// Load asteroid data
async function loadAsteroidData() {
  try {
    const response = await fetch("asteroid-data-2025-03-23.json");
    const data = await response.json();
    solarSystem.asteroids = data;
    console.log(
      "Asteroid data loaded:",
      solarSystem.asteroids.length,
      "asteroids"
    );
  } catch (error) {
    console.error("Error loading asteroid data:", error);
    throw error;
  }
}

// Set up the navigation ship
function setupNavShip() {
  const ship = document.createElement("div");
  ship.className = "nav-ship";
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
    const xPosition = centerX + orbitRadius * Math.cos(angle);
    const yPosition = centerY + orbitRadius * Math.sin(angle);

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

// Create asteroids on their orbits
function createAsteroids(centerX, centerY) {
  solarSystem.asteroids.forEach((asteroid) => {
    const missDistance = parseFloat(
      asteroid.close_approach_data[0].miss_distance.kilometers
    );

    // Skip if outside our range
    if (missDistance > solarSystem.constants.MAX_DISTANCE) return;

    const orbitRadius = distanceToPixels(missDistance);

    // Set the diameter in pixels based on the minimum estimated diameter in meters
    // Scale to approximately half size (divide by 2)
    // Add constraints to keep sizes reasonable for visualization
    // Minimum size of 2px so even small asteroids are visible
    // Maximum size of 25px to prevent giant asteroids from dominating the view
    const minSizeMeters = asteroid.estimated_diameter_meters.min;
    const diameterInPixels = Math.max(2, Math.min(25, minSizeMeters / 2));

    // Create asteroid element
    const asteroidElement = document.createElement("div");
    asteroidElement.className = "asteroid";
    asteroidElement.style.width = `${diameterInPixels}px`;
    asteroidElement.style.height = `${diameterInPixels}px`;

    // Store asteroid data for animation
    asteroidElement.dataset.name = asteroid.name;
    asteroidElement.dataset.distance = missDistance;
    asteroidElement.dataset.orbitRadius = orbitRadius;
    asteroidElement.dataset.centerX = centerX;
    asteroidElement.dataset.centerY = centerY;
    asteroidElement.dataset.diameter = diameterInPixels;
    asteroidElement.dataset.actualDiameter = minSizeMeters; // Store actual size for tooltip

    // Calculate velocity for orbit speed
    // Get the velocity in km/h
    const velocity = parseFloat(
      asteroid.close_approach_data[0].relative_velocity.kilometers_per_hour
    );

    // Calculate how much of the circle (in radians) the asteroid should move per frame
    // A full circle (2π radians) represents a full day (24 hours)
    // So the velocity determines what fraction of the day is covered per hour
    // Then we adjust for the frame rate (60fps = 3600 frames per hour)
    const radiansPerHour = (2 * Math.PI) / 24; // Base movement: full circle in 24 hours
    const velocityFactor = velocity / 50000; // Scale factor to make velocity differences visible
    const scaledRadiansPerHour = radiansPerHour * (1 + velocityFactor); // Adjust speed based on velocity
    const radiansPerFrame = scaledRadiansPerHour / 3600; // Convert to radians per frame (assuming 60fps)

    asteroidElement.dataset.velocity = radiansPerFrame;

    // Set initial position on orbit based on the time of day from epoch
    const epoch = asteroid.close_approach_data[0].epoch_date_close_approach;
    const date = new Date(epoch);
    const hoursOfDay = date.getUTCHours() + date.getUTCMinutes() / 60;
    const dayProgress = hoursOfDay / 24; // 0 to 1 representing progress through the day

    // Convert to angle in radians (0 to 2π)
    // 0 hours = 0 radians (right side of circle, 3 o'clock position)
    // 6 hours = π/2 radians (bottom of circle, 6 o'clock position)
    // 12 hours = π radians (left side of circle, 9 o'clock position)
    // 18 hours = 3π/2 radians (top of circle, 12 o'clock position)
    const angle = dayProgress * 2 * Math.PI;
    asteroidElement.dataset.angle = angle;

    // Calculate position
    const xPosition = centerX + orbitRadius * Math.cos(angle);
    const yPosition = centerY + orbitRadius * Math.sin(angle);

    // Set position
    asteroidElement.style.left = `${xPosition - diameterInPixels / 2}px`;
    asteroidElement.style.top = `${yPosition - diameterInPixels / 2}px`;

    // Add event listeners for tooltip
    asteroidElement.addEventListener("mouseover", () => {
      const tooltip = `${asteroid.name}\nDiameter: ${minSizeMeters.toFixed(
        1
      )} meters\nDistance: ${(missDistance / 1000000).toFixed(
        2
      )}M km\nVelocity: ${(velocity / 3600).toFixed(
        2
      )} km/s\nTime: ${date.getUTCHours()}:${date
        .getUTCMinutes()
        .toString()
        .padStart(2, "0")}`;
      showTooltip(
        asteroidElement,
        tooltip,
        xPosition,
        yPosition - diameterInPixels - 20
      );
    });

    asteroidElement.addEventListener("mouseout", () => {
      hideTooltip();
    });

    solarSystem.container.appendChild(asteroidElement);
  });
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

  // Calculate radius in pixels (min 50px, max is half the smaller container dimension)
  const containerRect = solarSystem.container.getBoundingClientRect();
  const maxRadius = Math.min(containerRect.width, containerRect.height) * 0.45;

  // Apply zoom factor to make orbits appear larger
  return (50 + proportion * (maxRadius - 50)) * solarSystem.camera.zoomFactor;
}

// Show tooltip with information
function showTooltip(element, text, x, y) {
  clearTimeout(solarSystem.tooltipTimeout);

  solarSystem.tooltipTimeout = setTimeout(() => {
    solarSystem.tooltip.textContent = text;
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
    } else {
      asteroidElement.style.display = "none";
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
  const distance = Math.sqrt(dx * dx + dy * dy);

  // Convert pixel distance back to km (approximate)
  const containerRect = solarSystem.container.getBoundingClientRect();
  const maxRadius = Math.min(containerRect.width, containerRect.height) * 0.45;
  const proportion = (distance - 50) / (maxRadius - 50);

  let distanceKm = 0;
  if (proportion > 0) {
    const { MIN_DISTANCE, MAX_DISTANCE } = solarSystem.constants;
    const logMin = Math.log10(MIN_DISTANCE + 1);
    const logMax = Math.log10(MAX_DISTANCE);
    const logDist = proportion * (logMax - logMin) + logMin;
    distanceKm = Math.pow(10, logDist) - 1;
  }

  // Update info text
  solarSystem.infoPanel.innerHTML = `
    <div>Speed: ${solarSystem.ship.speed.toFixed(1)} px/s</div>
    <div>Distance from Earth: ${(distanceKm / 1000000).toFixed(2)}M km</div>
    <div>Use arrow keys to navigate</div>
  `;
}

// Start the solar system
document.addEventListener("DOMContentLoaded", initSolarSystem);
