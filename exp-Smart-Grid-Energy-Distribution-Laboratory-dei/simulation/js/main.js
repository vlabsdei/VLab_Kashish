// SMART GRID ENERGY DISTRIBUTION LAB SYSTEM ENGINE

// Keep Virtual Labs parent header visible and lock heights to prevent scrollbars
function adjustParentLayout() {
    try {
        if (window.self !== window.top) {
            const parentDoc = window.parent.document;

            // Ensure parent navbar header is visible
            const parentHeader = parentDoc.querySelector('.simulation-header') || parentDoc.querySelector('.vlabs-header');
            if (parentHeader) {
                parentHeader.style.setProperty('display', 'flex', 'important');
            }
            
            // Ensure floating menu button is visible
            const floatingMenu = parentDoc.getElementById('toggle-menu-float-button');
            if (floatingMenu) {
                floatingMenu.style.setProperty('display', 'block', 'important');
            }

            // Lock parent body and html to prevent outer page scrollbar
            const parentHtml = parentDoc.documentElement;
            const parentBody = parentDoc.body;
            if (parentHtml && parentBody) {
                parentHtml.style.setProperty('overflow', 'hidden', 'important');
                parentBody.style.setProperty('overflow', 'hidden', 'important');
                parentBody.style.setProperty('height', '100vh', 'important');
            }
            
            // Measure parent header height and strictly lock the iframe height to prevent feedback loops/cutoffs
            const iframe = parentDoc.getElementById('fraDisabled') || parentDoc.querySelector('iframe');
            if (iframe) {
                let headerHeight = 70; // Standard fallback height
                if (parentHeader) {
                    const measuredHeight = parentHeader.offsetHeight;
                    if (measuredHeight > 40) {
                        headerHeight = measuredHeight;
                    }
                }
                iframe.style.setProperty('height', `calc(100vh - ${headerHeight}px)`, 'important');
                iframe.style.setProperty('min-height', `calc(100vh - ${headerHeight}px)`, 'important');
            }
            
            // Adjust padding of parent content container
            const parentContent = parentDoc.querySelector('.vlabs-page-content');
            if (parentContent) {
                parentContent.style.setProperty('padding-bottom', '0', 'important');
                parentContent.style.setProperty('margin', '0', 'important');
            }
        }
    } catch (e) {
        console.warn("Could not modify parent layout due to cross-origin restriction:", e);
    }
}
adjustParentLayout();
window.addEventListener('load', adjustParentLayout);
window.addEventListener('resize', adjustParentLayout);

// Input Elements
const solarPower = document.getElementById("solarPower");
const windPower = document.getElementById("windPower");
const residentialLoad = document.getElementById("residentialLoad");
const commercialLoad = document.getElementById("commercialLoad");
const industrialLoad = document.getElementById("industrialLoad");

// Display Elements (Control Panel labels)
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
const utilityOutput = document.getElementById("utilityOutput");
const batteryOutput = document.getElementById("batteryOutput");

// Result Cards
const generatedPower = document.getElementById("generatedPower");
const totalDemand = document.getElementById("totalDemand");
const surplusPower = document.getElementById("surplusPower");
const gridEfficiency = document.getElementById("gridEfficiency");
const renewableUtilization = document.getElementById("renewableUtilization");
const gridCondition = document.getElementById("gridCondition");
const svgSurplus = document.getElementById("svgSurplus");

// Status Panel
const generatedPowerStatus = document.getElementById("generatedPowerStatus");
const totalDemandStatus = document.getElementById("totalDemandStatus");
const netBalanceStatus = document.getElementById("netBalanceStatus");
const efficiencyStatus = document.getElementById("efficiencyStatus");
const gridStatus = document.getElementById("gridStatus");

// Toggles & Presets
const islandModeToggle = document.getElementById("islandModeToggle");
const startBtn = document.getElementById("startBtn");
const stopBtn = document.getElementById("stopBtn");
const resetBtn = document.getElementById("resetBtn");

// SIMULATION STATE VARIABLES
let simulationRunning = false;
let batteryCharge = 50.0; // Current battery charge percentage (0 to 100)
const batteryCapacity = 1000; // Total capacity in kWh
let simulationInterval = null;

// SCADA Chart History Data
let chartGenHistory = Array(30).fill(0);
let chartDemHistory = Array(30).fill(0);

