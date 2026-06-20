/* RENEWABLE ENERGY INTEGRATION AND MANAGEMENT LAB - SYSTEM ENGINE */

// Input Elements
const solarIrradiance = document.getElementById("solarIrradiance");
const ambientTemp = document.getElementById("ambientTemp");
const windSpeed = document.getElementById("windSpeed");
const bladePitch = document.getElementById("bladePitch");
const biomassFuel = document.getElementById("biomassFuel");

const gridMode = document.getElementById("gridMode");
const emsStrategy = document.getElementById("emsStrategy");
const shavingLimit = document.getElementById("shavingLimit");
const shavingLimitGroup = document.getElementById("shavingLimitGroup");
const demandResponseToggle = document.getElementById("demandResponseToggle");

const resLoad = document.getElementById("resLoad");
const comLoad = document.getElementById("comLoad");
const indLoad = document.getElementById("indLoad");

// Display Element Labels
const solarIrradianceVal = document.getElementById("solarIrradianceVal");
const ambientTempVal = document.getElementById("ambientTempVal");
const windSpeedVal = document.getElementById("windSpeedVal");
const bladePitchVal = document.getElementById("bladePitchVal");
const biomassFuelVal = document.getElementById("biomassFuelVal");
const shavingLimitVal = document.getElementById("shavingLimitVal");
const resLoadVal = document.getElementById("resLoadVal");
const comLoadVal = document.getElementById("comLoadVal");
const indLoadVal = document.getElementById("indLoadVal");

// SCADA Diagram Values
const nodeSolarVal = document.getElementById("nodeSolarVal");
const nodeBiomassVal = document.getElementById("nodeBiomassVal");
const nodeWindVal = document.getElementById("nodeWindVal");
const nodeBatteryVal = document.getElementById("nodeBatteryVal");
const nodeControllerVal = document.getElementById("nodeControllerVal");
const nodeHydrogenVal = document.getElementById("nodeHydrogenVal");
const nodeUtilityVal = document.getElementById("nodeUtilityVal");
const nodeResVal = document.getElementById("nodeResVal");
const nodeComVal = document.getElementById("nodeComVal");
const nodeIndVal = document.getElementById("nodeIndVal");

// Badges & Indicators
const windBrakeBadge = document.getElementById("windBrakeBadge");
const batteryStatusBadge = document.getElementById("batteryStatusBadge");
const h2StatusBadge = document.getElementById("h2StatusBadge");
const nodeUtilityBadge = document.getElementById("nodeUtilityBadge");
const nodeResLed = document.getElementById("nodeResLed");
const nodeComLed = document.getElementById("nodeComLed");
const nodeIndLed = document.getElementById("nodeIndLed");

// Telemetry Metrics Cards
const metricTotalGen = document.getElementById("metricTotalGen");
const metricTotalDemand = document.getElementById("metricTotalDemand");
const metricNetBalance = document.getElementById("metricNetBalance");
const metricCellTemp = document.getElementById("metricCellTemp");
const metricBatteryFlow = document.getElementById("metricBatteryFlow");
const metricHydrogenFlow = document.getElementById("metricHydrogenFlow");
const metricGridFlow = document.getElementById("metricGridFlow");
const metricCondition = document.getElementById("metricCondition");

// Controls Buttons
const startBtn = document.getElementById("startBtn");
const stopBtn = document.getElementById("stopBtn");
const resetBtn = document.getElementById("resetBtn");


// Presets
const presetStandard = document.getElementById("presetStandard");
const presetPeakLoad = document.getElementById("presetPeakLoad");
const presetStorm = document.getElementById("presetStorm");
const presetOutage = document.getElementById("presetOutage");



// SIMULATION STATE VARIABLES
let simRunning = false;
let simInterval = null;
let simSeconds = 0;
let batterySoC = 50.0;     // State of Charge %
let hydrogenLevel = 0.0;    // stored kg of H2


// Constants
const BATTERY_CAPACITY = 1500;  // kWh
const H2_TANK_CAPACITY = 20;    // kg of H2
const DT = 0.1;                 // simulated time-step in hours (6 minutes)

// SCADA Chart trends data
let chartGenHistory = Array(30).fill(0);
let chartDemHistory = Array(30).fill(0);
let chartSoCHistory = Array(30).fill(50);
let chartH2History = Array(30).fill(0);
let trendsChart = null;

