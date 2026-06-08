// =====================================
// INPUT CONTROLS
// =====================================

const arrivalRate =
document.getElementById("arrivalRate");

const greenTime =
document.getElementById("greenTime");

const redTime =
document.getElementById("redTime");

const pedestrianFlow =
document.getElementById("pedestrianFlow");

const lanes = 2;

// =====================================
// DISPLAY VALUES
// =====================================

arrivalRate.addEventListener("input",()=>{

    document.getElementById(
        "arrivalRateValue"
    ).textContent =
    arrivalRate.value +
    " Vehicles/min";

});

greenTime.addEventListener("input",()=>{

    document.getElementById(
        "greenTimeValue"
    ).textContent =
    greenTime.value +
    " Sec";

});

redTime.addEventListener("input",()=>{

    document.getElementById(
        "redTimeValue"
    ).textContent =
    redTime.value +
    " Sec";

});

pedestrianFlow.addEventListener("input",()=>{

    document.getElementById(
        "pedestrianFlowValue"
    ).textContent =
    pedestrianFlow.value +
    " Persons/min";

});

// =====================================
// GLOBAL VARIABLES
// =====================================

let simulationRunning = false;

let signalDirection = "NS";

let signalInterval;
let vehicleInterval;
let resultInterval;

// =====================================
// TRAFFIC COUNTERS
// =====================================

let northPassed = 0;
let southPassed = 0;
let eastPassed = 0;
let westPassed = 0;
let cycleCounter = 0;
let timeRemaining = 0;

let northQueue = 0;
let southQueue = 0;
let eastQueue = 0;
let westQueue = 0;

// =====================================
// VEHICLE STORAGE
// =====================================

const vehicles = [];

const SAFE_DISTANCE = 50;

// =====================================
// SIGNAL CONTROL
// =====================================

function updateSignals(){

    document
    .querySelectorAll(".light")
    .forEach(light=>{
        light.classList.remove("active");
    });

    if(signalDirection==="NS"){

        document
        .querySelector(".north-signal .green")
        .classList.add("active");

        document
        .querySelector(".south-signal .green")
        .classList.add("active");

        document
        .querySelector(".east-signal .red")
        .classList.add("active");

        document
        .querySelector(".west-signal .red")
        .classList.add("active");

        const state =
        document.getElementById(
            "signalState"
        );

        if(state){
            state.textContent =
            "North-South Green";
        }
    }
    else{

        document
        .querySelector(".north-signal .red")
        .classList.add("active");

        document
        .querySelector(".south-signal .red")
        .classList.add("active");

        document
        .querySelector(".east-signal .green")
        .classList.add("active");

        document
        .querySelector(".west-signal .green")
        .classList.add("active");

        const state =
        document.getElementById(
            "signalState"
        );

        if(state){
            state.textContent =
            "East-West Green";
        }
    }
}

// =====================================
// CREATE VEHICLE
// =====================================

function createVehicle(){

    if(!simulationRunning)
    return;

    const container =
    document.getElementById(
        "vehiclesContainer"
    );

    const vehicle =
    document.createElement("img");

    vehicle.className =
    "vehicle";

    vehicle.src =
    "./images/car.png";

    const directions =
    [
        "north",
        "south",
        "east",
        "west"
    ];

    const direction =
    directions[
        Math.floor(
            Math.random()*4
        )
    ];

    vehicle.dataset.direction =
    direction;

    // NORTH

    if(direction==="north"){


        vehicle.style.left =
        "47%";

       vehicle.style.top = "-80px";

        vehicle.style.transform =
        "rotate(90deg)";
    }

    // SOUTH

    if(direction==="south"){


        vehicle.style.left =
        "51%";

        vehicle.style.top = "980px";

        vehicle.style.transform =
        "rotate(-90deg)";
    }

    // EAST

    if(direction==="east"){


       vehicle.style.left = "1800px";

        vehicle.style.top =
        "380px";

        vehicle.style.transform =
        "rotate(180deg)";
    }

    // WEST

    if(direction==="west"){


        vehicle.style.left = "-80px";

        vehicle.style.top =
        "520px";

        vehicle.style.transform =
        "rotate(0deg)";
    }

    container.appendChild(
        vehicle
    );

    vehicles.push({
        element:vehicle,
        direction:direction
    });

    moveVehicle(
        vehicle,
        direction
    );
}
// =====================================
// VEHICLE MOVEMENT
// =====================================