// =====================================
// DYNAMIC RESIZER
// =====================================
function resizeGrid() {
    const wrapper = document.querySelector('.intersection-wrapper');
    const grid = document.querySelector('.smart-grid');
    if (!wrapper || !grid) return;

    const containerWidth = wrapper.clientWidth;
    const containerHeight = wrapper.clientHeight;

    const scaleWidth = containerWidth / 1200; // 1200px is logical coordinate width
    const scaleHeight = containerHeight / 585; // 585px is logical coordinate height
    const scale = Math.min(scaleWidth, scaleHeight) * 0.98;

    // Apply inline transform directly to ensure absolute centering and scaling compatibility
    grid.style.transform = `translate(-50%, -50%) scale(${scale})`;
    grid.style.setProperty('--scale-factor', scale);
}

window.addEventListener('resize', resizeGrid);
window.addEventListener('load', resizeGrid);
if (document.readyState === 'complete' || document.readyState === 'interactive') {
    resizeGrid();
} else {
    document.addEventListener('DOMContentLoaded', resizeGrid);
}

// =====================================
// INITIAL UTILITY LABELS
// =====================================
function updateSliderLabels() {
    solarPowerValue.textContent = solarPower.value + " kW";
    windPowerValue.textContent = windPower.value + " kW";
    residentialLoadValue.textContent = residentialLoad.value + " kW";
    commercialLoadValue.textContent = commercialLoad.value + " kW";
    industrialLoadValue.textContent = industrialLoad.value + " kW";
}

// =====================================
// SCADA CHART RENDERER
// =====================================
function updateScadaChart(newGen, newDem) {
    chartGenHistory.push(newGen);
    chartGenHistory.shift();
    chartDemHistory.push(newDem);
    chartDemHistory.shift();

    const chart = document.getElementById("scadaChart");
    const lineGen = document.getElementById("chartLineGen");
    const lineDem = document.getElementById("chartLineDem");
    const areaGen = document.getElementById("chartAreaGen");
    const areaDem = document.getElementById("chartAreaDem");
    
    if (!chart || !lineGen || !lineDem) return;

    const maxVal = 2200; // Scale height dynamically based on max load capacity
    const width = 940; // Spans from 0 to 940, leaving 60px on right for live values
    const height = 280;
    const padding = 10;
    
    const pointsCount = chartGenHistory.length;
    const stepX = width / (pointsCount - 1);

    // Build SVG Path Coordinates
    let genPathPoints = [];
    let demPathPoints = [];

    for (let i = 0; i < pointsCount; i++) {
        const x = i * stepX;
        const yGen = height - padding - (chartGenHistory[i] / maxVal) * (height - 2 * padding);
        const yDem = height - padding - (chartDemHistory[i] / maxVal) * (height - 2 * padding);
        
        genPathPoints.push(`${x},${yGen}`);
        demPathPoints.push(`${x},${yDem}`);
    }

    // Set lines paths
    lineGen.setAttribute("d", `M ${genPathPoints.join(" L ")}`);
    lineDem.setAttribute("d", `M ${demPathPoints.join(" L ")}`);

    // Set filled area paths (close paths at bottom)
    areaGen.setAttribute("d", `M 0,${height} L ${genPathPoints.join(" L ")} L ${width},${height} Z`);
    areaDem.setAttribute("d", `M 0,${height} L ${demPathPoints.join(" L ")} L ${width},${height} Z`);

    // Update Historical Plot Markers
    const genMarkersGroup = document.getElementById("genMarkers");
    const demMarkersGroup = document.getElementById("demMarkers");
    if (genMarkersGroup && demMarkersGroup) {
        let genMarkersHTML = "";
        let demMarkersHTML = "";
        for (let i = 0; i < pointsCount; i++) {
            const x = i * stepX;
            const yGen = height - padding - (chartGenHistory[i] / maxVal) * (height - 2 * padding);
            const yDem = height - padding - (chartDemHistory[i] / maxVal) * (height - 2 * padding);
            
            genMarkersHTML += `<circle cx="${x}" cy="${yGen}" r="3.2" fill="#10b981" stroke="#ffffff" stroke-width="1" pointer-events="none" />`;
            demMarkersHTML += `<circle cx="${x}" cy="${yDem}" r="3.2" fill="#2563eb" stroke="#ffffff" stroke-width="1" pointer-events="none" />`;
        }
        genMarkersGroup.innerHTML = genMarkersHTML;
        demMarkersGroup.innerHTML = demMarkersHTML;
    }

    // Update Live Markers & Values
    const lastIdx = pointsCount - 1;
    const xLive = lastIdx * stepX; // 940
    const yGenLive = height - padding - (chartGenHistory[lastIdx] / maxVal) * (height - 2 * padding);
    const yDemLive = height - padding - (chartDemHistory[lastIdx] / maxVal) * (height - 2 * padding);
    
    const genPulse = document.getElementById("liveGenPulse");
    const genMarker = document.getElementById("liveGenMarker");
    const genVal = document.getElementById("liveGenVal");
    
    const demPulse = document.getElementById("liveDemPulse");
    const demMarker = document.getElementById("liveDemMarker");
    const demVal = document.getElementById("liveDemVal");
    
    if (genPulse && genMarker && genVal) {
        genPulse.setAttribute("cx", xLive);
        genPulse.setAttribute("cy", yGenLive);
        genMarker.setAttribute("cx", xLive);
        genMarker.setAttribute("cy", yGenLive);
        genVal.setAttribute("x", xLive + 8);
        genVal.textContent = `${newGen} kW`;
    }
    
    if (demPulse && demMarker && demVal) {
        demPulse.setAttribute("cx", xLive);
        demPulse.setAttribute("cy", yDemLive);
        demMarker.setAttribute("cx", xLive);
        demMarker.setAttribute("cy", yDemLive);
        demVal.setAttribute("x", xLive + 8);
        demVal.textContent = `${newDem} kW`;
    }
    
    // Manage vertical spacing to prevent overlapping labels when lines cross/meet
    if (genVal && demVal) {
        if (Math.abs(yGenLive - yDemLive) < 14) {
            if (yGenLive < yDemLive) {
                genVal.setAttribute("y", yGenLive - 5);
                demVal.setAttribute("y", yDemLive + 11);
            } else {
                genVal.setAttribute("y", yGenLive + 11);
                demVal.setAttribute("y", yDemLive - 5);
            }
        } else {
            genVal.setAttribute("y", yGenLive + 4);
            demVal.setAttribute("y", yDemLive + 4);
        }
    }
}

