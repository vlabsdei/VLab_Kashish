document.addEventListener('DOMContentLoaded', () => {
  // Initialize Lucide Icons
  lucide.createIcons();

  // --- Simulation Engine Variables ---
  let isRunning = false;
  let simSpeed = 1; // 1x, 3x, 10x
  let simTime = 0; // Simulation time in minutes
  let lastTickTime = 0;

  // Queuing Parameters
  let arrivalRate = 12; // lambda (EVs/hour)
  let serviceTime = 20; // 1/mu (minutes)
  let numChargers = 3;  // c
  let queueCapacity = 999; // K (infinite buffer default)
  let gridPowerLimit = 300; // kW
  let powerAllocationMode = 'fixed'; // fixed or smart
  let queueDiscipline = 'FIFO'; // FIFO, SJF, PRIORITY

  // Incident Variables
  let isOutage = false;
  let surgeTimer = 0; // remaining simulated minutes of traffic surge
  let originalArrivalRate = 12;
  let maxQueueLengthReached = 0; // track maximum queue length reached

  // State arrays
  let queue = [];
  let chargers = [];
  let activeCars = []; // all visual cars currently driving or charging

  // Statistical Cumulative Counts (Empirical Metrics)
  let totalArrivals = 0;
  let totalServed = 0;
  let totalBalked = 0;
  let totalWaitingTime = 0;
  let activePowerDraw = 0; // total active charger load in kW

  // Time-integrated variables for mathematical average calculations
  let totalSimTime = 0.001; // avoid divide by zero
  let integratedQueueLength = 0;
  let integratedUtilization = 0;

  // DOM Control Elements
  const paramArrivalRate = document.getElementById('param-arrival-rate');
  const paramServiceRate = document.getElementById('param-service-rate');
  const paramChargers = document.getElementById('param-chargers');
  const paramCapacity = document.getElementById('param-capacity');
  const paramDiscipline = document.getElementById('param-discipline');
  const paramGridLimit = document.getElementById('param-grid-limit');
  const paramPowerMode = document.getElementById('param-power-mode');

  const valArrivalRate = document.getElementById('val-arrival-rate');
  const valServiceRate = document.getElementById('val-service-rate');
  const valChargers = document.getElementById('val-chargers');
  const valGridLimit = document.getElementById('val-grid-limit');

  const btnPlayPause = document.getElementById('btn-play-pause');
  const btnPause = document.getElementById('btn-pause');
  const btnReset = document.getElementById('btn-reset');
  const speedButtons = document.querySelectorAll('.speed-btn');

  // Incident Controls
  const btnTriggerSurge = document.getElementById('btn-trigger-surge');
  const btnTriggerOutage = document.getElementById('btn-trigger-outage');
  const btnResolveOutage = document.getElementById('btn-resolve-outage');
  const outageOverlay = document.getElementById('outage-overlay');

  // Header Elements
  const headerSimTime = document.getElementById('header-sim-time');
  const headerEfficiency = document.getElementById('header-efficiency');
  const headerGridLoad = document.getElementById('header-grid-load') || { textContent: '' };

  // Center Mimic Nodes
  const mimicGridPower = document.getElementById('mimic-grid-power');
  const mimicGridStatus = document.getElementById('mimic-grid-status');
  const mimicArrivalVal = document.getElementById('mimic-arrival-val');
  const mimicArrivalStatus = document.getElementById('mimic-arrival-status');
  const mimicQueueVal = document.getElementById('mimic-queue-val');
  const mimicQueueStatus = document.getElementById('mimic-queue-status');
  const mimicEmsVal = document.getElementById('mimic-ems-val');
  const mimicEmsStatus = document.getElementById('mimic-ems-status');
  const mimicChargersList = document.getElementById('mimic-chargers-list');
  const mimicServedVal = document.getElementById('mimic-served-val');
  const mimicContainer = document.querySelector('.mimic-container');

  // Telemetry Dashboard Metric Cards
  const telemetryArrivals = document.getElementById('telemetry-arrivals');
  const telemetryServed = document.getElementById('telemetry-served');
  const telemetryUtilization = document.getElementById('telemetry-utilization');
  const telemetryUtilStatus = document.getElementById('telemetry-util-status');
  const telemetryWait = document.getElementById('telemetry-wait');
  const telemetryWaitStatus = document.getElementById('telemetry-wait-status');
  const telemetryQueueLen = document.getElementById('telemetry-queue-len');
  const telemetryQueueStatus = document.getElementById('telemetry-queue-status');
  const telemetryBalked = document.getElementById('telemetry-balked');
  const telemetryBalkStatus = document.getElementById('telemetry-balk-status');
  const telemetryPower = document.getElementById('telemetry-power');
  const telemetrySystemStatus = document.getElementById('telemetry-system-status');
  const telemetrySystemDesc = document.getElementById('telemetry-system-desc');
  const telemetrySystemIcon = document.getElementById('telemetry-system-icon');

  // Math Analytical Table Elements
  const mathModelClass = document.getElementById('math-model-class');
  const mathRhoVal = document.getElementById('math-rho-val');
  const mathTheoryWq = document.getElementById('math-theory-wq');
  const mathSimWq = document.getElementById('math-sim-wq');
  const mathErrorWq = document.getElementById('math-error-wq');
  const mathTheoryLq = document.getElementById('math-theory-lq');
  const mathSimLq = document.getElementById('math-sim-lq');
  const mathErrorLq = document.getElementById('math-error-lq');
  const mathTheoryBalk = document.getElementById('math-theory-balk');
  const mathSimBalk = document.getElementById('math-sim-balk');
  const mathErrorBalk = document.getElementById('math-error-balk');
  const mathTheoryUtil = document.getElementById('math-theory-util');
  const mathSimUtil = document.getElementById('math-sim-util');
  const mathErrorUtil = document.getElementById('math-error-util');

  // --- Math Queuing Theory Solver (M/M/c and M/M/c/K) ---
  function factorial(n) {
    if (n <= 1) return 1;
    let res = 1;
    for (let i = 2; i <= n; i++) res *= i;
    return res;
  }

  function calculateQueuingTheory() {
    const lambda = arrivalRate / 60; // arrivals per minute
    const mu = 1 / serviceTime; // service rate per server per minute
    const c = numChargers;
    const N = queueCapacity; // buffer spots
    const r = lambda / mu; // offered load
    const rho = r / c; // utilization index

    let theoryWq = 0; // minutes
    let theoryLq = 0; // vehicles
    let theoryBalk = 0; // percentage
    let theoryUtil = 0; // percentage

    const modelClass = N === 999 ? `M/M/${c}` : `M/M/${c}/${c + N}`;

    if (N === 999) {
      // M/M/c Infinite Queue Formula
      if (rho < 1.0) {
        // Calculate P0 (Probability of empty system)
        let sum = 0;
        for (let n = 0; n < c; n++) {
          sum += Math.pow(r, n) / factorial(n);
        }
        sum += Math.pow(r, c) / (factorial(c) * (1 - rho));
        const p0 = 1 / sum;

        // Calculate Lq (Avg cars in queue)
        theoryLq = (p0 * Math.pow(r, c) * rho) / (factorial(c) * Math.pow(1 - rho, 2));
        theoryWq = theoryLq / lambda; // minutes
        theoryUtil = rho * 100;
        theoryBalk = 0;
      } else {
        // Unstable infinite queue
        theoryLq = Infinity;
        theoryWq = Infinity;
        theoryUtil = 100;
        theoryBalk = 0;
      }
    } else {
      // M/M/c/K Finite Queue Formula (System size K = c + N)
      const K = c + N;

      // Calculate P0
      let sum = 0;
      for (let n = 0; n < c; n++) {
        sum += Math.pow(r, n) / factorial(n);
      }
      let sum2 = 0;
      for (let n = c; n <= K; n++) {
        sum2 += Math.pow(rho, n - c);
      }
      sum += (Math.pow(r, c) / factorial(c)) * sum2;
      const p0 = 1 / sum;

      // Calculate P_K (probability system is completely full = balking rate)
      const pK = (Math.pow(r, K) / (factorial(c) * Math.pow(c, K - c))) * p0;
      theoryBalk = pK * 100;

      // Effective arrival rate lambda_eff
      const lambdaEff = lambda * (1 - pK);

      // Calculate Lq (average queue length)
      let lqSum = 0;
      for (let n = c; n <= K; n++) {
        lqSum += (n - c) * (Math.pow(r, n) / (factorial(c) * Math.pow(c, n - c))) * p0;
      }
      theoryLq = lqSum;
      theoryWq = lambdaEff > 0 ? theoryLq / lambdaEff : 0; // minutes

      // Expected active chargers (E[c_busy])
      let activeSum = 0;
      for (let n = 0; n < c; n++) {
        activeSum += n * (Math.pow(r, n) / factorial(n)) * p0;
      }
      for (let n = c; n <= K; n++) {
        activeSum += c * (Math.pow(r, n) / (factorial(c) * Math.pow(c, n - c))) * p0;
      }
      theoryUtil = (activeSum / c) * 100;
    }

    return {
      modelClass,
      rho,
      theoryWq,
      theoryLq,
      theoryBalk,
      theoryUtil
    };
  }

  // --- Analytical Validation Update UI ---
  function updateMathValidator() {
    const theory = calculateQueuingTheory();

    mathModelClass.textContent = theory.modelClass;
    mathRhoVal.textContent = theory.rho >= 1.0 && queueCapacity === 999 ? `${theory.rho.toFixed(2)} (Unstable)` : theory.rho.toFixed(2);

    // Theory fields
    const tWq = theory.theoryWq === Infinity ? '∞' : `${theory.theoryWq.toFixed(2)} min`;
    const tLq = theory.theoryLq === Infinity ? '∞' : `${theory.theoryLq.toFixed(2)} cars`;
    const tBalk = `${theory.theoryBalk.toFixed(1)}%`;
    const tUtil = `${theory.theoryUtil.toFixed(1)}%`;

    mathTheoryWq.textContent = tWq;
    mathTheoryLq.textContent = tLq;
    mathTheoryBalk.textContent = tBalk;
    mathTheoryUtil.textContent = tUtil;

    // Simulation fields (Empirical averages)
    const simWq = totalServed > 0 ? totalWaitingTime / totalServed : 0;
    const simLq = integratedQueueLength / totalSimTime;
    const simBalk = totalArrivals > 0 ? (totalBalked / totalArrivals) * 100 : 0;
    const simUtil = (integratedUtilization / totalSimTime) * 100;

    mathSimWq.textContent = `${simWq.toFixed(2)} min`;
    mathSimLq.textContent = `${simLq.toFixed(2)} cars`;
    mathSimBalk.textContent = `${simBalk.toFixed(1)}%`;
    mathSimUtil.textContent = `${simUtil.toFixed(1)}%`;

    // Error calculations
    mathErrorWq.textContent = theory.theoryWq === Infinity ? '--' : `${calculateRelativeError(theory.theoryWq, simWq).toFixed(1)}%`;
    mathErrorLq.textContent = theory.theoryLq === Infinity ? '--' : `${calculateRelativeError(theory.theoryLq, simLq).toFixed(1)}%`;
    mathErrorBalk.textContent = `${calculateRelativeError(theory.theoryBalk, simBalk).toFixed(1)}%`;
    mathErrorUtil.textContent = `${calculateRelativeError(theory.theoryUtil, simUtil).toFixed(1)}%`;
  }

  function calculateRelativeError(theory, sim) {
    if (theory === 0 && sim === 0) return 0;
    if (theory === 0) return Math.abs(sim) * 100;
    return Math.min(100, (Math.abs(theory - sim) / theory) * 100);
  }

  // --- Tab Layout Navigation ---
  const tabButtons = document.querySelectorAll('.tab-btn');
  tabButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      tabButtons.forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
      
      btn.classList.add('active');
      const targetId = btn.getAttribute('data-tab');
      document.getElementById(targetId).classList.add('active');
    });
  });

  // --- Helper to get exact charger bay center coordinate ---
  function getBayX(i) {
    const BAY_WIDTH = 44;
    const space = (320 - numChargers * BAY_WIDTH) / (2 * numChargers);
    const centerPos = space + i * (BAY_WIDTH + 2 * space) + (BAY_WIDTH / 2);
    return 850 + centerPos;
  }

  // --- Dynamic Power Flow Orthogonal SVG Connections ---
  function updateSvgFlowLines() {
    const svgFlows = document.getElementById('svg-power-flows');
    if (!svgFlows) return;
    svgFlows.innerHTML = '';

    for (let i = 0; i < numChargers; i++) {
      const charger = chargers[i];
      const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      
      // Local Cable Routing: Drop down from canopy roof (y=100) to vehicle input (y=125)
      const bayX = getBayX(i);
      path.setAttribute('d', `M ${bayX} 100 L ${bayX} 125`);
      path.classList.add('flow-path');

      if (isOutage) {
        path.setAttribute('stroke', 'var(--red)');
        path.classList.add('animate-flow-paused');
      } else if (charger && charger.vehicle && charger.vehicle.state === 'charging') {
        path.setAttribute('stroke', 'var(--primary)');
        path.classList.add('animate-flow');
        // Speed up the flow based on allocated power
        const power = charger.vehicle.currentPowerAllocation || 120;
        const duration = Math.max(2, 10 * (120 / power));
        path.style.animationDuration = `${duration}s`;
      } else {
        path.setAttribute('stroke', '#cbd5e1'); // idle gray
        path.classList.add('animate-flow-paused');
      }
      svgFlows.appendChild(path);
    }
    
    // Grid Connection to EMS (330, 85) to (330, 250)
    const gridFlow = document.getElementById('flow-grid-ems');
    if (gridFlow) {
      if (isOutage) {
        gridFlow.setAttribute('stroke', 'var(--red)');
        gridFlow.classList.add('animate-flow-paused');
      } else if (activePowerDraw > 0) {
        gridFlow.setAttribute('stroke', 'var(--primary)');
        gridFlow.classList.remove('animate-flow-paused');
        gridFlow.classList.add('animate-flow');
        const duration = Math.max(1.5, 8 * (300 / activePowerDraw));
        gridFlow.style.animationDuration = `${duration}s`;
      } else {
        gridFlow.setAttribute('stroke', '#cbd5e1');
        gridFlow.classList.add('animate-flow-paused');
      }
    }
  }

  // --- Visual Outlines and Queue Spot Layout ---
  function updateStageOutlines() {
    const stageBg = document.getElementById('charger-bays-bg');
    if (!stageBg) return;
    stageBg.innerHTML = '';
    
    const BAY_WIDTH = 44;
    const space = (320 - numChargers * BAY_WIDTH) / (2 * numChargers);
    
    // Draw bay outlines inside the dark canopy
    for (let i = 0; i < numChargers; i++) {
      const charger = chargers[i];
      const bay = document.createElement('div');
      bay.className = 'charger-bay-outline';
      bay.id = `bay-outline-${i}`;
      bay.style.position = 'absolute';
      
      const leftPos = space + i * (BAY_WIDTH + 2 * space);
      bay.style.left = `${leftPos}px`;
      bay.style.width = `${BAY_WIDTH}px`;
      bay.style.top = '4px';
      bay.innerHTML = `
        <div class="charger-pole-icon"></div>
        <span class="charger-bay-label">B${i + 1}</span>
      `;
      if (charger && charger.vehicle) {
        bay.classList.add('active');
      }
      stageBg.appendChild(bay);
    }

    // Draw queue spots visual markings in road
    const queueIndicators = document.getElementById('queue-indicators');
    if (queueIndicators) {
      queueIndicators.innerHTML = '';
      const visibleQueueSpots = Math.min(6, queueCapacity);
      for (let i = 0; i < visibleQueueSpots; i++) {
        const spot = document.createElement('div');
        spot.className = 'queue-spot-outline';
        spot.textContent = `${i + 1}`;
        queueIndicators.appendChild(spot);
      }
    }
  }

  // --- Dynamic Charging Bay List Panel Console ---
  function updateChargerBaysMimic() {
    if (!mimicChargersList) return;
    mimicChargersList.innerHTML = '';
    for (let i = 0; i < numChargers; i++) {
      const charger = chargers[i];
      const slot = document.createElement('div');
      slot.className = 'charger-mini-bay';
      slot.id = `mimic-bay-${i}`;
      slot.innerHTML = `B${i+1}`;
      
      if (charger && charger.vehicle) {
        slot.classList.add('occupied');
      }
      mimicChargersList.appendChild(slot);
    }
  }

  // --- Load configuration on parameter changes ---
  function loadConfig() {
    arrivalRate = parseInt(paramArrivalRate.value);
    serviceTime = parseInt(paramServiceRate.value);
    numChargers = parseInt(paramChargers.value);
    queueCapacity = parseInt(paramCapacity.value);
    queueDiscipline = paramDiscipline.value;
    gridPowerLimit = parseInt(paramGridLimit.value);
    powerAllocationMode = paramPowerMode.value;

    valArrivalRate.textContent = `${arrivalRate} EVs/hr`;
    valServiceRate.textContent = `${serviceTime} mins`;
    valChargers.textContent = `${numChargers} Bays`;
    valGridLimit.textContent = `${gridPowerLimit} kW`;

    mimicArrivalVal.textContent = `${arrivalRate}/hr`;
    const totalBaysVal = document.getElementById('mimic-total-bays-val');
    if (totalBaysVal) {
      totalBaysVal.textContent = `${numChargers} Bays`;
    }

    // Dynamically adjust chargers array size to match numChargers input
    while (chargers.length < numChargers) {
      chargers.push({ vehicle: null });
    }
    while (chargers.length > numChargers) {
      const removed = chargers.pop();
      if (removed && removed.vehicle) {
        activeCars = activeCars.filter(c => c.id !== removed.vehicle.id);
        removed.vehicle.dom.remove();
      }
    }
    updateChargerBaysMimic();
    updateStageOutlines();
    updateSvgFlowLines();
    updateMathValidator();

    // Force canopy alignment dynamically to prevent CSS cache mismatch
    const canopySubstation = document.querySelector('.canopy-substation');
    if (canopySubstation) {
      canopySubstation.style.left = '850px';
      canopySubstation.style.top = '90px';
    }
  }

  [paramArrivalRate, paramServiceRate, paramChargers, paramCapacity, paramDiscipline, paramGridLimit, paramPowerMode].forEach(input => {
    input.addEventListener('input', () => {
      loadConfig();
      if (input === paramDiscipline) {
        sortQueue();
      }
    });
  });

  function initializeChargers() {
    chargers = [];
    for (let i = 0; i < numChargers; i++) {
      chargers.push({ vehicle: null });
    }
  }

  // --- Check if car is prioritized based on current discipline ---
  function isCarPrioritized(car) {
    return car.isPriority; // Only urgent vehicles use the top lane
  }

  // --- Rebuild vehicle paths when queue shifts ---
  function rebuildQueuePaths() {
    maxQueueLengthReached = Math.max(maxQueueLengthReached, queue.length);
    queue.forEach((car, idx) => {
      const targetX = 810 - idx * 75;
      const targetY = isCarPrioritized(car) ? 235 : 275;
      if (car.state === 'queued') {
        // Drive directly to its new queue coordinate
        car.targetPath = [{ x: targetX, y: targetY }];
      } else if (car.state === 'entering') {
        // Still entering: drive to target queue spot
        if (car.targetPath.length > 0) {
          // Update the final waypoint coordinate
          car.targetPath[car.targetPath.length - 1] = { x: targetX, y: targetY };
        } else {
          car.targetPath = [{ x: targetX, y: targetY }];
        }
      }
    });
    mimicQueueVal.textContent = `${queue.length}/${queueCapacity === 999 ? '∞' : queueCapacity}`;
  }

  // --- Queue Discipline Sorting Logic ---
  function sortQueue() {
    if (queue.length === 0) return;
    
    if (queueDiscipline === 'FIFO') {
      // Sort by priority first (urgent to front), then by arrival order (id)
      queue.sort((a, b) => {
        if (a.isPriority && !b.isPriority) return -1;
        if (!a.isPriority && b.isPriority) return 1;
        return a.id - b.id; // tie-breaker: FIFO
      });
    } else if (queueDiscipline === 'SJF') {
      // Sort by remaining charge requirement (Shortest Job First)
      queue.sort((a, b) => a.remainingChargeTime - b.remainingChargeTime);
    } else if (queueDiscipline === 'PRIORITY') {
      // Emergency/Low SOC priority gets sorted to front
      queue.sort((a, b) => {
        if (a.isPriority && !b.isPriority) return -1;
        if (!a.isPriority && b.isPriority) return 1;
        // Tie-breaker: sort by SOC ascending (lowest SOC first)
        if (a.soc !== b.soc) return a.soc - b.soc;
        return a.id - b.id; // final tie-breaker: FIFO
      });
    }
    rebuildQueuePaths();
  }

  // --- Spawn EV Vehicle Model with Physics and Kinematics ---
  function spawnVisualCar(id) {
    const carColors = ['car-blue', 'car-purple', 'car-orange', 'car-green'];
    const colorClass = carColors[Math.floor(Math.random() * carColors.length)];
    const startSoc = Math.floor(10 + Math.random() * 35); // 10% - 45% initial charge
    const isPriority = Math.random() < 0.15; // 15% priority ambulance/emergency rate
    
    // Service duration randomized around baseline serviceTime setting
    const randomFactor = 0.7 + Math.random() * 0.7; // 70% to 140% deviation
    const chargingDuration = serviceTime * randomFactor * ((100 - startSoc) / 100);

    const carDiv = document.createElement('div');
    carDiv.className = `ev-car ${colorClass}`;
    if (isPriority) carDiv.classList.add('priority-car');
    carDiv.id = `visual-car-${id}`;
    
    // Set absolute starting coordinates offscreen left
    carDiv.style.transform = `translate3d(-60px, 255px, 0) rotate(0deg)`;
    carDiv.innerHTML = `
      <div class="car-priority-badge">URGENT</div>
      <div class="car-glass"></div>
      <div class="car-taillights"></div>
      <span class="car-label">EV-${id} (${startSoc}%)</span>
      <div class="car-charge-bar"><div class="car-charge-fill" id="fill-${id}" style="width: ${startSoc}%"></div></div>
      <div class="charge-spark">⚡</div>
      <div class="car-wheels"></div>
      <div class="car-wheels-back"></div>
    `;

    mimicContainer.appendChild(carDiv);

    // Initial Waypoint Path: Drive straight along main horizontal road to target queue spot
    const prioritized = isPriority; // Only urgent vehicles get the top lane
    const targetY = prioritized ? 235 : 275;
    const targetX = 810 - queue.length * 75;
    const initialPath = [
      { x: targetX, y: targetY } // designated queue spot
    ];

    const carObject = {
      id: id,
      dom: carDiv,
      soc: startSoc,
      startSoc: startSoc,
      isPriority: isPriority,
      targetChargingDuration: chargingDuration,
      remainingChargeTime: chargingDuration,
      currentPowerAllocation: 0,
      arrivalTime: simTime,
      waitingTime: 0,
      x: -60,
      y: 215,
      angle: 0,
      targetPath: initialPath,
      state: 'entering' // entering, queued, to_charger, charging, exiting
    };

    activeCars.push(carObject);
    logEvent('Arrival', `EV-${id} joined the queue`);
    return carObject;
  }

  // --- Smooth Kinematic Movement Update Loop ---
  function updateCarMovement(car, dt) {
    if (car.targetPath.length === 0) {
      car.dom.classList.remove('moving');
      // Override angle when stationary to prevent diagonal/tilted vehicles
      if (car.state === 'queued' || car.state === 'entering' || car.state === 'exiting') {
        car.angle = 0;
      } else if (car.state === 'charging') {
        car.angle = 270;
      }
      car.dom.style.transform = `translate3d(${car.x - 26}px, ${car.y - 15}px, 0) rotate(${car.angle}deg)`;
      return;
    }

    car.dom.classList.add('moving');
    const target = car.targetPath[0];
    const dx = target.x - car.x;
    const dy = target.y - car.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    // Baseline movement speeds (pixels/sec) scaled by simSpeed
    const baseSpeed = car.state === 'entering' || car.state === 'exiting' ? 140 : 100;
    const speed = baseSpeed * simSpeed;
    const step = speed * dt;

    if (dist <= step) {
      // Reached intermediate waypoint
      car.x = target.x;
      car.y = target.y;
      car.targetPath.shift();

      if (car.targetPath.length === 0) {
        // Reached final target of current path
        if (car.state === 'entering') {
          car.state = 'queued';
        } else if (car.state === 'to_charger') {
          car.state = 'charging';
          car.dom.classList.add('charging');
          car.dom.classList.remove('moving');
        } else if (car.state === 'exiting') {
          // Reached offscreen right, remove elements cleanly
          car.dom.remove();
          activeCars = activeCars.filter(c => c.id !== car.id);
        }
      }
    } else {
      // Continuous linear interpolation towards target coordinate
      const ux = dx / dist;
      const uy = dy / dist;
      car.x += ux * step;
      car.y += uy * step;

      // Rotate car dynamically towards steering vector
      let targetAngle = Math.atan2(uy, ux) * 180 / Math.PI;
      
      // Interpolate rotation so turn looks organic and not instant
      let angleDiff = targetAngle - car.angle;
      while (angleDiff < -180) angleDiff += 360;
      while (angleDiff > 180) angleDiff -= 360;
      car.angle += angleDiff * 10 * dt; // turn speed factor
    }

    // Apply translate and rotate CSS properties
    car.dom.style.transform = `translate3d(${car.x - 26}px, ${car.y - 15}px, 0) rotate(${car.angle}deg)`;
  }

  // --- Dynamic Smart Grid Power Allocation Algorithms ---
  function calculatePowerAllocation() {
    // Collect all active charging vehicles
    const activeVehicles = [];
    for (let i = 0; i < numChargers; i++) {
      if (chargers[i] && chargers[i].vehicle && chargers[i].vehicle.state === 'charging') {
        activeVehicles.push(chargers[i].vehicle);
      }
    }

    // If grid is out, cut all power immediately
    if (isOutage || activeVehicles.length === 0) {
      activeVehicles.forEach(ev => { ev.currentPowerAllocation = 0; });
      activePowerDraw = 0;
      return;
    }

    if (powerAllocationMode === 'fixed') {
      // 1. Equal Throttle (Fixed Max 120kW per bay capped at Grid Limit)
      const requested = activeVehicles.length * 120;
      if (requested <= gridPowerLimit) {
        activeVehicles.forEach(ev => { ev.currentPowerAllocation = 120; });
        activePowerDraw = requested;
      } else {
        // Throttle equally below grid threshold
        const throttled = gridPowerLimit / activeVehicles.length;
        activeVehicles.forEach(ev => { ev.currentPowerAllocation = throttled; });
        activePowerDraw = gridPowerLimit;
      }
    } else if (powerAllocationMode === 'smart') {
      // 2. Smart SOC-Weighted Allocation
      // Urgent priority cars get weight boost. Low SOC gets weight boost.
      let totalWeight = 0;
      const weights = activeVehicles.map(ev => {
        let weight = (100 - ev.soc); // lower SOC = higher weight
        if (ev.isPriority) weight *= 2.0; // priority weight multiplier
        totalWeight += weight;
        return { ev, weight };
      });

      if (totalWeight === 0) {
        activeVehicles.forEach(ev => { ev.currentPowerAllocation = gridPowerLimit / activeVehicles.length; });
        activePowerDraw = gridPowerLimit;
        return;
      }

      // Initial allocation proportional to weight
      let allocatedTotal = 0;
      let surplusPower = 0;
      const candidates = [];

      weights.forEach(w => {
        let p = (w.weight / totalWeight) * gridPowerLimit;
        if (p > 150) {
          // Cap charger rate at a high-speed max of 150 kW
          surplusPower += (p - 150);
          w.ev.currentPowerAllocation = 150;
        } else if (p < 30) {
          // Minimum trickle charge of 30 kW
          surplusPower -= (30 - p);
          w.ev.currentPowerAllocation = 30;
        } else {
          w.ev.currentPowerAllocation = p;
          candidates.push(w.ev);
        }
        allocatedTotal += w.ev.currentPowerAllocation;
      });

      // Distribute any surplus or deficit power to non-capped chargers
      if (surplusPower !== 0 && candidates.length > 0) {
        candidates.forEach(ev => {
          ev.currentPowerAllocation += (surplusPower / candidates.length);
          // Recap between boundaries
          ev.currentPowerAllocation = Math.min(150, Math.max(30, ev.currentPowerAllocation));
        });
      }

      // Compute final active grid power draw sum
      let finalSum = 0;
      activeVehicles.forEach(ev => { finalSum += ev.currentPowerAllocation; });
      activePowerDraw = Math.min(gridPowerLimit, finalSum);
    }
  }

  // --- Core Simulation Physics Frame Tick ---
  let nextArrivalTimer = 0;

  function tickSimulation(dt) {
    simTime += dt;
    totalSimTime += dt;

    // 1. Process Surge Timer Decrement
    if (surgeTimer > 0) {
      surgeTimer -= dt;
      if (surgeTimer <= 0) {
        arrivalRate = originalArrivalRate;
        paramArrivalRate.value = originalArrivalRate;
        valArrivalRate.textContent = `${arrivalRate} EVs/hr`;
        mimicArrivalVal.textContent = `${arrivalRate}/hr`;
        mimicArrivalStatus.textContent = 'Streaming';
        mimicArrivalStatus.className = 'block-badge standby';
        telemetrySystemDesc.textContent = 'Grid stable';
      }
    }

    // 2. Queue Integrators for Mathematical Time-Averages
    integratedQueueLength += queue.length * dt;
    const activeBays = chargers.filter(c => c.vehicle !== null).length;
    integratedUtilization += (activeBays / numChargers) * dt;

    // 3. Process Poisson Arrivals
    nextArrivalTimer -= dt;
    if (nextArrivalTimer <= 0) {
      const meanInterval = 60 / arrivalRate; // minutes
      // Exponential distribution arrival timer
      nextArrivalTimer = -meanInterval * Math.log(Math.random());

      totalArrivals++;
      if (queue.length < queueCapacity) {
        const newCar = spawnVisualCar(totalArrivals);
        queue.push(newCar);
        sortQueue();
      } else {
        totalBalked++;
      }
    }

    // 4. Charger Bay Allocations from Queue
    for (let i = 0; i < numChargers; i++) {
      let charger = chargers[i];
      if (!charger) continue;

      if (!charger.vehicle && queue.length > 0) {
        const car = queue.shift();
        chargers[i].vehicle = car;
        car.state = 'to_charger';

        // Calculate and accumulate queuing wait time
        car.waitingTime = simTime - car.arrivalTime;
        totalWaitingTime += car.waitingTime;

        // Path update: drive straight right past queue, turn up into allocated charger bay B(i)
        const bayX = getBayX(i);
        car.targetPath = [
          { x: bayX, y: 255 }, // corner entrance below bay i
          { x: bayX, y: 150 }  // park inside bay i
        ];

        rebuildQueuePaths();
        updateChargerBaysMimic();
        
        // Immediately sync the active outline class in real-time
        const outline = document.getElementById(`bay-outline-${i}`);
        if (outline) outline.classList.add('active');
        
        logEvent('Charging Started', `EV-${car.id} started at Bay B${i + 1}`);
      }
    }

    // 5. Update Grid Power Allocations
    calculatePowerAllocation();

    // 6. Charging State Calculations & Departures
    activeCars.forEach(car => {
      // Update coordinates
      updateCarMovement(car, dt);

      if (car.state === 'charging') {
        if (isOutage) {
          // Charging is frozen, hide spark elements
          car.dom.classList.remove('charging');
          return;
        } else {
          car.dom.classList.add('charging');
        }

        // Scale charging rate based on dynamic kW allocated by EMS
        const powerDraw = car.currentPowerAllocation || 120;
        const speedMultiplier = powerDraw / 120;
        
        // Remaining charge time decreases relative to frame step dt
        car.remainingChargeTime = Math.max(0, car.remainingChargeTime - dt * speedMultiplier);
        
        // Linear mapping to SOC
        car.soc = car.startSoc + (100 - car.startSoc) * (1 - car.remainingChargeTime / car.targetChargingDuration);
        car.soc = Math.min(100, Math.max(0, car.soc));

        // Update progress bar fill & percentage tooltip label
        const fillBar = document.getElementById(`fill-${car.id}`);
        if (fillBar) fillBar.style.width = `${car.soc}%`;
        car.dom.querySelector('.car-label').textContent = `EV-${car.id} (${Math.round(car.soc)}%)`;

        // Charging Complete, trigger departure
        if (car.soc >= 100) {
          car.state = 'exiting';
          totalServed++;

          // Clear bay reference
          const bayIdx = chargers.findIndex(c => c.vehicle === car);
          if (bayIdx !== -1) {
            chargers[bayIdx].vehicle = null;
            const outline = document.getElementById(`bay-outline-${bayIdx}`);
            if (outline) outline.classList.remove('active');
          }

          car.dom.classList.remove('charging');
          car.dom.classList.remove('priority-car');

          // Exit Path: drive down out of bay to main road, turn right, drive offscreen
          const bayX = getBayX(bayIdx);
          car.targetPath = [
            { x: bayX, y: 255 }, // exit road intersection
            { x: 1400, y: 255 }  // offscreen right
          ];

          updateChargerBaysMimic();
          updateStageOutlines();
          logEvent('Completed', `EV-${car.id} completed charging (Bay B${bayIdx + 1})`);
        }
      }
    });

    // 7. Update SCADA visual elements
    updateSvgFlowLines();
    updateDashboardTelemetry();
  }

  // --- Telemetry Dashboard Panel Updates ---
  function updateDashboardTelemetry() {
    const activeBays = chargers.filter(c => c.vehicle !== null).length;
    
    // Header readouts
    const hours = Math.floor(simTime / 60);
    const mins = Math.floor(simTime % 60);
    headerSimTime.textContent = `${hours}h ${mins}m`;
    headerGridLoad.textContent = `${Math.round(activePowerDraw)} kW`;

    // Efficiency logic: efficiency decreases slightly as balking rate increases
    const totalAttempted = totalServed + queue.length + totalBalked;
    const balkRate = totalAttempted > 0 ? (totalBalked / totalAttempted) * 100 : 0;
    const efficiency = Math.max(0, 100 - balkRate);
    headerEfficiency.textContent = `${efficiency.toFixed(1)}%`;

    mimicGridPower.textContent = `${Math.round(activePowerDraw)} kW`;
    
    // Queue buffer card badges
    if (queue.length === 0) {
      mimicQueueStatus.textContent = 'EMPTY';
      mimicQueueStatus.className = 'block-badge active';
    } else if (queue.length >= queueCapacity) {
      mimicQueueStatus.textContent = 'CONGESTED';
      mimicQueueStatus.className = 'block-badge alert';
    } else {
      mimicQueueStatus.textContent = `QUEUE: ${queue.length}`;
      mimicQueueStatus.className = 'block-badge standby';
    }

    mimicServedVal.textContent = `${totalServed} Served`;

    const trafficIntensity = arrivalRate / (numChargers * (60 / serviceTime));
    if (isOutage) {
      mimicEmsVal.textContent = 'SHUTDOWN';
      mimicEmsStatus.textContent = 'GRID OUTAGE';
      mimicEmsStatus.className = 'block-badge alert';
    } else if (trafficIntensity >= 1.0) {
      mimicEmsVal.textContent = 'Overloaded';
      mimicEmsStatus.textContent = 'THROTTLED';
      mimicEmsStatus.className = 'block-badge standby';
    } else {
      mimicEmsVal.textContent = 'Normal';
      mimicEmsStatus.textContent = 'Online';
      mimicEmsStatus.className = 'block-badge active';
    }

    // Telemetry metric cards (right sidebar)
    telemetryArrivals.textContent = `${totalArrivals} EVs`;
    telemetryServed.textContent = `${totalServed} EVs`;

    const instantUtil = numChargers > 0 ? (activeBays / numChargers) * 100 : 0;
    telemetryUtilization.textContent = `${instantUtil.toFixed(1)}%`;
    if (instantUtil >= 90) {
      telemetryUtilStatus.textContent = 'Peak Demand';
      telemetryUtilStatus.style.color = 'var(--orange)';
    } else if (instantUtil >= 50) {
      telemetryUtilStatus.textContent = 'Optimal Load';
      telemetryUtilStatus.style.color = 'var(--primary)';
    } else {
      telemetryUtilStatus.textContent = 'Low / Standby';
      telemetryUtilStatus.style.color = 'var(--text-muted)';
    }

    const avgWait = totalServed > 0 ? totalWaitingTime / totalServed : 0;
    telemetryWait.textContent = `${avgWait.toFixed(1)} min`;
    if (avgWait > 15) {
      telemetryWaitStatus.textContent = 'High Delay';
      telemetryWaitStatus.style.color = 'var(--red)';
    } else {
      telemetryWaitStatus.textContent = 'Optimal';
      telemetryWaitStatus.style.color = 'var(--primary)';
    }

    telemetryQueueLen.textContent = `${queue.length} Cars`;
    telemetryQueueStatus.textContent = queue.length > (queueCapacity / 2) ? 'Buffer Full' : 'Optimal Queue';

    telemetryBalked.textContent = `${totalBalked} EVs`;
    telemetryBalkStatus.textContent = `${balkRate.toFixed(1)}% Balk Rate`;

    telemetryPower.textContent = `${Math.round(activePowerDraw)} kW`;

    // System Status Card
    if (isOutage) {
      telemetrySystemStatus.textContent = 'CRITICAL';
      telemetrySystemDesc.textContent = 'Outage alert';
      telemetrySystemIcon.className = 'metric-icon red';
      telemetrySystemIcon.innerHTML = '<i data-lucide="shield-alert"></i>';
    } else if (trafficIntensity >= 1.0 && queueCapacity > 20) {
      telemetrySystemStatus.textContent = 'UNSTABLE';
      telemetrySystemDesc.textContent = 'Queue growing infinitely';
      telemetrySystemIcon.className = 'metric-icon orange';
      telemetrySystemIcon.innerHTML = '<i data-lucide="alert-triangle"></i>';
    } else {
      telemetrySystemStatus.textContent = 'NORMAL';
      telemetrySystemDesc.textContent = 'Grid stable';
      telemetrySystemIcon.className = 'metric-icon green';
      telemetrySystemIcon.innerHTML = '<i data-lucide="heart"></i>';
    }

    // --- Metrics Summary Cards Updates (Middle Row) ---
    document.getElementById('metric-queue-len').textContent = queue.length;
    document.getElementById('metric-max-queue').textContent = maxQueueLengthReached;
    
    document.getElementById('metric-active-bays').textContent = `${activeBays}/${numChargers}`;
    const utilPct = numChargers > 0 ? Math.round((activeBays / numChargers) * 100) : 0;
    document.getElementById('metric-utilization').textContent = `${utilPct}%`;
    
    document.getElementById('metric-served').textContent = totalServed;
    document.getElementById('metric-wait-time').textContent = `${avgWait.toFixed(1)} min`;
    document.getElementById('metric-max-len').textContent = maxQueueLengthReached;
    document.getElementById('metric-efficiency').textContent = `${efficiency.toFixed(1)}%`;
    
    const powerDraw = Math.round(activePowerDraw);
    document.getElementById('metric-grid-load').textContent = `${powerDraw} kW`;
    document.getElementById('metric-grid-limit').textContent = `${gridPowerLimit} kW`;
    const powerPct = Math.min(100, gridPowerLimit > 0 ? Math.round((powerDraw / gridPowerLimit) * 100) : 0);
    document.getElementById('metric-grid-bar').style.width = `${powerPct}%`;
    
    const healthBox = document.getElementById('metric-health-box');
    const healthStatus = document.getElementById('metric-health-status');
    const healthDesc = document.getElementById('metric-health-desc');
    if (isOutage) {
      healthBox.className = 'health-alert-box red';
      healthStatus.textContent = 'CRITICAL';
      healthDesc.textContent = 'Grid outage active';
    } else if (trafficIntensity >= 1.0) {
      healthBox.className = 'health-alert-box orange';
      healthStatus.textContent = 'UNSTABLE';
      healthDesc.textContent = 'Queue growing infinitely';
    } else {
      healthBox.className = 'health-alert-box green';
      healthStatus.textContent = 'STABLE';
      healthDesc.textContent = 'All systems normal';
    }

    lucide.createIcons();
  }

  // --- Live Events Logging ---
  let eventLog = [];
  function logEvent(type, details) {
    const hours = Math.floor(simTime / 60).toString().padStart(2, '0');
    const mins = Math.floor(simTime % 60).toString().padStart(2, '0');
    const secs = Math.floor((simTime * 60) % 60).toString().padStart(2, '0');
    const timeString = `${hours}:${mins}:${secs}`;
    
    eventLog.unshift({ time: timeString, type: type, details: details });
    if (eventLog.length > 50) eventLog.pop();
    updateEventsLogUI();
  }

  function updateEventsLogUI() {
    const body = document.getElementById('events-log-body');
    if (!body) return;
    body.innerHTML = '';
    
    if (eventLog.length === 0) {
      body.innerHTML = `
        <tr class="empty-log-row">
          <td colspan="3" style="text-align: center; color: var(--text-muted); font-size: 0.7rem; padding: 1.5rem 0;">No events recorded</td>
        </tr>
      `;
      return;
    }
    
    eventLog.forEach(item => {
      let typeClass = 'arrival';
      if (item.type.includes('Charging')) typeClass = 'charge-start';
      else if (item.type.includes('Completed')) typeClass = 'charge-end';
      else if (item.type.includes('Throttle') || item.type.includes('Surge')) typeClass = 'throttle';
      else if (item.type.includes('Outage')) typeClass = 'outage';
      
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td class="events-log-time">${item.time}</td>
        <td><span class="events-log-type ${typeClass}">${item.type}</span></td>
        <td style="color: var(--text-secondary); font-weight: 500;">${item.details}</td>
      `;
      body.appendChild(tr);
    });
  }

  // --- Real-time SCADA Line Charting ---
  const ctx = document.getElementById('metricsChart').getContext('2d');
  const metricsChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: [],
      datasets: [
        {
          label: 'Queue Size (Vehicles)',
          data: [],
          borderColor: '#8b5cf6',
          backgroundColor: 'rgba(139, 92, 246, 0.04)',
          borderWidth: 2.5,
          fill: true,
          tension: 0.3,
          yAxisID: 'y'
        },
        {
          label: 'Active Chargers (Occupied)',
          data: [],
          borderColor: '#3b82f6',
          backgroundColor: 'transparent',
          borderWidth: 2.5,
          borderDash: [5, 5],
          fill: false,
          tension: 0.1,
          yAxisID: 'y'
        },
        {
          label: 'Grid Power (kW)',
          data: [],
          borderColor: '#10b981',
          backgroundColor: 'transparent',
          borderWidth: 2,
          fill: false,
          tension: 0.2,
          yAxisID: 'yPower'
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: {
          grid: { display: false },
          title: { display: true, text: 'Simulated Duration (minutes)', font: { family: 'Inter', weight: 'bold', size: 10 } }
        },
        y: {
          type: 'linear',
          display: true,
          position: 'left',
          min: 0,
          suggestedMax: 5,
          grid: { color: '#f1f5f9' },
          title: { display: true, text: 'Count (Vehicles)', font: { family: 'Inter', weight: 'bold', size: 10 } }
        },
        yPower: {
          type: 'linear',
          display: true,
          position: 'right',
          min: 0,
          suggestedMax: 300,
          grid: { drawOnChartArea: false }, // avoid grid overlaps
          title: { display: true, text: 'Grid Load (kW)', font: { family: 'Inter', weight: 'bold', size: 10 } }
        }
      },
      plugins: {
        legend: { 
          position: 'top',
          labels: { font: { family: 'Inter', size: 10, weight: 600 } }
        }
      }
    }
  });

  function updateChartData() {
    const timeLabel = Math.round(simTime);
    const activeBays = chargers.filter(c => c.vehicle !== null).length;

    metricsChart.data.labels.push(`${timeLabel}m`);
    metricsChart.data.datasets[0].data.push(queue.length);
    metricsChart.data.datasets[1].data.push(activeBays);
    metricsChart.data.datasets[2].data.push(activePowerDraw);

    // Keep last 25 entries in chart window
    if (metricsChart.data.labels.length > 25) {
      metricsChart.data.labels.shift();
      metricsChart.data.datasets[0].data.shift();
      metricsChart.data.datasets[1].data.shift();
      metricsChart.data.datasets[2].data.shift();
    }
    metricsChart.update('none');
  }

  // --- Animation Clock Loop ---
  let chartUpdateTimer = 0;
  function simulationLoop(timestamp) {
    if (!isRunning) return;

    if (!lastTickTime) lastTickTime = timestamp;
    const elapsed = timestamp - lastTickTime;
    lastTickTime = timestamp;

    // Convert real elapsed time to simulated minutes
    const dt = (elapsed / 1000) * simSpeed;
    tickSimulation(dt);

    chartUpdateTimer += dt;
    if (chartUpdateTimer >= 1.0) {
      updateChartData();
      updateMathValidator();
      chartUpdateTimer = 0;
    }

    requestAnimationFrame(simulationLoop);
  }

  // --- Event Button Listeners ---
  btnPlayPause.addEventListener('click', () => {
    isRunning = true;
    lastTickTime = 0;
    btnPlayPause.disabled = true;
    btnPause.disabled = false;
    
    // Resume SVG flows
    const flowPaths = document.querySelectorAll('.flow-path');
    flowPaths.forEach(path => {
      path.classList.remove('animate-flow-paused');
      path.classList.add('animate-flow');
    });

    requestAnimationFrame(simulationLoop);
  });

  btnPause.addEventListener('click', () => {
    isRunning = false;
    btnPlayPause.disabled = false;
    btnPause.disabled = true;

    // Pause SVG flows
    const flowPaths = document.querySelectorAll('.flow-path');
    flowPaths.forEach(path => {
      path.classList.add('animate-flow-paused');
    });
  });

  btnReset.addEventListener('click', () => {
    isRunning = false;
    btnPlayPause.disabled = false;
    btnPause.disabled = true;
    
    // Reset all parameters
    simTime = 0;
    totalSimTime = 0.001;
    totalArrivals = 0;
    totalServed = 0;
    totalBalked = 0;
    totalWaitingTime = 0;
    nextArrivalTimer = 0;
    integratedQueueLength = 0;
    integratedUtilization = 0;
    queue = [];

    // Resolve outage and surge states
    isOutage = false;
    maxQueueLengthReached = 0;
    eventLog = [];
    updateEventsLogUI();
    outageOverlay.style.display = 'none';
    surgeTimer = 0;
    arrivalRate = originalArrivalRate;
    paramArrivalRate.value = originalArrivalRate;
    mimicArrivalStatus.textContent = 'Streaming';
    mimicArrivalStatus.className = 'block-badge standby';
    mimicGridStatus.textContent = 'Connected';
    mimicGridStatus.className = 'block-badge active';

    // Clear vehicles from container
    activeCars.forEach(car => car.dom.remove());
    activeCars = [];

    initializeChargers();
    loadConfig();

    // Reset chart datasets
    metricsChart.data.labels = [];
    metricsChart.data.datasets[0].data = [];
    metricsChart.data.datasets[1].data = [];
    metricsChart.data.datasets[2].data = [];
    metricsChart.update();
  });

  speedButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      speedButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      simSpeed = parseInt(btn.getAttribute('data-speed'));
    });
  });

  // --- Grid Incident Triggers ---
  btnTriggerSurge.addEventListener('click', () => {
    if (surgeTimer > 0) return; // already active
    
    originalArrivalRate = parseInt(paramArrivalRate.value);
    arrivalRate = Math.min(60, originalArrivalRate * 3); // triple arrival load up to max 60
    paramArrivalRate.value = arrivalRate;
    valArrivalRate.textContent = `${arrivalRate} EVs/hr`;
    mimicArrivalVal.textContent = `${arrivalRate}/hr`;
    
    mimicArrivalStatus.textContent = 'TRAFFIC SURGE';
    mimicArrivalStatus.className = 'block-badge alert';
    
    telemetrySystemDesc.textContent = 'Grid load surge';
    
    surgeTimer = 3.0; // surge lasts for 3 simulated minutes
    logEvent('Traffic Surge', 'Grid load surge active: Arrival rate tripled');
  });

  btnTriggerOutage.addEventListener('click', () => {
    isOutage = true;
    outageOverlay.style.display = 'flex';
    mimicGridStatus.textContent = 'OUTAGE ALERT';
    mimicGridStatus.className = 'block-badge alert';
    
    calculatePowerAllocation();
    updateSvgFlowLines();
    updateDashboardTelemetry();
    logEvent('Grid Outage', 'Emergency power shutdown triggered');
  });

  btnResolveOutage.addEventListener('click', () => {
    isOutage = false;
    outageOverlay.style.display = 'none';
    mimicGridStatus.textContent = 'Connected';
    mimicGridStatus.className = 'block-badge active';
    
    calculatePowerAllocation();
    updateSvgFlowLines();
    updateDashboardTelemetry();
    logEvent('Grid Recovered', 'Grid connection restored successfully');
  });

  // --- Init Boot ---
  loadConfig();
  
  // Auto-trigger simulation start so users immediately see visual motion!
  btnPlayPause.click();
});