function moveVehicle(
    vehicle,
    direction
){

    let position;

    if(direction==="north"){

        position =
        parseInt(
            vehicle.style.top
        );
    }

    if(direction==="south"){

        position =
        parseInt(
            vehicle.style.top
        );
    }

    if(direction==="east"){

        position =
        parseInt(
            vehicle.style.left
        );
    }

    if(direction==="west"){

        position =
        parseInt(
            vehicle.style.left
        );
    }

    const move =
setInterval(()=>{

    let blocked = false;

    vehicles.forEach(v=>{

        if(v.element === vehicle) return;

        if(v.direction !== direction) return;

        if(!v.element.isConnected) return;

        let otherPos;

        if(
            direction==="north" ||
            direction==="south"
        ){

            otherPos =
            parseInt(v.element.style.top);

        }
        else{

            otherPos =
            parseInt(v.element.style.left);

        }

       // NORTH
if(direction==="north"){

    if(
        otherPos > position &&
        otherPos-position < SAFE_DISTANCE
    ){
        blocked = true;
    }
}

// SOUTH
if(direction==="south"){

    if(
        otherPos < position &&
        position-otherPos < SAFE_DISTANCE
    ){
        blocked = true;
    }
}

// EAST
if(direction==="east"){

    if(
        otherPos < position &&
        position-otherPos < SAFE_DISTANCE
    ){
        blocked = true;
    }
}

// WEST
if(direction==="west"){

    if(
        otherPos > position &&
        otherPos-position < SAFE_DISTANCE
    ){
        blocked = true;
    }
}

    });

    if(blocked) return;

        if(!simulationRunning)
        return;

        // =====================
        // NORTH → SOUTH
        // =====================

        if(direction==="north"){

            if(
                signalDirection!=="NS" &&
                position > 250 &&
                position < 320
            ){
                return;
            }

            position += 1.2;

            vehicle.style.top =
            position + "px";

            if(position > 950){

                clearInterval(move);

                vehicle.remove();
                const index =
vehicles.findIndex(
v => v.element === vehicle
);

if(index > -1){

    vehicles.splice(index,1);

}

                northPassed++;

                return;
            }
        }

        // =====================
        // SOUTH → NORTH
        // =====================

        if(direction==="south"){

            if(
                signalDirection!=="NS" &&
                position < 650 &&
                position > 560
            ){
                return;
            }

            position -= 1.2;

            vehicle.style.top =
            position + "px";

            if(position < -120){

                clearInterval(move);

                vehicle.remove();
                const index =
vehicles.findIndex(
v => v.element === vehicle
);

if(index > -1){

    vehicles.splice(index,1);

}

                southPassed++;

                return;
            }
        }

        // =====================
        // EAST → WEST
        // =====================

        if(direction==="east"){

            if(
                signalDirection!=="EW" &&
                position < 1150 &&
                position > 1050
            ){
                return;
            }

            position -= 1.2;

            vehicle.style.left =
            position + "px";

            if(position < -120){

                clearInterval(move);

                vehicle.remove();
                const index =
vehicles.findIndex(
v => v.element === vehicle
);

if(index > -1){

    vehicles.splice(index,1);

}

                eastPassed++;

                return;
            }
        }

        // =====================
        // WEST → EAST
        // =====================

        if(direction==="west"){

            if(
                signalDirection!=="EW" &&
                position > 620 &&
                position < 700
            ){
                return;
            }

            position += 1.2;

            vehicle.style.left =
            position + "px";

            if(position > 2200){

                clearInterval(move);

                vehicle.remove();
                const index =
vehicles.findIndex(
v => v.element === vehicle
);

if(index > -1){

    vehicles.splice(index,1);

}

                westPassed++;

                return;
            }
        }

    },20);
}
// =====================================
// CALCULATE RESULTS
// =====================================