// =====================================
// DYNAMIC GRID RESIZER
// =====================================
function resizeGrid() {
    const wrapper = document.querySelector('.intersection-wrapper');
    const scrollContainer = document.querySelector('.scada-scroll-container');
    const canvas = document.querySelector('.scada-grid-canvas');
    if (!wrapper || !canvas) return;

    // Get the actual available space in the wrapper
    const containerWidth = wrapper.clientWidth;
    
    // Clear inline height briefly on desktop to let flexbox calculate the natural available height
    if (window.innerWidth > 1100) {
        wrapper.style.height = "";
    }
    const containerHeight = wrapper.clientHeight;

    const widthScale = containerWidth / 1200;
    const heightScale = containerHeight / 660;

      // Scale to fit both dimensions to prevent vertical or horizontal clipping
    let scale = Math.min(widthScale, heightScale);

    // Capping minimum scale on mobile to keep text and node controls readable
    if (scale < 0.6) {
        scale = 0.6;
        isMobileScroll = true;
        wrapper.style.overflowX = "auto";
        wrapper.style.overflowY = "hidden";
    } else {
        wrapper.style.overflowX = "hidden";
                wrapper.style.overflowY = "hidden";
    }

    canvas.style.transform = `scale(${scale})`;
    canvas.style.setProperty('--scale-factor', scale);
    
    const scaledWidth = 1200 * scale;
    const scaledHeight = 660 * scale;
    
    if (scrollContainer) {
        scrollContainer.style.width = scaledWidth + 'px';
        scrollContainer.style.height = scaledHeight + 'px';
        
        // Centering alignment
        if (!isMobileScroll && containerWidth > scaledWidth) {
            scrollContainer.style.marginLeft = ((containerWidth - scaledWidth) / 2) + 'px';
        } else {
            scrollContainer.style.marginLeft = '0px';
        }

        if (containerHeight > scaledHeight) {
            scrollContainer.style.marginTop = ((containerHeight - scaledHeight) / 2) + 'px';
        } else {
            scrollContainer.style.marginTop = '0px';
        }
    }
    
    if (window.innerWidth > 1100) {
        wrapper.style.height = "";
    } else {
        wrapper.style.height = scaledHeight + 'px';
    }
}

window.addEventListener('resize', resizeGrid);
window.addEventListener('load', resizeGrid);
if (document.readyState === 'complete' || document.readyState === 'interactive') {
    resizeGrid();
} else {
    document.addEventListener('DOMContentLoaded', resizeGrid);
}

// =====================================
// CHART.JS INITIALIZATION
// =====================================
function initChart() {
    const ctx = document.getElementById('trendsChart').getContext('2d');
    
    // Create beautiful modern gradients
    const genGrad = ctx.createLinearGradient(0, 0, 0, 200);
    genGrad.addColorStop(0, 'rgba(249, 115, 22, 0.22)');
    genGrad.addColorStop(1, 'rgba(249, 115, 22, 0.00)');

    const demGrad = ctx.createLinearGradient(0, 0, 0, 200);
    demGrad.addColorStop(0, 'rgba(236, 72, 153, 0.22)');
    demGrad.addColorStop(1, 'rgba(236, 72, 153, 0.00)');

    trendsChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: Array(30).fill(''),
            datasets: [
                {
                    label: 'Gen (kW)',
                    borderColor: '#f97316',
                    backgroundColor: genGrad,
                    borderWidth: 2.5,
                    pointRadius: 0,
                    data: chartGenHistory,
                    fill: true,
                    tension: 0.4
                },
                {
                    label: 'Demand (kW)',
                    borderColor: '#ec4899',
                    backgroundColor: demGrad,
                    borderWidth: 2.5,
                    pointRadius: 0,
                    data: chartDemHistory,
                    fill: true,
                    tension: 0.4
                },
                {
                    label: 'Battery SoC (%)',
                    borderColor: '#6366f1',
                    borderWidth: 2,
                    borderDash: [4, 4],
                    pointRadius: 0,
                    yAxisID: 'ySoC',
                    data: chartSoCHistory,
                    tension: 0.4
                },
                {
                    label: 'H₂ Tank (kg)',
                    borderColor: '#06b6d4',
                    borderWidth: 2,
                    borderDash: [6, 2],
                    pointRadius: 0,
                    yAxisID: 'yH2',
                    data: chartH2History,
                    tension: 0.4
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
                mode: 'index',
                intersect: false
            },
            plugins: {
                legend: { display: false },
                tooltip: {
                    backgroundColor: 'rgba(15, 23, 42, 0.92)',
                    titleColor: '#f8fafc',
                    bodyColor: '#e2e8f0',
                    titleFont: { family: 'Inter', size: 11, weight: 'bold' },
                    bodyFont: { family: 'Inter', size: 11 },
                    padding: 10,
                    cornerRadius: 8,
                    displayColors: true,
                    borderColor: 'rgba(255, 255, 255, 0.1)',
                    borderWidth: 1
                }
            },
            scales: {
                x: {
                    grid: { display: false },
                    ticks: { display: false }
                },
                y: {
                    title: { display: true, text: 'Power (kW)', font: { family: 'Inter', size: 10, weight: 'bold' } },
                    grid: { color: 'rgba(148, 163, 184, 0.06)', borderDash: [5, 5] },
                    ticks: { font: { family: 'Inter', size: 9 } },
                    min: 0,
                    max: 1800
                },
                ySoC: {
                    position: 'right',
                    title: { display: true, text: 'SoC (%)', font: { family: 'Inter', size: 10, weight: 'bold' } },
                    grid: { display: false },
                    ticks: { font: { family: 'Inter', size: 9 } },
                    min: 0,
                    max: 100
                },
                yH2: {
                    position: 'right',
                    title: { display: true, text: 'H₂ Tank (kg)', font: { family: 'Inter', size: 10, weight: 'bold' } },
                    grid: { display: false },
                    ticks: { font: { family: 'Inter', size: 9 } },
                    min: 0,
                    max: H2_TANK_CAPACITY
                }
            }
        }
    });

    setupLegendToggles();
}

