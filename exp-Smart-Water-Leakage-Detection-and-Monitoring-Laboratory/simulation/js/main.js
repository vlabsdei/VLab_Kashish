// State variables for the simulation
let pumpSpeed = 60; // 0 to 100%
let valveState = 'OPEN'; // 'OPEN' or 'CLOSED'
let leakSeverity = 'none'; // 'none', 'minor', 'major', 'burst'
let leakZone = null; // null, 1, 2, or 3
let iotMode = true; // Auto-shutoff enabled

let flowThreshold = 0.50; // L/min delta
let pressureThreshold = 120; // kPa minimum

// Calculated variables
let inflow = 0.0;
let outflow = 0.0;
let pressure = 0.0;
let leakRate = 0.0;
let cumulativeWasted = 0.0;
let systemStatus = 'NORMAL'; // 'NORMAL', 'LEAK_DETECTED', 'SHUTDOWN'

// Animation helper variables
let pumpRotation = 0;
let flowDashOffset = 0;
let updateIntervalId = null;
let particleIntervalId = null;

// Telemetry History for Chart (last 60 data points)
const maxDataPoints = 60;
const history = {
    time: Array(maxDataPoints).fill(''),
    inflow: Array(maxDataPoints).fill(0),
    outflow: Array(maxDataPoints).fill(0),
    pressure: Array(maxDataPoints).fill(0)
};

// UI Elements
let elSysStatusBadge, elConsoleLogContainer, elConsoleTime;
let elInflowReadout, elOutflowReadout, elPressureReadout, elWastedReadout, elWastedFooter;
let elPumpSpeedSlider, elPumpSpeedVal, elFlowThresholdSlider, elFlowThresholdVal;
let elPressureThresholdSlider, elPressureThresholdVal;
let elToggleValveBtn, elToggleIotCheckbox;
let elObservationTableBody;
let elPipelineSvg;

// Leak Zone Coordinates in SVG
const leakCoordinates = {
    1: { x: 250, y: 180, splashY: 275, gridId: 'moisture-grid-1' },
    2: { x: 450, y: 180, splashY: 275, gridId: 'moisture-grid-2' },
    3: { x: 610, y: 180, splashY: 275, gridId: 'moisture-grid-3' }
};

// Trial Counter
let trialCount = 0;

// Initialize on load
window.addEventListener('DOMContentLoaded', () => {
    initDOMElements();
    setupEventListeners();
    initChart();
    
    // Start Simulation Main Loop (50ms interval for smooth rendering)
    updateIntervalId = setInterval(simulationLoop, 50);
    
    // Log initial system status
    addConsoleLog('IoT Gateway active. Listening on channels: FS-01, FS-02, PT-01.', 'success');
});

// Cache DOM Elements
function initDOMElements() {
    elSysStatusBadge = document.getElementById('sys-status-badge');
    elConsoleLogContainer = document.getElementById('console-log-container');
    elConsoleTime = document.getElementById('console-time');
    
    elInflowReadout = document.getElementById('tele-inflow');
    elOutflowReadout = document.getElementById('tele-outflow');
    elPressureReadout = document.getElementById('tele-pressure');
    elWastedReadout = document.getElementById('tele-wasted');
    elWastedFooter = document.getElementById('tele-wasted-footer');
    
    elPumpSpeedSlider = document.getElementById('slider-pump-speed');
    elPumpSpeedVal = document.getElementById('val-pump-speed');
    elFlowThresholdSlider = document.getElementById('slider-flow-threshold');
    elFlowThresholdVal = document.getElementById('val-flow-threshold');
    elPressureThresholdSlider = document.getElementById('slider-pressure-threshold');
    elPressureThresholdVal = document.getElementById('val-pressure-threshold');
    
    elToggleValveBtn = document.getElementById('btn-toggle-valve');
    elToggleIotCheckbox = document.getElementById('toggle-iot-mode');
    
    elObservationTableBody = document.querySelector('#observation-table tbody');
    elPipelineSvg = document.getElementById('pipeline-svg');
}

