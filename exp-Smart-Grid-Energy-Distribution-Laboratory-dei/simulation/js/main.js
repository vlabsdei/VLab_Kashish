// SMART GRID ENERGY DISTRIBUTION LAB

// Input Elements

const solarPower = document.getElementById("solarPower");
const windPower = document.getElementById("windPower");

const residentialLoad = document.getElementById("residentialLoad");
const commercialLoad = document.getElementById("commercialLoad");
const industrialLoad = document.getElementById("industrialLoad");

// Display Elements

const solarPowerValue = document.getElementById("solarPowerValue");
const windPowerValue = document.getElementById("windPowerValue");

const residentialLoadValue = document.getElementById("residentialLoadValue");
const commercialLoadValue = document.getElementById("commercialLoadValue");
const industrialLoadValue = document.getElementById("industrialLoadValue");

// Diagram Displays

const solarOutput = document.getElementById("solarOutput");
const windOutput = document.getElementById("windOutput");

const residentialDemand = document.getElementById("residentialDemand");
const commercialDemand = document.getElementById("commercialDemand");
const industrialDemand = document.getElementById("industrialDemand");

// Result Cards

const generatedPower = document.getElementById("generatedPower");
const totalDemand = document.getElementById("totalDemand");
const surplusPower = document.getElementById("surplusPower");
const gridEfficiency = document.getElementById("gridEfficiency");
const renewableUtilization = document.getElementById("renewableUtilization");
const gridCondition = document.getElementById("gridCondition");

// Status Panel

const generatedPowerStatus = document.getElementById("generatedPowerStatus");
const totalDemandStatus = document.getElementById("totalDemandStatus");
const efficiencyStatus = document.getElementById("efficiencyStatus");
const gridStatus = document.getElementById("gridStatus");

// Buttons

const startBtn = document.getElementById("startBtn");
const stopBtn = document.getElementById("stopBtn");
const resetBtn = document.getElementById("resetBtn");

// Simulation State

let simulationRunning = false;

// Update Slider Values

function updateSliderValues() {

    solarPowerValue.textContent =
        solarPower.value + " kW";

    windPowerValue.textContent =
        windPower.value + " kW";

    residentialLoadValue.textContent =
        residentialLoad.value + " kW";

    commercialLoadValue.textContent =
        commercialLoad.value + " kW";

    industrialLoadValue.textContent =
        industrialLoad.value + " kW";
}

// Run Simulation
// =====================================