function setupLegendToggles() {
    const legendIds = [
        { elId: 'legendGen', index: 0 },
        { elId: 'legendDem', index: 1 },
        { elId: 'legendSoC', index: 2 },
        { elId: 'legendH2', index: 3 }
    ];

    legendIds.forEach(item => {
        const el = document.getElementById(item.elId);
        if (el) {
            el.addEventListener('click', () => {
                const isVisible = trendsChart.isDatasetVisible(item.index);
                if (isVisible) {
                    trendsChart.hide(item.index);
                    el.style.opacity = '0.35';
                    el.style.textDecoration = 'line-through';
                } else {
                    trendsChart.show(item.index);
                    el.style.opacity = '1';
                    el.style.textDecoration = 'none';
                }
            });
        }
    });
}

function updateTrendsChart(gen, dem, soc, h2) {
    if (!trendsChart) return;
    
    chartGenHistory.push(gen);
    chartGenHistory.shift();
    chartDemHistory.push(dem);
    chartDemHistory.shift();
    chartSoCHistory.push(soc);
    chartSoCHistory.shift();
    chartH2History.push(h2);
    chartH2History.shift();

    trendsChart.update('none'); // Update without animation for performance
}

// =====================================
// FORMULAS & MATH SIMULATION STEP
// =====================================
function runPhysicsStep() {
    simSeconds++;

    // 1. Gather Inputs
    const irrVal = parseFloat(solarIrradiance.value);
    const tempVal = parseFloat(ambientTemp.value);
    const windSpeedValNum = parseFloat(windSpeed.value);
    const pitchVal = parseFloat(bladePitch.value);
    const biomassFuelRate = parseFloat(biomassFuel.value);
    const isGridTied = gridMode.value === "tied";
    const strategy = emsStrategy.value;
    const isDrActive = demandResponseToggle.checked;
    const capImportVal = parseFloat(shavingLimit.value);

    // Update Slider Labels
    solarIrradianceVal.textContent = irrVal + " W/m²";
    ambientTempVal.textContent = tempVal + " °C";
    windSpeedVal.textContent = windSpeedValNum + " m/s";
    bladePitchVal.textContent = pitchVal + " °";
    biomassFuelVal.textContent = biomassFuelRate + " %";
    shavingLimitVal.textContent = capImportVal + " kW";

    resLoadVal.textContent = resLoad.value + " kW";
    comLoadVal.textContent = comLoad.value + " kW";
    indLoadVal.textContent = indLoad.value + " kW";

    // 2. Solar PV Output
    // T_cell = T_amb + G * 0.025
    const cellTemp = tempVal + (irrVal * 0.025);
    // P_solar = P_rated * (G/1000) * (1 - 0.004 * (T_cell - 25))
    let solarPower = 800 * (irrVal / 1000) * (1 - 0.004 * (cellTemp - 25));
    if (solarPower < 0 || irrVal <= 0) solarPower = 0;

    // 3. Wind Turbine Output
    let windPower = 0;
    const cutIn = 3.0;
    const rated = 12.0;
    const cutOut = 20.0;
    
    const pitchRadian = pitchVal * Math.PI / 180;
    const pitchFactor = Math.cos(pitchRadian);

    if (windSpeedValNum > cutOut) {
        // Storm Lockout
        windPower = 0;
        windBrakeBadge.style.display = "block";
        document.getElementById("wind-rotor").style.animation = "none";
    } else {
        windBrakeBadge.style.display = "none";
        // Blade Rotation Animation
        if (windSpeedValNum >= cutIn) {
            const rotDuration = Math.max(0.3, 10 / windSpeedValNum);
            document.getElementById("wind-rotor").style.animation = `spin ${rotDuration}s linear infinite`;
            
            if (windSpeedValNum <= rated) {
                // Cubic ramp up
                windPower = 600 * ((Math.pow(windSpeedValNum, 3) - Math.pow(cutIn, 3)) / (Math.pow(rated, 3) - Math.pow(cutIn, 3))) * pitchFactor;
            } else {
                // Capped at rated limit
                windPower = 600 * pitchFactor;
            }
        } else {
            document.getElementById("wind-rotor").style.animation = "none";
            windPower = 0;
        }
    }

    // 4. Biomass Plant Output
    const isBiomassOnline = document.getElementById("nodeBiomassOn").classList.contains("active");
    let biomassPower = 0;
    if (isBiomassOnline) {
        biomassPower = 400 * (biomassFuelRate / 100);
        document.getElementById("biomass-flame").classList.add("biomass-pulse");
        const fireDuration = 2 - (biomassFuelRate / 100) * 1.5;
        document.getElementById("biomass-flame").style.animation = `pulse-fire ${fireDuration}s ease-in-out infinite`;
    } else {
        document.getElementById("biomass-flame").classList.remove("biomass-pulse");
        document.getElementById("biomass-flame").style.animation = "none";
    }

    const totalRenewableGen = solarPower + windPower + biomassPower;

    // 5. Consumption Demand
    let resPower = parseFloat(resLoad.value);
    let comPower = parseFloat(comLoad.value);
    let indPower = parseFloat(indLoad.value);

    // Apply Demand Response reductions
    if (isDrActive) {
        resPower = resPower * 0.85;  // 15% shedding
        comPower = comPower * 0.90;  // 10% shedding
        indPower = indPower * 0.85;  // 15% shedding
    }

    const totalDemand = resPower + comPower + indPower;
    let netBalance = totalRenewableGen - totalDemand;

    // 6. EMS Storage and Dispatch Routing Calculations
    let batteryFlow = 0;   // positive is charging, negative is discharging
    let hydrogenFlow = 0;  // positive is electrolysis charging, negative is fuel cell discharging
    let gridFlow = 0;      // positive is exporting, negative is importing
    let curtailment = 0;   // wasted surplus
    let gridEfficiency = 100.0;
    let microgridCondition = "Normal";

    // Sub-calculations limits
    const maxBatteryCharge = 250;      // kW
    const maxBatteryDischarge = 300;   // kW
    const maxElectrolyzerInput = 200;  // kW
    const maxFuelCellOutput = 150;     // kW

    if (netBalance >= 0) {
        // --- SURPLUS STATE ---
        let surplusPower = netBalance;

        // B1. Charge Battery first (if strategy doesn't block it)
        let batteryChargeLimit = maxBatteryCharge;
        if (strategy === "backup") {
            // Keep battery at 100% SoC
            batteryChargeLimit = maxBatteryCharge;
        }
        
        if (batterySoC < 100.0) {
            // Check SoC storage capacity limit in terms of power (kW)
            const batterySpaceKw = ((100.0 - batterySoC) / 100.0) * BATTERY_CAPACITY / (DT * 0.92);
            batteryFlow = Math.min(surplusPower, batteryChargeLimit, batterySpaceKw);
            batterySoC = Math.min(100.0, batterySoC + (batteryFlow * 0.92 * DT / BATTERY_CAPACITY) * 100.0);
            surplusPower -= batteryFlow;
        }

        // B2. Electrolyzer Hydrogen production second
        if (surplusPower > 0 && hydrogenLevel < H2_TANK_CAPACITY) {
            const h2SpaceKg = H2_TANK_CAPACITY - hydrogenLevel;
            // Max electrical input corresponding to remaining hydrogen space: Space * 33.33 / (Eff * DT)
            const h2SpaceKw = (h2SpaceKg * 33.33) / (0.65 * DT);
            
            hydrogenFlow = Math.min(surplusPower, maxElectrolyzerInput, h2SpaceKw);
            
            // Produced kg = (kW * 65% * DT) / 33.33
            const h2Produced = (hydrogenFlow * 0.65 * DT) / 33.33;
            hydrogenLevel = Math.min(H2_TANK_CAPACITY, hydrogenLevel + h2Produced);
            
            surplusPower -= hydrogenFlow;
        }

        // B3. Grid Export or Curtailment
        if (surplusPower > 0) {
            if (isGridTied) {
                gridFlow = surplusPower; // Export to grid
            } else {
                curtailment = surplusPower; // Islanded: Wasted curtailment
                microgridCondition = "Curtailment Active";
            }
        }

    } else {
        // --- DEFICIT STATE ---
        let deficitPower = -netBalance;

        // Decide battery discharge allowance based on strategy
        let canDischargeBattery = true;
        let batteryDischargeNeed = deficitPower;

        if (isGridTied) {
            if (strategy === "backup") {
                // Do not discharge battery (save for outages!)
                canDischargeBattery = false;
            } else if (strategy === "shaving") {
                // Only discharge battery if import exceeds the cap
                if (deficitPower > capImportVal) {
                    batteryDischargeNeed = deficitPower - capImportVal;
                } else {
                    canDischargeBattery = false;
                }
            }
        }

        // B1. Discharge Battery
        if (canDischargeBattery && batterySoC > 10.0) {
            // Check battery energy availability limit (kW)
            const batteryAvailKw = ((batterySoC - 10.0) / 100.0) * BATTERY_CAPACITY * 0.92 / DT;
            const battDischgLimit = Math.min(batteryDischargeNeed, maxBatteryDischarge);
            
            batteryFlow = -Math.min(battDischgLimit, batteryAvailKw);
            
            // Update SoC
            batterySoC = Math.max(10.0, batterySoC + (batteryFlow / 0.92 * DT / BATTERY_CAPACITY) * 100.0);
            deficitPower += batteryFlow; // batteryFlow is negative, so this reduces deficit
        }

        // B2. Hydrogen Fuel Cell
        let canUseFuelCell = true;
        let fcNeed = deficitPower;
        
        if (isGridTied && strategy === "shaving") {
            if (deficitPower > capImportVal) {
                fcNeed = deficitPower - capImportVal;
            } else {
                canUseFuelCell = false;
            }
        }

        if (canUseFuelCell && deficitPower > 0 && hydrogenLevel > 0) {
            const h2EnergyAvailKw = hydrogenLevel * 33.33 * 0.55 / DT;
            const fcLimit = Math.min(fcNeed, maxFuelCellOutput);
            
            const fcOutput = Math.min(fcLimit, h2EnergyAvailKw);
            hydrogenFlow = -fcOutput; // negative flow indicating fuel cell output
            
            // Consume hydrogen: consumed = (FC_Output / 55% / 33.33) * DT
            const h2Consumed = (fcOutput / 0.55 / 33.33) * DT;
            hydrogenLevel = Math.max(0.0, hydrogenLevel - h2Consumed);
            
            deficitPower -= fcOutput;
        }

        // B3. Grid Import or Blackout/Shedding
        if (deficitPower > 0) {
            if (isGridTied) {
                gridFlow = -deficitPower; // Import backup power from Grid
                if (strategy === "shaving" && -gridFlow > capImportVal) {
                    microgridCondition = "Cap Exceeded";
                } else {
                    microgridCondition = "Importing Power";
                }
            } else {
                // Islanded: Deficit cannot be met! Trigger Load Shedding or Blackout
                gridEfficiency = ((totalDemand - deficitPower) / totalDemand) * 100.0;
                if (gridEfficiency < 0) gridEfficiency = 0.0;
                
                if (gridEfficiency <= 0.0) {
                    microgridCondition = "SYSTEM BLACKOUT";
                } else {
                    microgridCondition = "LOAD SHEDDING";
                }
            }
        }
    }

    // 7. Update UI Displays

    // Nodes values
    nodeSolarVal.textContent = Math.round(solarPower) + " kW";
    nodeWindVal.textContent = Math.round(windPower) + " kW";
    nodeBiomassVal.textContent = Math.round(biomassPower) + " kW";
    nodeBatteryVal.textContent = batterySoC.toFixed(1) + "% SoC";
    nodeBatteryBar.style.width = batterySoC + "%";
    
    nodeHydrogenVal.textContent = hydrogenLevel.toFixed(1) + " kg H₂";
    nodeHydrogenBar.style.width = ((hydrogenLevel / H2_TANK_CAPACITY) * 100.0) + "%";

    // Set Node Badges
    // Battery badge
    if (batteryFlow > 5) {
        batteryStatusBadge.textContent = "CHARGING";
        batteryStatusBadge.className = "node-badge badge-info";
        document.getElementById("battery-plus-icon").style.display = "block";
    } else if (batteryFlow < -5) {
        batteryStatusBadge.textContent = "DISCHG";
        batteryStatusBadge.className = "node-badge badge-warning";
        document.getElementById("battery-plus-icon").style.display = "none";
    } else {
        batteryStatusBadge.textContent = "STANDBY";
        batteryStatusBadge.className = "node-badge badge-success";
        document.getElementById("battery-plus-icon").style.display = "block";
    }

    // Hydrogen badge
    if (hydrogenFlow > 5) {
        h2StatusBadge.style.display = "block";
        h2StatusBadge.textContent = "ELECTROLYSIS";
        h2StatusBadge.className = "node-badge badge-info";
        // Show bubbles
        document.getElementById("hBubble1").style.display = "block";
        document.getElementById("hBubble2").style.display = "block";
        document.getElementById("hBubble3").style.display = "block";
    } else if (hydrogenFlow < -5) {
        h2StatusBadge.style.display = "block";
        h2StatusBadge.textContent = "FUEL CELL";
        h2StatusBadge.className = "node-badge badge-warning";
        // Hide bubbles
        document.getElementById("hBubble1").style.display = "none";
        document.getElementById("hBubble2").style.display = "none";
        document.getElementById("hBubble3").style.display = "none";
    } else {
        h2StatusBadge.style.display = "none";
        document.getElementById("hBubble1").style.display = "none";
        document.getElementById("hBubble2").style.display = "none";
        document.getElementById("hBubble3").style.display = "none";
    }

    // Utility Grid node value and badge
    if (isGridTied) {
        nodeUtilityBadge.textContent = "TIED";
        nodeUtilityBadge.className = "node-badge badge-success";
        
        if (gridFlow > 5) {
            nodeUtilityVal.textContent = "EXPORTING: " + Math.round(gridFlow) + " kW";
        } else if (gridFlow < -5) {
            nodeUtilityVal.textContent = "IMPORTING: " + Math.round(-gridFlow) + " kW";
        } else {
            nodeUtilityVal.textContent = "GRID BALANCED";
        }
    } else {
        nodeUtilityBadge.textContent = "ISLAND";
        nodeUtilityBadge.className = "node-badge badge-danger";
        nodeUtilityVal.textContent = "DISCONNECTED";
    }

    // Controller values and telemetry indicator
    nodeControllerVal.textContent = microgridCondition;
    const controllerNodeEl = document.getElementById("node-controller");
    
    if (microgridCondition === "SYSTEM BLACKOUT") {
        controllerNodeEl.style.borderColor = "var(--color-danger)";
        controllerNodeEl.style.backgroundColor = "#ffe4e6";
    } else if (microgridCondition === "LOAD SHEDDING" || microgridCondition === "Cap Exceeded") {
        controllerNodeEl.style.borderColor = "var(--color-warning)";
        controllerNodeEl.style.backgroundColor = "#fef3c7";
    } else {
        controllerNodeEl.style.borderColor = "var(--color-controller)";
        controllerNodeEl.style.backgroundColor = "var(--color-controller-light)";
    }

    // Consumer Loads values & LEDs based on Load Shedding
    nodeResVal.textContent = Math.round(resPower) + " kW";
    nodeComVal.textContent = Math.round(comPower) + " kW";
    nodeIndVal.textContent = Math.round(indPower) + " kW";

    if (gridEfficiency >= 100) {
        nodeResLed.className = "led led-active";
        nodeComLed.className = "led led-active";
        nodeIndLed.className = "led led-active";
    } else if (gridEfficiency >= 70) {
        nodeResLed.className = "led led-active";
        nodeComLed.className = "led led-active";
        nodeIndLed.className = "led led-danger"; // Industrial shed
        nodeIndVal.textContent = "SHED (0 kW)";
    } else if (gridEfficiency >= 40) {
        nodeResLed.className = "led led-active";
        nodeComLed.className = "led led-danger"; // Commercial shed
        nodeIndLed.className = "led led-danger";
        nodeComVal.textContent = "SHED (0 kW)";
        nodeIndVal.textContent = "SHED (0 kW)";
    } else {
        nodeResLed.className = "led led-danger"; // All shed (Blackout)
        nodeComLed.className = "led led-danger";
        nodeIndLed.className = "led led-danger";
        nodeResVal.textContent = "BLACKOUT";
        nodeComVal.textContent = "BLACKOUT";
        nodeIndVal.textContent = "BLACKOUT";
    }

    // 8. Particle Cable Flows Classes Updates
    // Solar flow
    const pSolar = document.getElementById("path-solar");
    if (solarPower > 5) pSolar.classList.add("flow-active-forward");
    else pSolar.classList.remove("flow-active-forward");

    // Wind flow
    const pWind = document.getElementById("path-wind");
    if (windPower > 5) pWind.classList.add("flow-active-forward");
    else pWind.classList.remove("flow-active-forward");

    // Biomass flow
    const pBiomass = document.getElementById("path-biomass");
    if (biomassPower > 5) pBiomass.classList.add("flow-active-forward");
    else pBiomass.classList.remove("flow-active-forward");

    // Battery flow (path goes battery -> controller, so charging is backward)
    const pBattery = document.getElementById("path-battery");
    pBattery.classList.remove("flow-active-forward", "flow-active-backward");
    if (batteryFlow > 5) pBattery.classList.add("flow-active-backward");
    else if (batteryFlow < -5) pBattery.classList.add("flow-active-forward");

    // Hydrogen flow (path goes controller -> H2, so electrolysis is forward)
    const pHydrogen = document.getElementById("path-hydrogen");
    pHydrogen.classList.remove("flow-active-forward", "flow-active-backward");
    if (hydrogenFlow > 5) pHydrogen.classList.add("flow-active-forward");
    else if (hydrogenFlow < -5) pHydrogen.classList.add("flow-active-backward");

    // Utility Grid flow (path goes controller -> utility, so exporting is forward)
    const pUtility = document.getElementById("path-utility");
    pUtility.classList.remove("flow-active-forward", "flow-active-backward");
    if (gridFlow > 5) pUtility.classList.add("flow-active-forward");
    else if (gridFlow < -5) pUtility.classList.add("flow-active-backward");

    // Consumer Loads flows
    const pRes = document.getElementById("path-res");
    const pCom = document.getElementById("path-com");
    const pInd = document.getElementById("path-ind");
    
    if (gridEfficiency >= 100) {
        pRes.classList.add("flow-active-forward");
        pCom.classList.add("flow-active-forward");
        pInd.classList.add("flow-active-forward");
    } else if (gridEfficiency >= 70) {
        pRes.classList.add("flow-active-forward");
        pCom.classList.add("flow-active-forward");
        pInd.classList.remove("flow-active-forward");
    } else if (gridEfficiency >= 40) {
        pRes.classList.add("flow-active-forward");
        pCom.classList.remove("flow-active-forward");
        pInd.classList.remove("flow-active-forward");
    } else {
        pRes.classList.remove("flow-active-forward");
        pCom.classList.remove("flow-active-forward");
        pInd.classList.remove("flow-active-forward");
    }

    // 9. SCADA Telemetry Metrics Updates
    const genStatus = totalRenewableGen > 5 ? " (Active)" : " (Offline)";
    metricTotalGen.textContent = Math.round(totalRenewableGen) + " kW" + genStatus;

    let demandStatus = " (Normal)";
    if (microgridCondition === "SYSTEM BLACKOUT") {
        demandStatus = " (Blackout)";
    } else if (microgridCondition === "LOAD SHEDDING") {
        demandStatus = " (Shedding)";
    }
    metricTotalDemand.textContent = Math.round(totalDemand) + " kW" + demandStatus;
    
    const balanceSign = netBalance >= 0 ? "+" : "";
    const balanceStatus = Math.round(netBalance) > 5 ? " (Surplus)" : (Math.round(netBalance) < -5 ? " (Deficit)" : " (Balanced)");
    metricNetBalance.textContent = balanceSign + Math.round(netBalance) + " kW" + balanceStatus;

    const cellTempStatus = cellTemp < 25 ? " (Cool)" : (cellTemp > 45 ? " (Hot)" : " (Normal)");
    metricCellTemp.textContent = cellTemp.toFixed(1) + " °C" + cellTempStatus;

    let batSign = batteryFlow > 5 ? "+" : "";
    const batteryStatus = batteryFlow > 5 ? " (Charging)" : (batteryFlow < -5 ? " (Discharging)" : " (Standby)");
    metricBatteryFlow.textContent = batSign + Math.round(batteryFlow) + " kW" + batteryStatus;

    let h2Sign = hydrogenFlow > 5 ? "+" : "";
    const h2Status = hydrogenFlow > 5 ? " (Electrolysis)" : (hydrogenFlow < -5 ? " (Fuel Cell)" : " (Standby)");
    metricHydrogenFlow.textContent = h2Sign + Math.round(hydrogenFlow) + " kW" + h2Status;

    let gridSign = gridFlow > 5 ? "+" : "";
    const gridStatus = !isGridTied ? " (Off-Grid)" : (gridFlow > 5 ? " (Exporting)" : (gridFlow < -5 ? " (Importing)" : " (Balanced)"));
    metricGridFlow.textContent = gridSign + Math.round(gridFlow) + " kW" + gridStatus;

    // Condition Text
    let conditionText = "Normal";
    if (microgridCondition === "SYSTEM BLACKOUT") {
        conditionText = "Blackout Alert";
        metricCondition.style.color = "var(--color-danger)";
    } else if (microgridCondition === "LOAD SHEDDING") {
        conditionText = "Shedding Active";
        metricCondition.style.color = "var(--color-warning)";
    } else if (microgridCondition === "Cap Exceeded") {
        conditionText = "EMS Cap Exceeded";
        metricCondition.style.color = "var(--color-danger)";
    } else if (windSpeedValNum > cutOut) {
        conditionText = "Storm Prot.";
        metricCondition.style.color = "var(--color-warning)";
    } else {
        metricCondition.style.color = "var(--text-primary)";
    }
    metricCondition.textContent = conditionText;

    // 10. Update trends history
    updateTrendsChart(totalRenewableGen, totalDemand, batterySoC, hydrogenLevel);
}