// Set up UI Interactivity
function setupEventListeners() {
    // Sliders
    elPumpSpeedSlider.addEventListener('input', (e) => {
        pumpSpeed = parseInt(e.target.value);
        elPumpSpeedVal.textContent = pumpSpeed + '%';
        if (pumpSpeed > 0 && valveState === 'OPEN') {
            addConsoleLog(`Pump speed adjusted to ${pumpSpeed}%`, 'info');
        }
    });

    elFlowThresholdSlider.addEventListener('input', (e) => {
        flowThreshold = parseFloat(e.target.value);
        elFlowThresholdVal.textContent = flowThreshold.toFixed(2) + ' L/min';
    });

    elPressureThresholdSlider.addEventListener('input', (e) => {
        pressureThreshold = parseInt(e.target.value);
        elPressureThresholdVal.textContent = pressureThreshold + ' kPa';
    });

    // Toggles & Buttons
    elToggleIotCheckbox.addEventListener('change', (e) => {
        iotMode = e.target.checked;
        addConsoleLog(`IoT Automation Rules: ${iotMode ? 'ENABLED' : 'DISABLED'}`, iotMode ? 'success' : 'warning');
    });

    elToggleValveBtn.addEventListener('click', toggleValve);

    // Clickable valves on SVG
    document.getElementById('solenoid-valve').addEventListener('click', toggleValve);

    // Leak buttons
    const severityBtns = document.querySelectorAll('.btn-leak-select');
    severityBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            severityBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            const severity = btn.getAttribute('data-severity');
            setLeakSeverity(severity);
        });
    });

    // Clickable leak zones directly on pipeline SVG
    for (let zoneId = 1; zoneId <= 3; zoneId++) {
        const target = document.getElementById(`leak-target-${zoneId}`);
        target.addEventListener('click', () => {
            if (leakSeverity === 'none') {
                // If no leak, clicking a zone initiates a 'minor' leak at that zone
                severityBtns.forEach(b => b.classList.remove('active'));
                document.querySelector('.btn-leak-select[data-severity="minor"]').classList.add('active');
                setLeakZone(zoneId);
                setLeakSeverity('minor');
            } else {
                // If leak is active, click changes the zone
                setLeakZone(zoneId);
                addConsoleLog(`Leak relocated to Pipe Zone ${zoneId}`, 'warning');
            }
        });
    }

    // Log Sheet Controls
    document.getElementById('btn-record-data').addEventListener('click', recordState);
    document.getElementById('btn-export-csv').addEventListener('click', exportCSV);
    document.getElementById('btn-clear-log').addEventListener('click', clearLog);

    // Lab Manual Modal Controls
    const manualDrawer = document.getElementById('manual-drawer');
    const manualBackdrop = document.getElementById('manual-backdrop');
    
    document.getElementById('btn-open-manual').addEventListener('click', () => {
        manualDrawer.classList.add('active');
        manualBackdrop.classList.add('active');
    });

    document.getElementById('btn-close-manual').addEventListener('click', closeManual);
    manualBackdrop.addEventListener('click', closeManual);
    
    function closeManual() {
        manualDrawer.classList.remove('active');
        manualBackdrop.classList.remove('active');
    }
}

// Set System Leak Severity state
function setLeakSeverity(severity) {
    leakSeverity = severity;
    if (severity === 'none') {
        setLeakZone(null);
        addConsoleLog('Pipeline leakage resolved. All zones sealed.', 'success');
        // If system was in error, and we solved the leak, return system to normal (if valve is open)
        if (valveState === 'OPEN') {
            updateSystemStatus('NORMAL');
        }
    } else {
        // Default to Zone 2 if no zone selected yet
        if (leakZone === null) {
            setLeakZone(2);
        }
        addConsoleLog(`Pipeline rupture simulated: ${severity.toUpperCase()} LEAK at Zone ${leakZone}`, 'error');
    }
}