function runSimulation() {

    if (!simulationRunning) {
        return;
    }
    const solar =
        Number(solarPower.value);

    const wind =
        Number(windPower.value);

    const residential =
        Number(residentialLoad.value);

    const commercial =
        Number(commercialLoad.value);

    const industrial =
        Number(industrialLoad.value);

    // Calculations

    const totalGenerated =
        solar + wind;

    const totalLoad =
        residential + commercial + industrial;

    const surplus =
        totalGenerated - totalLoad;
        const controller =
    document.querySelector(".controller-node");

if (surplus < 0) {

    controller.style.borderColor = "#dc2626";
    controller.style.boxShadow = "0 0 20px #dc2626";

} else if (surplus > 100) {

    controller.style.borderColor = "#16a34a";
    controller.style.boxShadow = "0 0 20px #16a34a";

} else {

    controller.style.borderColor = "#ffb300";
    controller.style.boxShadow = "0 0 20px #ffb300";
}
const solarDuration =
    Math.max(1, 6 - (solar / 200));

const windDuration =
    Math.max(1, 6 - (wind / 200));

document.querySelectorAll(".solar-dot")
.forEach(dot => {

    if (solar === 0) {

        dot.style.display = "none";

    } else {

        dot.style.display = "block";
        dot.style.animationDuration =
            solarDuration + "s";
    }
});
const solarConnection =
    document.querySelector(".solar-connection");

if(solarConnection){

    solarConnection.classList.toggle(
        "no-flow",
        solar === 0
    );
}

document.querySelectorAll(".wind-dot")
.forEach(dot => {
    if (wind === 0) {

        dot.style.display = "none";

    } else {

        dot.style.display = "block";
        dot.style.animationDuration =
            windDuration + "s";
    }
});
const windConnection =
    document.querySelector(".wind-connection");

if(windConnection){

    windConnection.classList.toggle(
        "no-flow",
        wind === 0
    );
}
const residentialDots =
    residential === 0
    ? 0
    : Math.ceil((residential / 500) * 7);

document.querySelectorAll(".lp")
.forEach((dot,index)=>{

    dot.style.display =
        index < residentialDots
        ? "block"
        : "none";
});
const industrialDots =
    industrial === 0
    ? 0
    : Math.ceil((industrial / 1000) * 7);

document.querySelectorAll(".rp")
.forEach((dot,index)=>{

    dot.style.display =
        index < industrialDots
        ? "block"
        : "none";
});
const centerLoad =
    document.querySelector(".center-load");

if(centerLoad){

    centerLoad.classList.toggle(
        "no-flow",
        commercial === 0
    );
}
// Residential vertical particles

const vd1 = document.querySelector(".vd1");
const vd2 = document.querySelector(".vd2");

if (residential === 0) {

    if(vd1) vd1.style.display = "none";
    if(vd2) vd2.style.display = "none";

} else {
if (residential > 0) {

    if(vd1) vd1.style.display = "block";

    if(vd2){
        vd2.style.display =
            residential > 300
            ? "block"
            : "none";
    }

} else {

    if(vd1) vd1.style.display = "none";
    if(vd2) vd2.style.display = "none";
}
}

// Industrial vertical particles

const vd5 = document.querySelector(".vd5");
const vd6 = document.querySelector(".vd6");

if (industrial === 0) {

    if(vd5) vd5.style.display = "none";
    if(vd6) vd6.style.display = "none";

} else {

   if (industrial > 0) {

    if(vd5) vd5.style.display = "block";

    if(vd6){
        vd6.style.display =
            industrial > 600
            ? "block"
            : "none";
    }

} else {

    if(vd5) vd5.style.display = "none";
    if(vd6) vd6.style.display = "none";
}
}    

    let efficiency = 0;

if (totalLoad === 0) {

    efficiency = 100;

} else {

    efficiency =
        (Math.min(totalGenerated, totalLoad) / totalLoad) * 100;
}

    efficiency =
        efficiency.toFixed(1);

    // Diagram Update

    solarOutput.textContent =
        solar + " kW";

    windOutput.textContent =
        wind + " kW";

    residentialDemand.textContent =
        residential + " kW";

    commercialDemand.textContent =
        commercial + " kW";

    industrialDemand.textContent =
        industrial + " kW";

    // Results Update

    generatedPower.textContent =
        totalGenerated + " kW";

    totalDemand.textContent =
        totalLoad + " kW";

    surplusPower.textContent =
        surplus + " kW";
        if (surplus >= 0) {

    surplusPower.style.color =
        "#16a34a";

} else {

    surplusPower.style.color =
        "#dc2626";
}

    gridEfficiency.textContent =
        efficiency + "%";

    // Status Panel

    generatedPowerStatus.textContent =
        totalGenerated;

    totalDemandStatus.textContent =
        totalLoad;

    efficiencyStatus.textContent =
        efficiency;

    // Renewable Utilization

    if (efficiency >= 80) {

    renewableUtilization.textContent =
        "Excellent";

    renewableUtilization.style.color =
        "#16a34a";

} else if (efficiency >= 60) {

    renewableUtilization.textContent =
        "Good";

    renewableUtilization.style.color =
        "#2563eb";

} else if (efficiency >= 40) {

    renewableUtilization.textContent =
        "Moderate";

    renewableUtilization.style.color =
        "#f97316";

} else {

    renewableUtilization.textContent =
        "Poor";

    renewableUtilization.style.color =
        "#dc2626";
}

    // Grid Condition

   if (surplus > 100) {

    gridCondition.textContent =
        "Power Surplus";

    gridCondition.style.color =
        "#16a34a";

    gridStatus.textContent =
        "Surplus";

    gridStatus.className =
        "status-normal";

} else if (surplus >= 0) {

    gridCondition.textContent =
        "Stable";

    gridCondition.style.color =
        "#2563eb";

    gridStatus.textContent =
        "Balanced";

    gridStatus.className =
        "status-normal";

} else {

    gridCondition.textContent =
        "Power Deficit";

    gridCondition.style.color =
        "#dc2626";

    gridStatus.textContent =
        "Deficit";

    gridStatus.className =
        "status-danger";
}
}

// Start Simulation

startBtn.addEventListener("click", () => {

    simulationRunning = true;

    document.body.classList.add("simulation-active");

    runSimulation();
});
// Stop Simulation

stopBtn.addEventListener("click", () => {

    simulationRunning = false;

    document.body.classList.remove("simulation-active");

    gridStatus.textContent = "Stopped";

    gridStatus.className = "status-warning";
});

// Reset Simulation

resetBtn.addEventListener("click", () => {

    simulationRunning = false;

    document.body.classList.remove("simulation-active");

    solarPower.value = 500;
    windPower.value = 300;

    residentialLoad.value = 200;
    commercialLoad.value = 150;
    industrialLoad.value = 250;

    updateSliderValues();

   gridStatus.textContent = "Ready";
gridStatus.className = "";
});

// Live Slider Updates

solarPower.addEventListener("input", () => {

    updateSliderValues();

    if (simulationRunning) {

        runSimulation();
    }
});

windPower.addEventListener("input", () => {

    updateSliderValues();

    if (simulationRunning) {

        runSimulation();
    }
});

residentialLoad.addEventListener("input", () => {

    updateSliderValues();

    if (simulationRunning) {

        runSimulation();
    }
});

commercialLoad.addEventListener("input", () => {

    updateSliderValues();

    if (simulationRunning) {

        runSimulation();
    }
});

industrialLoad.addEventListener("input", () => {

    updateSliderValues();

    if (simulationRunning) {

        runSimulation();
    }
});

// Initial Load

updateSliderValues();

gridStatus.textContent = "Ready";