// =====================================
// PRESETS ACTIVATORS
// =====================================
function applyPreset(scenario) {
    if (scenario === "standard") {
        solarIrradiance.value = 800;
        ambientTemp.value = 25;
        windSpeed.value = 8;
        bladePitch.value = 0;
        biomassFuel.value = 50;
        gridMode.value = "tied";
        emsStrategy.value = "consumption";
        demandResponseToggle.checked = false;
        resLoad.value = 200;
        comLoad.value = 250;
        indLoad.value = 450;
        
        document.getElementById("nodeBiomassOn").classList.add("active");
        document.getElementById("nodeBiomassOff").classList.remove("active");
    } 
    else if (scenario === "peak") {
        solarIrradiance.value = 200; // cloudy
        ambientTemp.value = 30;
        windSpeed.value = 4;   // calm
        bladePitch.value = 0;
        biomassFuel.value = 20;
        gridMode.value = "tied";
        emsStrategy.value = "shaving";
        shavingLimit.value = 300;
        demandResponseToggle.checked = false;
        resLoad.value = 280;
        comLoad.value = 325;
        indLoad.value = 630;

        document.getElementById("nodeBiomassOn").classList.add("active");
        document.getElementById("nodeBiomassOff").classList.remove("active");
    } 
    else if (scenario === "storm") {
        solarIrradiance.value = 50;  // heavy overcast storm
        ambientTemp.value = 15;
        windSpeed.value = 22;  // above 20 m/s cutoff!
        bladePitch.value = 0;
        biomassFuel.value = 80;
        gridMode.value = "tied";
        emsStrategy.value = "consumption";
        demandResponseToggle.checked = false;
        resLoad.value = 200;
        comLoad.value = 225;
        indLoad.value = 360;

        document.getElementById("nodeBiomassOn").classList.add("active");
        document.getElementById("nodeBiomassOff").classList.remove("active");
    } 
    else if (scenario === "outage") {
        solarIrradiance.value = 0;   // night
        ambientTemp.value = 20;
        windSpeed.value = 6;   // gentle breeze
        bladePitch.value = 0;
        biomassFuel.value = 50;
        gridMode.value = "island";  // Disconnected from external grid!
        emsStrategy.value = "consumption";
        demandResponseToggle.checked = true; // DR on to stretch storage
        resLoad.value = 200;
        comLoad.value = 185;
        indLoad.value = 225;
    }

    // Force visible dropdown groups toggle
    toggleShavingGroup();
    // Run an instant physics step to update visual nodes immediately
    runPhysicsStep();
}