// Designate which zone is leaking and manage SVG highlighting
function setLeakZone(zoneId) {
    leakZone = zoneId;
    
    // Reset all dots & sprays
    for (let z = 1; z <= 3; z++) {
        document.getElementById(`leak-dot-${z}`).setAttribute('fill', '#1e293b');
        document.getElementById(`leak-dot-${z}`).setAttribute('stroke', '#38bdf8');
        document.getElementById(`leak-spray-${z}`).style.opacity = '0';
        document.getElementById(`leak-target-${z}`).classList.remove('active-leak');
    }

    if (zoneId !== null) {
        document.getElementById(`leak-dot-${zoneId}`).setAttribute('fill', '#ef4444');
        document.getElementById(`leak-dot-${zoneId}`).setAttribute('stroke', '#ffffff');
        document.getElementById(`leak-target-${zoneId}`).classList.add('active-leak');
        
        // Show spray based on severity
        if (leakSeverity !== 'none') {
            const opacity = leakSeverity === 'minor' ? '0.45' : (leakSeverity === 'major' ? '0.75' : '1.0');
            document.getElementById(`leak-spray-${zoneId}`).style.opacity = opacity;
        }
    }
    
    // Stop drop particles interval if active, and restart if leak is present
    clearInterval(particleIntervalId);
    if (leakSeverity !== 'none' && leakZone !== null) {
        const particleInterval = leakSeverity === 'minor' ? 300 : (leakSeverity === 'major' ? 120 : 60);
        particleIntervalId = setInterval(createLeakParticle, particleInterval);
    }
}

// Toggle Main Solenoid Valve state
function toggleValve() {
    if (valveState === 'OPEN') {
        valveState = 'CLOSED';
        elToggleValveBtn.innerHTML = `
            <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M18 6L6 18M6 6l12 12"/>
            </svg>
            <span>OPEN SOLENOID VALVE</span>
        `;
        elToggleValveBtn.classList.remove('btn-primary');
        elToggleValveBtn.classList.add('btn-secondary');
        document.getElementById('solenoid-valve').classList.remove('valve-open');
        document.getElementById('solenoid-valve').classList.add('valve-closed');
        document.getElementById('valve-status-label').textContent = 'VALVE: CLOSED';
        document.getElementById('valve-status-label').setAttribute('fill', '#f43f5e');
        
        addConsoleLog('Solenoid Valve command received: CLOSED. Main line isolated.', 'warning');
        
        // Update status badge to reflect shutdown if it was leak, or show isolated
        if (systemStatus !== 'LEAK_DETECTED') {
            updateSystemStatus('SHUTDOWN');
        }
    } else {
        valveState = 'OPEN';
        elToggleValveBtn.innerHTML = `
            <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" y1="8" x2="12" y2="16"/>
                <line x1="8" y1="12" x2="16" y2="12"/>
            </svg>
            <span>CLOSE SOLENOID VALVE</span>
        `;
        elToggleValveBtn.classList.remove('btn-secondary');
        elToggleValveBtn.classList.add('btn-primary');
        document.getElementById('solenoid-valve').classList.remove('valve-closed');
        document.getElementById('solenoid-valve').classList.add('valve-open');
        document.getElementById('valve-status-label').textContent = 'VALVE: OPEN';
        document.getElementById('valve-status-label').setAttribute('fill', '#94a3b8');
        
        addConsoleLog('Solenoid Valve command received: OPENED. Flow path initialized.', 'success');
        
        if (leakSeverity === 'none') {
            updateSystemStatus('NORMAL');
        } else {
            updateSystemStatus('LEAK_DETECTED');
        }
    }
}

