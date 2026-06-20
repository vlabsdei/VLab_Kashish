// INPUT CONTROLS
const arrivalRate = document.getElementById("arrivalRate");
const greenTime = document.getElementById("greenTime");
const lanes = 2;
// DISPLAY VALUES
arrivalRate.addEventListener("input", () => {
    document.getElementById("arrivalRateValue").textContent =
        arrivalRate.value + " Vehicles/min";
});
greenTime.addEventListener("input", () => {
    document.getElementById("greenTimeValue").textContent =
        greenTime.value + " Sec";
});
// GLOBAL VARIABLES
let simulationRunning = false;
let simulationPaused = false;
let signalDirection = "NS";
let signalState = "GREEN";
let signalInterval;
let vehicleInterval;
let resultInterval;
let yellowTimeout;
let allRedTimeout;
// TRAFFIC COUNTERS
let northPassed = 0;
let southPassed = 0;
let eastPassed = 0;
let westPassed = 0;
let vehiclesGenerated = 0;
let cycleCounter = 0;
let timeRemaining = 0;
let yellowRemaining = 3;
let allRedRemaining = 3;
let phaseRemaining = 0;
let northQueue = 0;
let southQueue = 0;
let eastQueue = 0;
let westQueue = 0;
// VEHICLE STORAGE
const vehicles = [];
const SAFE_DISTANCE = 60;
// =====================================
// SIGNAL CONTROL
// =====================================
function updateSignals() {
    if (signalState === "ALL_RED") {
        document.querySelectorAll(".light").forEach(light => {
            light.classList.remove("active");
        });
        document.querySelector(".north-signal .red").classList.add("active");
        document.querySelector(".south-signal .red").classList.add("active");
        document.querySelector(".east-signal .red").classList.add("active");
        document.querySelector(".west-signal .red").classList.add("active");
        const state = document.getElementById("signalState");
        if (state) {
            state.textContent = "All Red";
        }
        return;
    }
    if (signalState === "YELLOW") {
        document.querySelectorAll(".light").forEach(light => {
            light.classList.remove("active");
        });
        if (signalDirection === "NS") {
            document.querySelector(".north-signal .yellow").classList.add("active");
            document.querySelector(".south-signal .yellow").classList.add("active");
            document.querySelector(".east-signal .red").classList.add("active");
            document.querySelector(".west-signal .red").classList.add("active");
            document.getElementById("signalState").textContent = "North-South Yellow";
        } else {
            document.querySelector(".north-signal .red").classList.add("active");
            document.querySelector(".south-signal .red").classList.add("active");
            document.querySelector(".east-signal .yellow").classList.add("active");
            document.querySelector(".west-signal .yellow").classList.add("active");
            document.getElementById("signalState").textContent = "East-West Yellow";
        }
        return;
    }
    document.querySelectorAll(".light").forEach(light => {
        light.classList.remove("active");
    });
    if (signalDirection === "NS") {
        document.querySelector(".north-signal .green").classList.add("active");
        document.querySelector(".south-signal .green").classList.add("active");
        document.querySelector(".east-signal .red").classList.add("active");
        document.querySelector(".west-signal .red").classList.add("active");
        const state = document.getElementById("signalState");
        if (state) {
            state.textContent = "North-South Green";
        }
    } else {
        document.querySelector(".north-signal .red").classList.add("active");
        document.querySelector(".south-signal .red").classList.add("active");
        document.querySelector(".east-signal .green").classList.add("active");
        document.querySelector(".west-signal .green").classList.add("active");
        const state = document.getElementById("signalState");
        if (state) {
            state.textContent = "East-West Green";
        }
    }
}
// =====================================
// CREATE VEHICLE
// =====================================
function createVehicle() {
    if (!simulationRunning || simulationPaused) return;
    if (vehicles.length >= 60) return;
    const container = document.getElementById("vehiclesContainer");
    const vehicle = document.createElement("img");
    vehicle.className = "vehicle";
    // Set fallback SVG car in case images/car.png doesn't load
    const colors = ["#ef4444", "#3b82f6", "#10b981", "#f59e0b", "#8b5cf6", "#ec4899", "#06b6d4"];
    const randomColor = colors[Math.floor(Math.random() * colors.length)];
    const getDarkerColor = (color) => {
        const darks = {
            "#ef4444": "#b91c1c",
            "#3b82f6": "#1d4ed8",
            "#10b981": "#047857",
            "#f59e0b": "#b45309",
            "#8b5cf6": "#6d28d9",
            "#ec4899": "#be185d",
            "#06b6d4": "#0891b2"
        };
        return darks[color] || "#222";
    };
    const darkerColor = getDarkerColor(randomColor);
    const carSvg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="60" height="40" viewBox="0 0 60 40">
      <rect x="10" y="2" width="10" height="4" rx="1" fill="#1e293b" />
      <rect x="40" y="2" width="10" height="4" rx="1" fill="#1e293b" />
      <rect x="10" y="34" width="10" height="4" rx="1" fill="#1e293b" />
      <rect x="40" y="34" width="10" height="4" rx="1" fill="#1e293b" />
      <rect x="5" y="5" width="50" height="30" rx="8" fill="${randomColor}" />
      <rect x="12" y="8" width="5" height="24" rx="1" fill="#e2e8f0" opacity="0.8" />
      <rect x="20" y="7" width="22" height="26" rx="4" fill="${darkerColor}" />
      <rect x="44" y="8" width="5" height="24" rx="1" fill="#e2e8f0" opacity="0.8" />
      <rect x="54" y="8" width="3" height="6" rx="1" fill="#fef08a" />
      <rect x="54" y="26" width="3" height="6" rx="1" fill="#fef08a" />
      <rect x="3" y="8" width="2" height="5" rx="1" fill="#ef4444" />
      <rect x="3" y="27" width="2" height="5" rx="1" fill="#ef4444" />
    </svg>
    `;
    const carDataUrl = "data:image/svg+xml;utf8," + encodeURIComponent(carSvg.trim());
       vehicle.src = carDataUrl;
    const directions = ["north", "south", "east", "west"];
    let availableDirections = [];
    directions.forEach(dir => {
        if (dir === "north" && signalDirection !== "NS") {
            const count = vehicles.filter(v => v.direction === "north").length;
            if (count < 10) {
                availableDirections.push(dir);
            }
        } else if (dir === "south" && signalDirection !== "NS") {
            const count = vehicles.filter(v => v.direction === "south").length;
            if (count < 10) {
                availableDirections.push(dir);
            }
        } else if (dir === "east" && signalDirection !== "EW") {
            const count = vehicles.filter(v => v.direction === "east").length;
            if (count < 24) {
                availableDirections.push(dir);
            }
        } else if (dir === "west" && signalDirection !== "EW") {
            const count = vehicles.filter(v => v.direction === "west").length;
            if (count < 24) {
                availableDirections.push(dir);
            }
        } else {
            availableDirections.push(dir);
        }
    });
    if (availableDirections.length === 0) {
        return;
    }
    const direction = availableDirections[Math.floor(Math.random() * availableDirections.length)];
    // Separate limit: North max 10, South max 10
    if (signalDirection !== "NS") {
        const northCount = vehicles.filter(v => v.direction === "north").length;
        const southCount = vehicles.filter(v => v.direction === "south").length;
        if (direction === "north" && northCount >= 10) {
            return;
        }
        if (direction === "south" && southCount >= 10) {
            return;
        }
    }
    // East max 24, West max 24 when EW is red
    if (signalDirection !== "EW") {
        const eastCount = vehicles.filter(v => v.direction === "east").length;
        const westCount = vehicles.filter(v => v.direction === "west").length;
        if (direction === "east" && eastCount >= 24) {
            return;
        }
        if (direction === "west" && westCount >= 24) {
            return;
        }
    }
    vehicle.dataset.direction = direction;
    // NORTH -> SOUTH (2 incoming lanes)
    if (direction === "north") {
        const northLane1 = vehicles.filter(v => v.direction === "north" && v.element.dataset.lane === "44%").length;
        const northLane2 = vehicles.filter(v => v.direction === "north" && v.element.dataset.lane === "47%").length;
        const lane = northLane1 <= northLane2 ? "44%" : "47%";
        vehicle.style.left = lane;
        vehicle.dataset.lane = lane;
        vehicle.style.top = "-80px";
        vehicle.style.transform = "rotate(90deg)";
    }
    // SOUTH -> NORTH (2 incoming lanes)
    if (direction === "south") {
        const southLane1 = vehicles.filter(v => v.direction === "south" && v.element.dataset.lane === "50%").length;
        const southLane2 = vehicles.filter(v => v.direction === "south" && v.element.dataset.lane === "53%").length;
        const lane = southLane1 <= southLane2 ? "50%" : "53%";
        vehicle.style.left = lane;
        vehicle.dataset.lane = lane;
        vehicle.style.top = "980px";
        vehicle.style.transform = "rotate(-90deg)";
    }
    // EAST -> WEST (2 incoming lanes)
    if (direction === "east") {
        const eastLane1 = vehicles.filter(v => v.direction === "east" && v.element.dataset.lane === "350px").length;
        const eastLane2 = vehicles.filter(v => v.direction === "east" && v.element.dataset.lane === "410px").length;
        const laneY = eastLane1 <= eastLane2 ? "350px" : "410px";
        vehicle.style.left = "1800px";
        vehicle.style.top = laneY;
        vehicle.dataset.lane = laneY;
        vehicle.style.transform = "rotate(180deg)";
    }
    // WEST -> EAST (2 incoming lanes)
    if (direction === "west") {
        const westLane1 = vehicles.filter(v => v.direction === "west" && v.element.dataset.lane === "460px").length;
        const westLane2 = vehicles.filter(v => v.direction === "west" && v.element.dataset.lane === "500px").length;
        const laneY = westLane1 <= westLane2 ? "460px" : "500px";
        vehicle.style.left = "-80px";
        vehicle.style.top = laneY;
        vehicle.dataset.lane = laneY;
        vehicle.style.transform = "rotate(0deg)";
    }
    container.appendChild(vehicle);
    vehiclesGenerated++;
    vehicles.push({
        element: vehicle,
        direction: direction
    });
    moveVehicle(vehicle, direction);
}
// =====================================
// VEHICLE MOVEMENT
// =====================================
function moveVehicle(vehicle, direction) {
    let position;
    if (direction === "north") {
        position = parseInt(vehicle.style.top);
    }
    if (direction === "south") {
        position = parseInt(vehicle.style.top);
    }
    if (direction === "east") {
        position = parseInt(vehicle.style.left);
    }
    if (direction === "west") {
        position = parseInt(vehicle.style.left);
    }
    const move = setInterval(() => {
        let blocked = false;
        vehicles.forEach(v => {
            if (v.element === vehicle) return;
            if (v.direction !== direction) return;
            if (v.element.dataset.lane !== vehicle.dataset.lane) return;
            if (!v.element.isConnected) return;
            let otherPos;
            if (direction === "north" || direction === "south") {
                otherPos = parseInt(v.element.style.top);
            } else {
                otherPos = parseInt(v.element.style.left);
            }
            // NORTH
            if (direction === "north") {
                if (otherPos > position && otherPos - position < SAFE_DISTANCE) {
                    blocked = true;
                }
            }
            // SOUTH
            if (direction === "south") {
                if (otherPos < position && position - otherPos < SAFE_DISTANCE) {
                    blocked = true;
                }
            }
            // EAST
            if (direction === "east") {
                if (otherPos < position && position - otherPos < SAFE_DISTANCE) {
                    blocked = true;
                }
            }
            // WEST
            if (direction === "west") {
                if (otherPos > position && otherPos - position < SAFE_DISTANCE) {
                    blocked = true;
                }
            }
        });
        if (blocked) return;
        if (!simulationRunning || simulationPaused) return;
        // NORTH → SOUTH
        if (direction === "north") {
            if ((signalDirection !== "NS" || signalState === "YELLOW" || signalState === "ALL_RED") &&
                position >= 250 && position <= 320) {
                return;
            }
            position += 1.2;
            vehicle.style.top = position + "px";
            if (position > 950) {
                clearInterval(move);
                vehicle.remove();
                const index = vehicles.findIndex(v => v.element === vehicle);
                if (index > -1) {
                    vehicles.splice(index, 1);
                }
                northPassed++;
                return;
            }
        }
        // SOUTH → NORTH
        if (direction === "south") {
            if ((signalDirection !== "NS" || signalState === "YELLOW" || signalState === "ALL_RED") &&
                position >= 520 && position <= 580) {
                return;
            }
            position -= 1.2;
            vehicle.style.top = position + "px";
            if (position < -120) {
                clearInterval(move);
                vehicle.remove();
                const index = vehicles.findIndex(v => v.element === vehicle);
                if (index > -1) {
                    vehicles.splice(index, 1);
                }
                southPassed++;
                return;
            }
        }
        // EAST → WEST
        if (direction === "east") {
            if ((signalDirection !== "EW" || signalState === "YELLOW" || signalState === "ALL_RED") &&
                position <= 1080 && position >= 1040) {
                return;
            }
            position -= 1.2;
            vehicle.style.left = position + "px";
            if (position < -120) {
                clearInterval(move);
                vehicle.remove();
                const index = vehicles.findIndex(v => v.element === vehicle);
                if (index > -1) {
                    vehicles.splice(index, 1);
                }
                eastPassed++;
                return;
            }
        }
        // WEST → EAST
        if (direction === "west") {
            if ((signalDirection !== "EW" || signalState === "YELLOW" || signalState === "ALL_RED") &&
                position >= 680 && position <= 720) {
                return;
            }
            position += 1.2;
            vehicle.style.left = position + "px";
            if (position > 2200) {
                clearInterval(move);
                vehicle.remove();
                const index = vehicles.findIndex(v => v.element === vehicle);
                if (index > -1) {
                    vehicles.splice(index, 1);
                }
                westPassed++;
                return;
            }
        }
    }, 20);
}
// =====================================
// CALCULATE RESULTS
// =====================================
function updateResults() {
    northQueue = 0;
    southQueue = 0;
    eastQueue = 0;
    westQueue = 0;
    vehicles.forEach(v => {
        if (!v.element.isConnected) return;
        if (v.direction === "north" && signalDirection !== "NS") {
            northQueue++;
        }
        if (v.direction === "south" && signalDirection !== "NS") {
            southQueue++;
        }
        if (v.direction === "east" && signalDirection !== "EW") {
            eastQueue++;
        }
        if (v.direction === "west" && signalDirection !== "EW") {
            westQueue++;
        }
    });
    const totalQueue = northQueue + southQueue + eastQueue + westQueue;
    const throughput = northPassed + southPassed + eastPassed + westPassed;
    const passedDisplay = document.getElementById("vehiclesPassed");
    if (passedDisplay) {
        passedDisplay.textContent = throughput;
    }
    const waitingTime = (totalQueue / parseInt(arrivalRate.value) * 60).toFixed(2);
    const totalVehicles = vehiclesGenerated;
    const efficiency = (throughput / Math.max(totalVehicles, 1)) * 100;
    const efficiencyValue = efficiency.toFixed(2);
    // QUEUE LENGTH
    document.getElementById("queueLength").textContent = totalQueue;
    // WAITING TIME
    document.getElementById("waitingTime").textContent = waitingTime + " sec";
    document.getElementById("vehiclesGenerated").textContent = vehiclesGenerated;
    // THROUGHPUT
    document.getElementById("throughput").textContent = throughput;
    // SIGNAL EFFICIENCY
    document.getElementById("signalEfficiency").textContent = efficiencyValue + "%";
    // QUEUE COUNTERS
    document.getElementById("northQueue").textContent = northQueue;
    document.getElementById("southQueue").textContent = southQueue;
    document.getElementById("eastQueue").textContent = eastQueue;
    document.getElementById("westQueue").textContent = westQueue;
    const cycleDisplay = document.getElementById("cycleTime");
    if (cycleDisplay) {
        cycleDisplay.textContent = cycleCounter;
    }
    // CONGESTION STATUS
    const congestion = document.getElementById("congestionStatus");
    if (totalQueue < 15) {
        congestion.textContent = "Low";
    } else if (totalQueue < 40) {
        congestion.textContent = "Moderate";
    } else {
        congestion.textContent = "High";
    }
}
// =====================================
// START SIMULATION
// =====================================
document.getElementById("startBtn").onclick = () => {
    if (simulationPaused) {
        simulationPaused = false;
        updateSignals();
        return;
    }
    if (simulationRunning) return;
    simulationRunning = true;
    if (vehicleInterval) {
        return;
    }
    timeRemaining = parseInt(greenTime.value);
    phaseRemaining = parseInt(greenTime.value);
    updateSignals();
    const vehiclesPerMinute = parseInt(arrivalRate.value);
    const spawnRate = (60000 / vehiclesPerMinute);
    vehicleInterval = setInterval(createVehicle, spawnRate);
    resultInterval = setInterval(() => {
        if (simulationPaused) return;
        phaseRemaining--;
        if (signalState === "GREEN" && phaseRemaining <= 0) {
            signalState = "YELLOW";
            phaseRemaining = 3;
            updateSignals();
        } else if (signalState === "YELLOW" && phaseRemaining <= 0) {
            signalState = "ALL_RED";
            phaseRemaining = 3;
            updateSignals();
        } else if (signalState === "ALL_RED" && phaseRemaining < 0) {
            signalDirection = signalDirection === "NS" ? "EW" : "NS";
            signalState = "GREEN";
            timeRemaining = parseInt(greenTime.value);
            phaseRemaining = parseInt(greenTime.value);
            updateSignals();
        }
        updateResults();
        cycleCounter++;
        if (signalState === "GREEN") {
            if (timeRemaining > 0) {
                timeRemaining--;
            }
        } else if (signalState === "YELLOW") {
            document.getElementById("timeRemaining").textContent = "Yellow : " + yellowRemaining + " sec";
            if (yellowRemaining < 0) {
                yellowRemaining = 0;
            }
            return;
        } else if (signalState === "ALL_RED") {
            document.getElementById("timeRemaining").textContent = "All Red : " + allRedRemaining + " sec";
            if (allRedRemaining < 0) {
                allRedRemaining = 0;
            }
            return;
        }
        document.getElementById("timeRemaining").textContent = timeRemaining;
    }, 1000);
};
// =====================================
// STOP SIMULATION
// =====================================
document.getElementById("stopBtn").onclick = () => {
    simulationPaused = true;
};
// =====================================
// RESET SIMULATION
// =====================================
document.getElementById("resetBtn").onclick = () => {
    location.reload();
};
// =====================================
// INITIAL STATE
// =====================================
greenTime.addEventListener("change", updateSignals);
updateSignals();
updateResults();
// =====================================
// DYNAMIC RESIZER FOR MOBILE
// =====================================
function resizeIntersection() {
    const wrapper = document.querySelector('.intersection-wrapper');
    const intersection = document.querySelector('.intersection');
    if (!wrapper || !intersection) return;
    const containerWidth = wrapper.clientWidth;
    const scale = containerWidth / 1800; // 1800px is the locked logical coordinate space
    intersection.style.transform = `scale(${scale})`;
    intersection.style.setProperty('--scale-factor', scale);
    
    // Set parent height to fit the scaled elements exactly, avoiding white spaces or layout jumps
    wrapper.style.height = (900 * scale) + 'px';
}
window.addEventListener('resize', resizeIntersection);
window.addEventListener('load', resizeIntersection);
if (document.readyState === 'complete' || document.readyState === 'interactive') {
    resizeIntersection();
} else {
    document.addEventListener('DOMContentLoaded', resizeIntersection);
}