// =====================================
// TURBINE GRAPHIC ANIMATION CONTROL
// =====================================
function animateTurbine(windPowerVal) {
    const icon = document.getElementById("wind-icon");
    if (!icon) return;

    icon.className = "node-icon turbine-icon"; // Clear
    
    if (windPowerVal === 0) {
        // Stopped
    } else if (windPowerVal === 1000 && document.getElementById("btn-storm").classList.contains("active")) {
        // Storm Lockout Protection (Stopped & Alert)
    } else if (windPowerVal < 300) {
        icon.classList.add("spin-slow");
    } else if (windPowerVal < 700) {
        icon.classList.add("spin-medium");
    } else {
        icon.classList.add("spin-fast");
    }
}

// =====================================
// SIMULATION STEP ENGINE
// =====================================
function runSimulationTick() {
    let solar = Number(solarPower.value);
    let wind = Number(windPower.value);
    const residential = Number(residentialLoad.value);
    const commercial = Number(commercialLoad.value);
    const industrial = Number(industrialLoad.value);
    const isIslanded = islandModeToggle.checked;

    // Grid components DOM
    const nodeSolar = document.getElementById("node-solar");
    const nodeWind = document.getElementById("node-wind");
    const nodeUtility = document.getElementById("node-utility");
    const nodeBattery = document.getElementById("node-battery");
    const nodeRes = document.getElementById("node-res");
    const nodeCom = document.getElementById("node-com");
    const nodeInd = document.getElementById("node-ind");
    const controller = document.getElementById("node-controller");
    const batteryLevelBar = document.getElementById("batteryLevelBar");

    // Clear alert highlights
    nodeWind.classList.remove("storm-alert");
    nodeRes.classList.remove("blackout-state");
    nodeCom.classList.remove("blackout-state");
    nodeInd.classList.remove("blackout-state");

    // STORM LOCKOUT LOGIC:
    const isStorm = document.getElementById("btn-storm").classList.contains("active");
    if (isStorm) {
        wind = 0;
        windPower.value = 0;
        windPowerValue.textContent = "0 kW (LOCKED)";
        nodeWind.classList.add("storm-alert");
    }

    animateTurbine(wind);

    // Sum generation and consumption demand
    const totalGenerated = solar + wind;
    const totalLoad = residential + commercial + industrial;
    let netBalance = totalGenerated - totalLoad;

    let batteryPowerExchange = 0; // Negative = charging, Positive = discharging
    let utilityPowerExchange = 0; // Negative = exporting, Positive = importing
    let actualLoadCovered = totalLoad;
    let blackoutActive = false;

    // BATTERY STORAGE SYSTEM & UTILITY GRID INTEGRATED FLOW LOGIC
    if (netBalance > 0) {
        // POWER SURPLUS:
        // 1. Charge Battery first
        if (batteryCharge < 100) {
            const chargeSpeed = 2.0; // Charge rate multiplier
            batteryCharge = Math.min(100, batteryCharge + chargeSpeed);
            batteryPowerExchange = -Math.min(netBalance, 150); // Cap battery absorption rate
            netBalance += batteryPowerExchange; // Reduce remaining surplus
        }

        // 2. Export remaining surplus to Utility Grid (if tied)
        if (netBalance > 0 && !isIslanded) {
            utilityPowerExchange = -netBalance; // Export surplus
        }
    } else if (netBalance < 0) {
        // POWER DEFICIT:
        let deficitRemaining = Math.abs(netBalance);

        // 1. Discharge battery to cover the deficit
        if (batteryCharge > 0) {
            const dischargeSpeed = 2.0;
            batteryCharge = Math.max(0, batteryCharge - dischargeSpeed);
            batteryPowerExchange = Math.min(deficitRemaining, 200); // Cap max discharge rate
            deficitRemaining -= batteryPowerExchange;
        }

        // 2. Import backup power from utility grid (if tied)
        if (deficitRemaining > 0) {
            if (!isIslanded) {
                utilityPowerExchange = deficitRemaining;
                deficitRemaining = 0;
            } else {
                // 3. BLACKOUT: standalone Island mode has run out of battery!
                blackoutActive = true;
                actualLoadCovered = Math.max(0, totalLoad - deficitRemaining);
            }
        }
    }

    // UPDATE DIAGRAM LABELS & METRIC DOMS
    solarOutput.textContent = solar + " kW";
    windOutput.textContent = wind + " kW";
    residentialDemand.textContent = residential + " kW";
    commercialDemand.textContent = commercial + " kW";
    industrialDemand.textContent = industrial + " kW";

    // Update Battery DOM representation
    batteryLevelBar.style.width = batteryCharge.toFixed(0) + "%";
    
    // Set battery bar charge color depending on state
    batteryLevelBar.className = "battery-level";
    if (batteryPowerExchange < 0) {
        batteryLevelBar.classList.add("charging");
        batteryOutput.textContent = batteryCharge.toFixed(0) + "% (Charging)";
    } else if (batteryPowerExchange > 0) {
        batteryLevelBar.classList.add("discharging");
        batteryOutput.textContent = batteryCharge.toFixed(0) + "% (Discharging)";
    } else {
        batteryOutput.textContent = batteryCharge.toFixed(0) + "% (Standby)";
    }

    // Update Utility Grid DOM
    const utilityBadge = document.getElementById("utilityBadge");
    if (isIslanded) {
        utilityBadge.textContent = "ISLAND";
        utilityBadge.className = "node-badge islanded";
        utilityOutput.textContent = "Offline (Island)";
        nodeUtility.style.borderColor = "rgba(255,255,255,0.08)";
    } else {
        utilityBadge.textContent = "TIED";
        utilityBadge.className = "node-badge";
        if (utilityPowerExchange > 0) {
            utilityOutput.textContent = `Import: ${utilityPowerExchange.toFixed(0)} kW`;
            nodeUtility.style.borderColor = "var(--color-utility)";
        } else if (utilityPowerExchange < 0) {
            utilityOutput.textContent = `Export: ${Math.abs(utilityPowerExchange).toFixed(0)} kW`;
            nodeUtility.style.borderColor = "var(--color-solar)";
        } else {
            utilityOutput.textContent = "Standby (Tied)";
            nodeUtility.style.borderColor = "rgba(255,255,255,0.08)";
        }
    }

    // Blackout / Rolling load shedding visual updates
    if (blackoutActive) {
        nodeRes.classList.add("blackout-state");
        nodeCom.classList.add("blackout-state");
        nodeInd.classList.add("blackout-state");
    }

    // CALCULATE GLOBAL RESULTS
    let efficiency = totalLoad > 0 ? ((actualLoadCovered - Math.max(0, utilityPowerExchange)) / totalLoad) * 100 : 100;
    efficiency = Math.max(0, efficiency);
    efficiency = efficiency.toFixed(1);

    // Update SCADA Header Values
    if (generatedPowerStatus) generatedPowerStatus.textContent = totalGenerated;
    if (totalDemandStatus) totalDemandStatus.textContent = totalLoad;
    
    const balanceSign = (totalGenerated - totalLoad) >= 0 ? "+" : "";
    if (netBalanceStatus) {
        netBalanceStatus.textContent = balanceSign + (totalGenerated - totalLoad);
        netBalanceStatus.className = "value value-balance";
        if (totalGenerated - totalLoad > 0) {
            netBalanceStatus.classList.add("surplus");
        } else if (totalGenerated - totalLoad < 0) {
            netBalanceStatus.classList.add("deficit");
        } else {
            netBalanceStatus.classList.add("balanced");
        }
    }

    if (efficiencyStatus) efficiencyStatus.textContent = efficiency;

    // Update Bottom Results Deck Doms
    generatedPower.textContent = totalGenerated + " kW";
    totalDemand.textContent = totalLoad + " kW";
    surplusPower.textContent = (totalGenerated - totalLoad) + " kW";
    
    if (totalGenerated - totalLoad > 0) {
        surplusPower.style.color = "var(--color-solar)";
        if (svgSurplus) {
            svgSurplus.setAttribute("stroke", "var(--color-solar)");
            svgSurplus.innerHTML = `<line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line>`;
        }
    } else if (totalGenerated - totalLoad < 0) {
        surplusPower.style.color = "var(--color-utility)";
        if (svgSurplus) {
            svgSurplus.setAttribute("stroke", "var(--color-utility)");
            svgSurplus.innerHTML = `<line x1="5" y1="12" x2="19" y2="12"></line>`;
        }
    } else {
        surplusPower.style.color = "var(--color-controller)";
        if (svgSurplus) {
            svgSurplus.setAttribute("stroke", "var(--color-controller)");
            svgSurplus.innerHTML = `<line x1="5" y1="9" x2="19" y2="9"></line><line x1="5" y1="15" x2="19" y2="15"></line>`;
        }
    }

    gridEfficiency.textContent = efficiency + "%";

    // Renewable share / utilization calculation
    let renewShare = totalGenerated > 0 ? (Math.min(totalGenerated, totalLoad) / Math.max(totalLoad, 1)) * 100 : 100;
    
    if (renewShare >= 80) {
        renewableUtilization.textContent = "High";
        renewableUtilization.style.color = "#10b981";
    } else if (renewShare >= 40) {
        renewableUtilization.textContent = "Moderate";
        renewableUtilization.style.color = "#f59e0b";
    } else {
        renewableUtilization.textContent = "Low";
        renewableUtilization.style.color = "#ef4444";
    }

    // Grid Status indicator pill
    if (blackoutActive) {
        gridCondition.textContent = "Blackout / Alarm";
        gridCondition.style.color = "var(--color-utility)";
        if (gridStatus) {
            gridStatus.textContent = "Blackout";
            gridStatus.className = "state-pill status-danger";
        }
    } else if (isStorm) {
        gridCondition.textContent = "Storm Protocol";
        gridCondition.style.color = "var(--color-controller)";
        if (gridStatus) {
            gridStatus.textContent = "Storm Lock";
            gridStatus.className = "state-pill status-warning";
        }
    } else if (utilityPowerExchange > 0) {
        gridCondition.textContent = "Grid Importing";
        gridCondition.style.color = "var(--color-controller)";
        if (gridStatus) {
            gridStatus.textContent = "Importing";
            gridStatus.className = "state-pill status-warning";
        }
    } else if (utilityPowerExchange < 0) {
        gridCondition.textContent = "Grid Exporting";
        gridCondition.style.color = "var(--color-solar)";
        if (gridStatus) {
            gridStatus.textContent = "Exporting";
            gridStatus.className = "state-pill status-normal";
        }
    } else if (batteryPowerExchange > 0) {
        gridCondition.textContent = "Battery Discharging";
        gridCondition.style.color = "var(--color-controller)";
        if (gridStatus) {
            gridStatus.textContent = "Discharging";
            gridStatus.className = "state-pill status-warning";
        }
    } else if (batteryPowerExchange < 0) {
        gridCondition.textContent = "Battery Charging";
        gridCondition.style.color = "var(--color-solar)";
        if (gridStatus) {
            gridStatus.textContent = "Charging";
            gridStatus.className = "state-pill status-normal";
        }
    } else {
        gridCondition.textContent = "Grid Stable";
        gridCondition.style.color = "var(--color-dist)";
        if (gridStatus) {
            gridStatus.textContent = "Balanced";
            gridStatus.className = "state-pill status-normal";
        }
    }

    // =====================================
    // TRANSMISSION POWER FLOW LINES (SVG PATH CONTROL)
    // =====================================
    const flowSolar = document.getElementById("flow-solar");
    const flowWind = document.getElementById("flow-wind");
    const flowUtility = document.getElementById("flow-utility");
    const flowBattery = document.getElementById("flow-battery");
    const flowControllerDist = document.getElementById("flow-controller-dist");
    const flowDistRes = document.getElementById("flow-dist-res");
    const flowDistCom = document.getElementById("flow-dist-com");
    const flowDistInd = document.getElementById("flow-dist-ind");

    if (simulationRunning) {
        if (solar > 0) {
            flowSolar.style.opacity = "1";
            flowSolar.style.stroke = "var(--color-solar)";
            const solarSpeed = Math.max(0.8, 4 - (solar / 250));
            flowSolar.style.setProperty("--flow-speed", `${solarSpeed}s`);
        } else {
            flowSolar.style.opacity = "0";
        }

        if (wind > 0) {
            flowWind.style.opacity = "1";
            flowWind.style.stroke = "var(--color-wind)";
            const windSpeed = Math.max(0.8, 4 - (wind / 250));
            flowWind.style.setProperty("--flow-speed", `${windSpeed}s`);
        } else {
            flowWind.style.opacity = "0";
        }

        if (batteryPowerExchange < 0) {
            flowBattery.style.opacity = "1";
            flowBattery.style.stroke = "var(--color-solar)";
            flowBattery.className = "flow-path flow-forward";
        } else if (batteryPowerExchange > 0) {
            flowBattery.style.opacity = "1";
            flowBattery.style.stroke = "var(--color-controller)";
            flowBattery.className = "flow-path flow-reverse";
        } else {
            flowBattery.style.opacity = "0";
        }

        if (!isIslanded && utilityPowerExchange > 0) {
            flowUtility.style.opacity = "1";
            flowUtility.style.stroke = "var(--color-utility)";
            flowUtility.className = "flow-path flow-forward";
        } else if (!isIslanded && utilityPowerExchange < 0) {
            flowUtility.style.opacity = "1";
            flowUtility.style.stroke = "var(--color-solar)";
            flowUtility.className = "flow-path flow-reverse";
        } else {
            flowUtility.style.opacity = "0";
        }

        if (totalLoad > 0 && !blackoutActive) {
            flowControllerDist.style.opacity = "1";
            flowControllerDist.style.stroke = "var(--color-controller)";
            const transSpeed = Math.max(0.8, 4 - (actualLoadCovered / 500));
            flowControllerDist.style.setProperty("--flow-speed", `${transSpeed}s`);
        } else {
            flowControllerDist.style.opacity = "0";
        }

        if (residential > 0 && !blackoutActive) {
            flowDistRes.style.opacity = "1";
            flowDistRes.style.stroke = "var(--color-dist)";
            const speed = Math.max(0.8, 4 - (residential / 125));
            flowDistRes.style.setProperty("--flow-speed", `${speed}s`);
        } else {
            flowDistRes.style.opacity = "0";
        }

        if (commercial > 0 && !blackoutActive) {
            flowDistCom.style.opacity = "1";
            flowDistCom.style.stroke = "var(--color-dist)";
            const speed = Math.max(0.8, 4 - (commercial / 125));
            flowDistCom.style.setProperty("--flow-speed", `${speed}s`);
        } else {
            flowDistCom.style.opacity = "0";
        }

        if (industrial > 0 && !blackoutActive) {
            flowDistInd.style.opacity = "1";
            flowDistInd.style.stroke = "var(--color-dist)";
            const speed = Math.max(0.8, 4 - (industrial / 250));
            flowDistInd.style.setProperty("--flow-speed", `${speed}s`);
        } else {
            flowDistInd.style.opacity = "0";
        }
    } else {
        flowSolar.style.opacity = "0";
        flowWind.style.opacity = "0";
        flowUtility.style.opacity = "0";
        flowBattery.style.opacity = "0";
        flowControllerDist.style.opacity = "0";
        flowDistRes.style.opacity = "0";
        flowDistCom.style.opacity = "0";
        flowDistInd.style.opacity = "0";
    }

    updateScadaChart(totalGenerated, totalLoad);
}