// Update System Status Badge & Console Styles
function updateSystemStatus(status) {
    systemStatus = status;
    elSysStatusBadge.className = 'status-indicator';
    
    if (status === 'NORMAL') {
        elSysStatusBadge.innerHTML = `<span class="status-dot"></span><span class="status-text">SYSTEM NORMAL</span>`;
    } else if (status === 'LEAK_DETECTED') {
        elSysStatusBadge.classList.add('danger-alert');
        elSysStatusBadge.innerHTML = `<span class="status-dot"></span><span class="status-text">LEAK ALARM ACTIVATED</span>`;
    } else if (status === 'SHUTDOWN') {
        elSysStatusBadge.classList.add('warning-alert');
        elSysStatusBadge.innerHTML = `<span class="status-dot"></span><span class="status-text">VALVE CLOSED / ISOLATED</span>`;
    }
}

// Main Physics Simulation Loop
function simulationLoop() {
    calculatePhysics();
    updateDisplays();
    updateAnimations();
    updateChart();
    
    // Check Automation safety loop
    if (iotMode && valveState === 'OPEN') {
        const delta = Math.abs(inflow - outflow);
        const criticalLeak = delta > flowThreshold;
        const lowPressure = pressure < pressureThreshold && pumpSpeed > 10;
        
        if (criticalLeak || lowPressure) {
            // Trigger auto shutoff
            valveState = 'CLOSED';
            updateSystemStatus('LEAK_DETECTED');
            
            // UI Button styling update
            elToggleValveBtn.innerHTML = `
                <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M18 6L6 18M6 6l12 12"/>
                </svg>
                <span>OPEN SOLENOID VALVE</span>
            `;
            elToggleValveBtn.classList.remove('btn-primary');
            elToggleValveBtn.classList.add('btn-secondary');
            document.getElementById('solenoid-valve').classList.remove('valve-open');
            document.getElementById('solenoid-valve').classList.add('valve-closed');
            document.getElementById('valve-status-label').textContent = 'VALVE: CLOSED';
            document.getElementById('valve-status-label').setAttribute('fill', '#f43f5e');
            
            addConsoleLog(`[AUTO-ALARM] Critical telemetry threshold breached!`, 'error');
            if (criticalLeak) {
                addConsoleLog(`- Flow mismatch Delta (${delta.toFixed(2)} L/min) exceeded limit (${flowThreshold.toFixed(2)} L/min)`, 'error');
            }
            if (lowPressure) {
                addConsoleLog(`- System line pressure (${pressure.toFixed(0)} kPa) dropped below threshold (${pressureThreshold} kPa)`, 'error');
            }
            addConsoleLog(`[IoT Gateway] Relaying emergency signal. Closed solenoid valve.`, 'success');
        }
    }
}