function toggleShavingGroup() {
    if (emsStrategy.value === "shaving" && gridMode.value === "tied") {
        shavingLimitGroup.style.display = "block";
    } else {
        shavingLimitGroup.style.display = "none";
    }
}

// =====================================
// LAB LOOP CONTROLS
// =====================================
function startSimulation() {
    if (simRunning) return;
    simRunning = true;
    startBtn.disabled = true;
    stopBtn.disabled = false;
    document.querySelector('.scada-grid-canvas').classList.remove('paused');
    
    simInterval = setInterval(runPhysicsStep, 1000);
}

function stopSimulation() {
    if (!simRunning) return;
    simRunning = false;
    startBtn.disabled = false;
    stopBtn.disabled = true;
    document.querySelector('.scada-grid-canvas').classList.add('paused');
    
    clearInterval(simInterval);
}

function resetSimulation() {
    stopSimulation();
    simSeconds = 0;
    batterySoC = 50.0;
    hydrogenLevel = 0.0;
    
    // Clear histories
    chartGenHistory.fill(0);
    chartDemHistory.fill(0);
    chartSoCHistory.fill(50);
    chartH2History.fill(0);
    
    if (trendsChart) {
        trendsChart.update('none');
    }

    // Reset standard sliders
    applyPreset("standard");
}