function updateResults(){
northQueue = 0;
southQueue = 0;
eastQueue = 0;
westQueue = 0;

vehicles.forEach(v => {

    if(!v.element.isConnected) return;

    if(
        v.direction === "north" &&
        signalDirection !== "NS"
    ){
        northQueue++;
    }

    if(
        v.direction === "south" &&
        signalDirection !== "NS"
    ){
        southQueue++;
    }

    if(
        v.direction === "east" &&
        signalDirection !== "EW"
    ){
        eastQueue++;
    }

    if(
        v.direction === "west" &&
        signalDirection !== "EW"
    ){
        westQueue++;
    }

});
    const totalQueue =
    northQueue +
    southQueue +
    eastQueue +
    westQueue;

    const throughput =
    northPassed +
    southPassed +
    eastPassed +
    westPassed;
    const passedDisplay =
document.getElementById(
    "vehiclesPassed"
);

if(passedDisplay){

    passedDisplay.textContent =
    throughput;
}

    const density =
(
    totalQueue / 2
).toFixed(2);

    const waitingTime =
(
    totalQueue /
    parseInt(
        arrivalRate.value
    )
    * 60
).toFixed(2);
    const totalVehicles =
    throughput +
    totalQueue;

    const efficiency =
    (
        throughput /
        Math.max(
            totalVehicles,
            1
        )
    ) * 100;

    const efficiencyValue =
    efficiency.toFixed(2);

    // QUEUE LENGTH

    document.getElementById(
        "queueLength"
    ).textContent =
    totalQueue;

    // WAITING TIME

    document.getElementById(
        "waitingTime"
    ).textContent =
    waitingTime + " sec";

    // DENSITY

    document.getElementById(
        "density"
    ).textContent =
    density;

    // THROUGHPUT

    document.getElementById(
        "throughput"
    ).textContent =
    throughput;

    // SIGNAL EFFICIENCY

    document.getElementById(
        "signalEfficiency"
    ).textContent =
    efficiencyValue + "%";

    // QUEUE COUNTERS

    document.getElementById(
        "northQueue"
    ).textContent =
    northQueue;

    document.getElementById(
        "southQueue"
    ).textContent =
    southQueue;

    document.getElementById(
        "eastQueue"
    ).textContent =
    eastQueue;

    document.getElementById(
        "westQueue"
    ).textContent =
    westQueue;
    const cycleDisplay =
document.getElementById(
    "cycleTime"
);

if(cycleDisplay){

    cycleDisplay.textContent =
    cycleCounter;
}

    // CONGESTION STATUS

    const congestion =
    document.getElementById(
        "congestionStatus"
    );

    if(totalQueue < 15){

        congestion.textContent =
        "Low";
    }

    else if(totalQueue < 40){

        congestion.textContent =
        "Moderate";
    }

    else{

        congestion.textContent =
        "High";
    }
}

// =====================================
// START SIMULATION
// =====================================

document.getElementById(
    "startBtn"
).onclick = ()=>{

    if(simulationRunning)
    return;

    simulationRunning = true;
    timeRemaining =
parseInt(greenTime.value);

    updateSignals();

    const vehiclesPerMinute =
parseInt(arrivalRate.value);

const spawnRate =
60000 / vehiclesPerMinute;

vehicleInterval =
setInterval(

    createVehicle,

    spawnRate

);

    signalInterval =
    setInterval(()=>{

        signalDirection =
signalDirection === "NS"
? "EW"
: "NS";

timeRemaining =
parseInt(greenTime.value);

updateSignals();
    },

    parseInt(
        greenTime.value
    ) * 1000
    );

    resultInterval =
setInterval(()=>{

    updateResults();

    cycleCounter++;

    timeRemaining--;

    document.getElementById(
        "timeRemaining"
    ).textContent =
    timeRemaining;

},1000);
};

// =====================================
// STOP SIMULATION
// =====================================

document.getElementById(
    "stopBtn"
).onclick = ()=>{

    simulationRunning = false;

    clearInterval(
        vehicleInterval
    );

    clearInterval(
        signalInterval
    );

    clearInterval(
        resultInterval
    );
};

// =====================================
// RESET SIMULATION
// =====================================

document.getElementById(
    "resetBtn"
).onclick = ()=>{

    location.reload();
};

// =====================================
// INITIAL STATE
// =====================================
greenTime.addEventListener(
    "change",
    updateSignals
);

redTime.addEventListener(
    "change",
    updateSignals
);
updateSignals();

updateResults();