// Fluid Mechanics Equations
function calculatePhysics() {
    const dt = 0.05; // 50ms in seconds
    
    if (valveState === 'CLOSED') {
        // Closed valve blocks all flow downstream
        inflow = 0.0;
        outflow = 0.0;
        pressure = 0.0;
        leakRate = 0.0;
        return;
    }
    
    if (pumpSpeed === 0) {
        inflow = 0.0;
        outflow = 0.0;
        pressure = 0.0;
        leakRate = 0.0;
        return;
    }
    
    // Baseline calculations (Leak Free)
    // 100% pump speed yields 20 L/min max inlet flow, and 300 kPa max pressure
    const baseInflow = pumpSpeed * 0.2;
    const basePressure = pumpSpeed * 3.0; // linear pressure relationship for simulation
    
    let flowLossCoeff = 0.0;
    let pressLossCoeff = 0.0;
    
    if (leakSeverity === 'minor') {
        flowLossCoeff = 0.15; // 15% lost
        pressLossCoeff = 0.22; // 22% drop in pressure
    } else if (leakSeverity === 'major') {
        flowLossCoeff = 0.45; // 45% lost
        pressLossCoeff = 0.50; // 50% drop in pressure
    } else if (leakSeverity === 'burst') {
        flowLossCoeff = 0.90; // 90% lost
        pressLossCoeff = 0.88; // 88% drop in pressure
    }
    
    // Adding small sensor noise (+/- 1.5% max)
    const noiseInflow = (Math.random() - 0.5) * 0.08;
    const noiseOutflow = (Math.random() - 0.5) * 0.08;
    const noisePressure = (Math.random() - 0.5) * 2;
    
    if (leakSeverity === 'none') {
        inflow = baseInflow + noiseInflow;
        outflow = baseInflow + noiseOutflow;
        pressure = basePressure + noisePressure;
        leakRate = 0.0;
    } else {
        // Centrifugal pump physics: Lower pipe resistance (leakage orifice) causes inflow to slightly RISE!
        const systemResistanceDropFactor = 1.0 + (flowLossCoeff * 0.15); // max 13.5% flow expansion at pump outlet
        inflow = (baseInflow * systemResistanceDropFactor) + noiseInflow;
        
        leakRate = inflow * flowLossCoeff;
        outflow = (inflow - leakRate) + noiseOutflow;
        pressure = (basePressure * (1.0 - pressLossCoeff)) + noisePressure;
    }
    
    // Bound readings to zero minimum
    inflow = Math.max(0, inflow);
    outflow = Math.max(0, outflow);
    pressure = Math.max(0, pressure);
    leakRate = Math.max(0, leakRate);
    
    // Accumulate water wasted (Convert L/min to L/tick)
    cumulativeWasted += leakRate * (dt / 60);
}

// Refresh live dials, indicators, and text readouts
function updateDisplays() {
    elInflowReadout.textContent = inflow.toFixed(2);
    elOutflowReadout.textContent = outflow.toFixed(2);
    elPressureReadout.textContent = pressure.toFixed(0);
    elWastedReadout.textContent = cumulativeWasted.toFixed(2);
    
    if (leakSeverity === 'none' || valveState === 'CLOSED') {
        elWastedFooter.textContent = '0.0 L/min Leak Rate';
        elWastedFooter.className = 'widget-footer';
        elWastedReadout.classList.remove('red-text');
        
        // Restore indicators to green if normal
        document.getElementById('tele-outflow-footer').className = 'widget-footer green';
        document.getElementById('tele-outflow-footer').textContent = 'Delivery Flow';
        document.getElementById('tele-pressure-footer').className = 'widget-footer orange';
        document.getElementById('tele-pressure-footer').textContent = 'System Line Pressure';
    } else {
        elWastedFooter.textContent = `${leakRate.toFixed(2)} L/min Leak Rate`;
        elWastedFooter.className = 'widget-footer red-bg-text';
        elWastedReadout.classList.add('red-text');
        
        // Set outflow telemetry indicator warning
        document.getElementById('tele-outflow-footer').className = 'widget-footer red-text';
        document.getElementById('tele-outflow-footer').textContent = 'Flow Loss Detected';
        
        document.getElementById('tele-pressure-footer').className = 'widget-footer red-text';
        document.getElementById('tele-pressure-footer').textContent = 'Pressure Drop Warning';
    }
    
    // Display clock timer
    const now = new Date();
    const timeStr = now.toTimeString().split(' ')[0];
    if (elConsoleTime) {
        elConsoleTime.textContent = timeStr;
    }
}