// =====================================
// SIMULATION START/STOP LOOPS
// =====================================
function triggerSimulationStart() {
    if (simulationRunning) return;
    simulationRunning = true;
    
    document.body.classList.add("simulation-active");
    
    if (simulationInterval) clearInterval(simulationInterval);

    runSimulationTick();
    simulationInterval = setInterval(runSimulationTick, 1000);
}

startBtn.addEventListener("click", () => {
    triggerSimulationStart();
});

stopBtn.addEventListener("click", () => {
    triggerSimulationStop();
});

resetBtn.addEventListener("click", () => {
    triggerSimulationStop();

    solarPower.value = 500;
    windPower.value = 300;
    residentialLoad.value = 200;
    commercialLoad.value = 150;
    industrialLoad.value = 250;
    islandModeToggle.checked = false;
    batteryCharge = 50.0;

    document.querySelectorAll(".node-btn").forEach(btn => btn.classList.remove("active"));
    document.getElementById("btn-sun").classList.add("active");
    document.getElementById("btn-wind").classList.add("active");

    chartGenHistory = Array(30).fill(0);
    chartDemHistory = Array(30).fill(0);

    updateSliderLabels();
    runSimulationTick();

    if (gridStatus) {
        gridStatus.textContent = "Ready";
        gridStatus.className = "state-pill status-ready";
    }
});