// =====================================
// INITIAL SETUP BINDINGS
// =====================================
function bindEventListeners() {
    // Mobile Tabs Navigation
    const tabBtns = document.querySelectorAll('.tab-btn');
    const mainContainer = document.querySelector('.main-container');
    
    tabBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            const clickedBtn = e.currentTarget;
            const target = clickedBtn.getAttribute('data-target');
            
            // Toggle active tab buttons
            tabBtns.forEach(b => b.classList.remove('active'));
            clickedBtn.classList.add('active');
            
            // Toggle panel visibility class
            mainContainer.classList.remove('show-controls', 'show-scada', 'show-metrics');
            if (target === 'controls') {
                mainContainer.classList.add('show-controls');
            } else if (target === 'scada') {
                mainContainer.classList.add('show-scada');
            } else if (target === 'metrics') {
                mainContainer.classList.add('show-metrics');
            }
            
            // Recalculate dimensions for SCADA and Chart
            resizeGrid();
            if (trendsChart) {
                trendsChart.resize();
            }
        });
    });

    startBtn.addEventListener('click', startSimulation);
    stopBtn.addEventListener('click', stopSimulation);
    resetBtn.addEventListener('click', resetSimulation);


    // Preset Triggers
    presetStandard.addEventListener('click', () => applyPreset("standard"));
    presetPeakLoad.addEventListener('click', () => applyPreset("peak"));
    presetStorm.addEventListener('click', () => applyPreset("storm"));
    presetOutage.addEventListener('click', () => applyPreset("outage"));

    // Dropdowns changes
    gridMode.addEventListener('change', () => {
        toggleShavingGroup();
        runPhysicsStep();
    });
    emsStrategy.addEventListener('change', () => {
        toggleShavingGroup();
        runPhysicsStep();
    });

    // Node Interactive Switches
    // Solar manual controls
    document.getElementById("nodeSolarSun").addEventListener('click', (e) => {
        solarIrradiance.value = 1000;
        document.querySelectorAll("#node-solar .node-btn").forEach(b => b.classList.remove("active"));
        e.target.classList.add("active");
        runPhysicsStep();
    });
    document.getElementById("nodeSolarCloud").addEventListener('click', (e) => {
        solarIrradiance.value = 300;
        document.querySelectorAll("#node-solar .node-btn").forEach(b => b.classList.remove("active"));
        e.target.classList.add("active");
        runPhysicsStep();
    });
    document.getElementById("nodeSolarNight").addEventListener('click', (e) => {
        solarIrradiance.value = 0;
        document.querySelectorAll("#node-solar .node-btn").forEach(b => b.classList.remove("active"));
        e.target.classList.add("active");
        runPhysicsStep();
    });

    // Biomass manual controls
    document.getElementById("nodeBiomassOn").addEventListener('click', (e) => {
        document.getElementById("nodeBiomassOn").classList.add("active");
        document.getElementById("nodeBiomassOff").classList.remove("active");
        runPhysicsStep();
    });
    document.getElementById("nodeBiomassOff").addEventListener('click', (e) => {
        document.getElementById("nodeBiomassOn").classList.remove("active");
        document.getElementById("nodeBiomassOff").classList.add("active");
        runPhysicsStep();
    });

    // Slider continuous updates
    const sliders = [
        solarIrradiance, ambientTemp, windSpeed, bladePitch, biomassFuel,
        shavingLimit, resLoad, comLoad, indLoad
    ];
    sliders.forEach(slider => {
        slider.addEventListener('input', runPhysicsStep);
    });

}

// =====================================
// INITIALIZATION ON LOAD
// =====================================
document.addEventListener('DOMContentLoaded', () => {
    initChart();
    bindEventListeners();
    
    // Set standard preset values initially
    applyPreset("standard");
    
    // Scale SCADA grid
    resizeGrid();
});