// Manage physical SVG movements and particle generation
function updateAnimations() {
    const dt = 0.05;
    
    // 1. Spin Pump Impeller based on speed
    if (pumpSpeed > 0 && valveState === 'OPEN') {
        pumpRotation += (pumpSpeed * 10 * dt);
        document.getElementById('pump-prop').setAttribute('transform', `rotate(${pumpRotation})`);
    }
    
    // 2. Animate Water Flow inside pipeline
    // Adjust visual speed based on inflow rate
    if (valveState === 'OPEN' && inflow > 0) {
        flowDashOffset -= (inflow * 6 * dt);
        document.getElementById('water-flow').setAttribute('stroke-dashoffset', flowDashOffset);
        document.getElementById('water-flow').setAttribute('stroke-width', 12);
    } else {
        document.getElementById('water-flow').setAttribute('stroke-width', 0); // Hide water flow if isolated
    }
    
    // 3. Dynamic Water level in tanks
    // Supply tank goes down over time (simulated cycle), discharge goes up
    // Discharge tank height limit 158px
    if (valveState === 'OPEN' && outflow > 0) {
        // Discharge level goes up
        const levelIncrease = outflow * 0.03 * dt;
        const currentDischargeHeight = parseFloat(document.getElementById('discharge-water').getAttribute('height'));
        const newDischargeHeight = Math.min(158, currentDischargeHeight + levelIncrease);
        document.getElementById('discharge-water').setAttribute('height', newDischargeHeight);
        document.getElementById('discharge-water').setAttribute('y', 278 - newDischargeHeight);
        
        // Supply tank goes down
        const currentSupplyHeight = parseFloat(document.getElementById('supply-water').getAttribute('height'));
        const newSupplyHeight = Math.max(10, currentSupplyHeight - (inflow * 0.02 * dt));
        document.getElementById('supply-water').setAttribute('height', newSupplyHeight);
    }
    
    // 4. Update moisture grid sensors based on leak location
    for (let m = 1; m <= 3; m++) {
        const grid = document.getElementById(`moisture-grid-${m}`);
        if (leakSeverity !== 'none' && leakZone === m && valveState === 'OPEN') {
            grid.setAttribute('fill', '#00f2fe');
            grid.setAttribute('opacity', '0.7');
            // add pulse effect
            const glowPulse = 0.4 + Math.sin(Date.now() / 150) * 0.2;
            grid.setAttribute('opacity', glowPulse);
        } else if (leakSeverity === 'none') {
            grid.setAttribute('fill', '#0f172a');
            grid.setAttribute('opacity', '0.6');
        }
    }
}

// Leak droplet generator
function createLeakParticle() {
    if (leakSeverity === 'none' || leakZone === null || valveState === 'CLOSED') return;
    
    const container = document.getElementById('particle-overlay');
    const coords = leakCoordinates[leakZone];
    
    // Map SVG coordinates to bounding box coordinates of HTML overlay container
    const svgEl = elPipelineSvg;
    const rect = svgEl.getBoundingClientRect();
    const scaleX = rect.width / 800;
    const scaleY = rect.height / 350;
    
    // Calculate pixel coordinates
    const startX = coords.x * scaleX;
    const startY = coords.y * scaleY;
    const splashY = coords.splashY * scaleY;
    
    // Create drip particle
    const drip = document.createElement('div');
    drip.className = 'drip-particle';
    drip.style.left = (startX + (Math.random() - 0.5) * 10) + 'px';
    drip.style.top = startY + 'px';
    
    // Set custom falling height dynamically in JS style properties
    const duration = leakSeverity === 'minor' ? 0.6 : (leakSeverity === 'major' ? 0.45 : 0.3);
    drip.style.animationDuration = duration + 's';
    
    container.appendChild(drip);
    
    // Create a splash ripple when droplet hits the grid tray
    setTimeout(() => {
        drip.remove();
        createSplashRing(startX, splashY);
    }, duration * 1000);
}

// Splash ripple on moisture grid
function createSplashRing(x, y) {
    const container = document.getElementById('particle-overlay');
    const splash = document.createElement('div');
    splash.className = 'splash-ring';
    splash.style.left = x + 'px';
    splash.style.top = y + 'px';
    
    container.appendChild(splash);
    
    setTimeout(() => {
        splash.remove();
    }, 500);
}

// Custom real-time chart using HTML5 Canvas
let canvas, ctx;