function triggerSimulationStop() {
    simulationRunning = false;
    document.body.classList.remove("simulation-active");
    
    if (simulationInterval) {
        clearInterval(simulationInterval);
        simulationInterval = null;
    }

    runSimulationTick();
    
    if (gridStatus) {
        gridStatus.textContent = "Stopped";
        gridStatus.className = "state-pill status-warning";
    }
}

// =====================================
// INTERACTIVE PRESET CLICKS
// =====================================
document.getElementById("btn-sun").addEventListener("click", (e) => {
    solarPower.value = 1000;
    setActivePresetGroup(e.target);
});
document.getElementById("btn-cloud").addEventListener("click", (e) => {
    solarPower.value = 300;
    setActivePresetGroup(e.target);
});
document.getElementById("btn-night").addEventListener("click", (e) => {
    solarPower.value = 0;
    setActivePresetGroup(e.target);
});

document.getElementById("btn-wind").addEventListener("click", (e) => {
    windPower.value = 700;
    setActivePresetGroup(e.target);
});
document.getElementById("btn-breeze").addEventListener("click", (e) => {
    windPower.value = 250;
    setActivePresetGroup(e.target);
});
document.getElementById("btn-calm").addEventListener("click", (e) => {
    windPower.value = 0;
    setActivePresetGroup(e.target);
});
document.getElementById("btn-storm").addEventListener("click", (e) => {
    windPower.value = 1000;
    setActivePresetGroup(e.target);
});