function initChart() {
    canvas = document.getElementById('telemetry-chart');
    ctx = canvas.getContext('2d');
    
    // Set initial historical baseline data points
    for (let i = 0; i < maxDataPoints; i++) {
        history.inflow[i] = 12.0;
        history.outflow[i] = 12.0;
        history.pressure[i] = 180.0;
    }
}

function updateChart() {
    if (!ctx) return;
    
    // Shift telemetry historical queue
    history.inflow.shift();
    history.inflow.push(inflow);
    history.outflow.shift();
    history.outflow.push(outflow);
    history.pressure.shift();
    history.pressure.push(pressure);
    
    // Dynamically adjust canvas dimensions to match actual rendering size
    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    
    if (canvas.width !== Math.floor(rect.width * dpr) || canvas.height !== Math.floor(rect.height * dpr)) {
        canvas.width = Math.floor(rect.width * dpr);
        canvas.height = Math.floor(rect.height * dpr);
    }
    
    // Scale drawings for high-DPI displays
    ctx.resetTransform();
    ctx.scale(dpr, dpr);
    
    // Clear canvas
    ctx.clearRect(0, 0, rect.width, rect.height);
    
    const w = rect.width;
    const h = rect.height;
    
    // Retrieve colors from CSS variables
    const style = getComputedStyle(document.documentElement);
    const colorGrid = style.getPropertyValue('--color-chart-grid').trim() || 'rgba(0, 0, 0, 0.06)';
    const colorText = style.getPropertyValue('--color-text-muted').trim() || '#64748b';
    const colorInflow = style.getPropertyValue('--color-primary').trim() || '#0ea5e9';
    const colorOutflow = style.getPropertyValue('--color-secondary').trim() || '#2563eb';
    const colorPressure = style.getPropertyValue('--color-accent').trim() || '#d97706';
    const shadowInflow = style.getPropertyValue('--color-chart-inflow-glow').trim() || 'rgba(14, 165, 233, 0.2)';
    const shadowOutflow = style.getPropertyValue('--color-chart-outflow-glow').trim() || 'rgba(37, 99, 235, 0.2)';
    const shadowPressure = style.getPropertyValue('--color-chart-pressure-glow').trim() || 'rgba(217, 119, 6, 0.2)';
    
    // Draw background grid lines
    ctx.strokeStyle = colorGrid;
    ctx.lineWidth = 1;
    
    // Horizontal Grid Lines
    for (let val = 0; val <= 300; val += 50) {
        const y = h - (val / 300) * (h - 20) - 10;
        ctx.beginPath();
        ctx.moveTo(35, y);
        ctx.lineTo(w - 10, y);
        ctx.stroke();
        
        // Draw axis value ticks
        ctx.fillStyle = colorText;
        ctx.font = '9px Outfit';
        ctx.fillText(val, 5, y + 3);
    }
    
    // Vertical lines
    for (let x = 35; x < w; x += (w - 45) / 5) {
        ctx.beginPath();
        ctx.moveTo(x, 10);
        ctx.lineTo(x, h - 10);
        ctx.stroke();
    }
    
    // Function to draw data line
    function drawLine(dataArr, color, maxScale, shadowColor) {
        ctx.beginPath();
        ctx.strokeStyle = color;
        ctx.lineWidth = 2.5;
        
        // Add glow to line
        ctx.shadowBlur = 6;
        ctx.shadowColor = shadowColor;
        
        for (let i = 0; i < maxDataPoints; i++) {
            const x = 35 + (i / (maxDataPoints - 1)) * (w - 45);
            // Scale and map values to canvas y-axis
            const val = dataArr[i];
            const y = h - (val / maxScale) * (h - 20) - 10;
            
            if (i === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        }
        ctx.stroke();
        ctx.shadowBlur = 0; // Reset shadow glow
    }
    
    // Draw Inflow (Max 25 L/min scale)
    drawLine(history.inflow, colorInflow, 25, shadowInflow);
    
    // Draw Outflow (Max 25 L/min scale)
    drawLine(history.outflow, colorOutflow, 25, shadowOutflow);
    
    // Draw Pressure (Max 300 kPa scale)
    drawLine(history.pressure, colorPressure, 300, shadowPressure);
}

// Append formatted lines to the scrolling Diagnostic Console logger
function addConsoleLog(message, type = 'info') {
    const logBody = elConsoleLogContainer;
    if (!logBody) {
        console.log(`[${type.toUpperCase()}] ${message}`);
        return;
    }
    const line = document.createElement('div');
    line.className = `console-line text-${type}`;
    
    const now = new Date();
    const timeStr = now.toTimeString().split(' ')[0];
    
    line.textContent = `[${timeStr}] ${message}`;
    logBody.appendChild(line);
    
    // Scroll body to bottom
    logBody.scrollTop = logBody.scrollHeight;
    
    // Maintain maximum console backlog of 50 lines to prevent DOM bloat
    while (logBody.childElementCount > 50) {
        logBody.removeChild(logBody.firstElementChild);
    }
}

// Record current simulation states into the Observation Table
function recordState() {
    trialCount++;
    
    // Remove empty placeholder row if first insert
    const emptyRow = elObservationTableBody.querySelector('.empty-row-placeholder');
    if (emptyRow) {
        emptyRow.remove();
    }
    
    const statusText = valveState === 'CLOSED' ? 'Isolated' : (leakSeverity === 'none' ? 'Normal' : `${leakSeverity.toUpperCase()} leak`);
    const statusClass = valveState === 'CLOSED' ? 'shut' : (leakSeverity === 'none' ? 'normal' : 'leak');
    
    const row = document.createElement('tr');
    row.innerHTML = `
        <td class="font-numeric">#${trialCount}</td>
        <td class="font-numeric">${pumpSpeed}%</td>
        <td><span class="badge ${valveState.toLowerCase()}">${valveState}</span></td>
        <td class="font-numeric">${inflow.toFixed(2)}</td>
        <td class="font-numeric">${outflow.toFixed(2)}</td>
        <td class="font-numeric">${leakRate.toFixed(2)}</td>
        <td class="font-numeric">${pressure.toFixed(0)}</td>
        <td><span class="badge ${statusClass}">${statusText}</span></td>
    `;
    
    // Append to top of table
    elObservationTableBody.insertBefore(row, elObservationTableBody.firstChild);
    addConsoleLog(`Recorded state trial #${trialCount} in observation sheet.`, 'success');
}

// Clear observations
function clearLog() {
    trialCount = 0;
    elObservationTableBody.innerHTML = `
        <tr class="empty-row-placeholder">
            <td colspan="8" class="text-center text-muted">No experimental runs recorded. Adjust settings and click "Record State" to save observations.</td>
        </tr>
    `;
    addConsoleLog('Laboratory log sheet cleared.', 'warning');
}

// Export observation data table to CSV format
function exportCSV() {
    const rows = elObservationTableBody.querySelectorAll('tr');
    
    // Check if empty
    if (rows.length === 1 && rows[0].classList.contains('empty-row-placeholder')) {
        alert('No data points to export!');
        return;
    }
    
    let csvContent = 'data:text/csv;charset=utf-8,';
    csvContent += 'Trial,Pump Speed (%),Valve State,Inflow (L/min),Outflow (L/min),Leak Rate (L/min),Pressure (kPa),System Status\r\n';
    
    rows.forEach(row => {
        const cols = row.querySelectorAll('td');
        if (cols.length > 0) {
            const data = Array.from(cols).map(c => {
                // Strip tags/badges text clean
                return c.textContent.replace('#', '').trim();
            });
            csvContent += data.join(',') + '\r\n';
        }
    });
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', 'Smart_Water_Leakage_Lab_Data.csv');
    document.body.appendChild(link);
    
    link.click();
    document.body.removeChild(link);
    addConsoleLog('Exported observation logs to CSV file.', 'success');
}