function setActivePresetGroup(activeBtn) {
    const parent = activeBtn.parentElement;
    parent.querySelectorAll(".node-btn").forEach(btn => btn.classList.remove("active"));
    activeBtn.classList.add("active");

    updateSliderLabels();
    if (simulationRunning) runSimulationTick();
}

// =====================================
// CONTROL PANEL SCENARIO BUTTONS
// =====================================
document.getElementById("presetPeak").addEventListener("click", (e) => {
    residentialLoad.value = 450;
    commercialLoad.value = 400;
    industrialLoad.value = 850;
    setActiveScenario(e.target);
});

document.getElementById("presetStorm").addEventListener("click", (e) => {
    solarPower.value = 100;
    windPower.value = 1000;
    document.querySelectorAll(".node-btn").forEach(btn => btn.classList.remove("active"));
    document.getElementById("btn-cloud").classList.add("active");
    document.getElementById("btn-storm").classList.add("active");
    setActiveScenario(e.target);
});

document.getElementById("presetNight").addEventListener("click", (e) => {
    solarPower.value = 0;
    windPower.value = 200;
    residentialLoad.value = 350;
    commercialLoad.value = 100;
    industrialLoad.value = 150;
    document.querySelectorAll(".node-btn").forEach(btn => btn.classList.remove("active"));
    document.getElementById("btn-night").classList.add("active");
    document.getElementById("btn-breeze").classList.add("active");
    setActiveScenario(e.target);
});

document.getElementById("presetEco").addEventListener("click", (e) => {
    solarPower.value = 800;
    windPower.value = 500;
    residentialLoad.value = 150;
    commercialLoad.value = 100;
    industrialLoad.value = 200;
    document.querySelectorAll(".node-btn").forEach(btn => btn.classList.remove("active"));
    document.getElementById("btn-sun").classList.add("active");
    document.getElementById("btn-wind").classList.add("active");
    setActiveScenario(e.target);
});

function setActiveScenario(activeBtn) {
    document.querySelectorAll(".preset-btn").forEach(btn => btn.classList.remove("active"));
    activeBtn.classList.add("active");
    
    updateSliderLabels();
    if (simulationRunning) runSimulationTick();
}

// =====================================
// LIVE SLIDER INPUT LISTENERS
// =====================================
const slidersList = [solarPower, windPower, residentialLoad, commercialLoad, industrialLoad];
slidersList.forEach(slider => {
    slider.addEventListener("input", () => {
        document.querySelectorAll(".preset-btn").forEach(btn => btn.classList.remove("active"));
        
        if (slider === solarPower) {
            document.getElementById("node-solar").querySelectorAll(".node-btn").forEach(btn => btn.classList.remove("active"));
        }
        if (slider === windPower) {
            document.getElementById("node-wind").querySelectorAll(".node-btn").forEach(btn => btn.classList.remove("active"));
        }

        updateSliderLabels();
        if (simulationRunning) runSimulationTick();
    });
});

islandModeToggle.addEventListener("change", () => {
    if (simulationRunning) runSimulationTick();
});

// =====================================
// INITIAL ONLOAD SETUP
// =====================================
updateSliderLabels();
runSimulationTick();
if (gridStatus) {
    gridStatus.textContent = "Ready";
    gridStatus.className = "state-pill status-ready";
}

// =====================================
// HOVER INTERACTIVITY FOR SCADA CHART
// =====================================
const chartSvg = document.getElementById("scadaChart");
const hoverLine = document.getElementById("hoverLine");
const hoverGenMarker = document.getElementById("hoverGenMarker");
const hoverDemMarker = document.getElementById("hoverDemMarker");
const chartTooltip = document.getElementById("chartTooltip");
const tooltipTime = document.getElementById("tooltipTime");
const tooltipGen = document.getElementById("tooltipGen");
const tooltipDem = document.getElementById("tooltipDem");

if (chartSvg && hoverLine && hoverGenMarker && hoverDemMarker && chartTooltip) {
    chartSvg.addEventListener("mousemove", (e) => {
        const rect = chartSvg.getBoundingClientRect();
        
        // Calculate client mouse position relative to the SVG element
        const mouseX = e.clientX - rect.left;
        
        // Convert client coordinate mouseX to SVG coordinate (0 to 1000 viewBox)
        const svgX = (mouseX / rect.width) * 1000;
        
        const pointsCount = chartGenHistory.length;
        const width = 940;
        const stepX = width / (pointsCount - 1);
        
        let closestIdx = Math.round(svgX / stepX);
        if (closestIdx < 0) closestIdx = 0;
        if (closestIdx >= pointsCount) closestIdx = pointsCount - 1;
        
        const xPos = closestIdx * stepX;
        
        const maxVal = 2200;
        const height = 280;
        const padding = 10;
        
        const yGen = height - padding - (chartGenHistory[closestIdx] / maxVal) * (height - 2 * padding);
        const yDem = height - padding - (chartDemHistory[closestIdx] / maxVal) * (height - 2 * padding);
        
        hoverLine.setAttribute("x1", xPos);
        hoverLine.setAttribute("x2", xPos);
        hoverLine.style.display = "block";
        
        hoverGenMarker.setAttribute("cx", xPos);
        hoverGenMarker.setAttribute("cy", yGen);
        hoverGenMarker.style.display = "block";
        
        hoverDemMarker.setAttribute("cx", xPos);
        hoverDemMarker.setAttribute("cy", yDem);
        hoverDemMarker.style.display = "block";
        
        tooltipTime.textContent = `T - ${pointsCount - 1 - closestIdx}s`;
        tooltipGen.textContent = `Gen: ${chartGenHistory[closestIdx]} kW`;
        tooltipDem.textContent = `Dem: ${chartDemHistory[closestIdx]} kW`;
        
        let tooltipX = xPos + 12;
        let tooltipY = 40;
        
        if (tooltipX + 130 > 1000) {
            tooltipX = xPos - 142;
        }
        
        chartTooltip.setAttribute("transform", `translate(${tooltipX}, ${tooltipY})`);
        chartTooltip.style.display = "block";
    });
    
    chartSvg.addEventListener("mouseleave", () => {
        hoverLine.style.display = "none";
        hoverGenMarker.style.display = "none";
        hoverDemMarker.style.display = "none";
        chartTooltip.style.display = "none";
    });
}