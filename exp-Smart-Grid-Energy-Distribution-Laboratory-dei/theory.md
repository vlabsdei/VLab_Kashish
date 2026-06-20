## 1. Introduction to Smart Grids
A Smart Grid is an advanced electrical power network that uses digital communications, sensors, and automated controls to manage electricity distribution. Unlike traditional grids, which only transmit power one-way from large power stations to consumers, a smart grid allows two-way flows of both electricity and information. It continuously matches real-time power generation with real-time consumer load demand.


## 2. Microgrid System Components

The microgrid simulation includes the following key components:

### 2.1 Distributed Generation Sources
* Solar Power Plant: Generates clean energy from sunlight. The output changes depending on weather settings (Sunny, Cloudy, or Night).
* Wind Power Plant: Generates clean energy from wind. The output depends on wind conditions (Windy, Breeze, Calm, or Storm).

### 2.2 Central Energy Management & Routing
* Smart Grid Controller: The brain of the system. It monitors generation, calculates demand, and makes real-time decisions on where to route power.
* Distribution Network: The smart physical routing hub that delivers power directly to consumers.

### 2.3 Battery Energy Storage System (BESS)
A rechargeable battery storage system (with a capacity of 1000 kWh) that buffers fluctuations in solar and wind power.
* Charging: When generation is greater than load demand, the controller directs the surplus power to charge the battery. The battery's charge rate is capped at 150 kW.
* Discharging: When demand is higher than generation, the battery discharges to feed the loads. The battery's discharge rate is capped at 200 kW.

### 2.4 Backup Utility Grid
A connection to the external main power grid.
* Grid-Tied Mode: Reconnects to the utility grid. It imports electricity to cover any deficit that renewable sources and batteries cannot handle. It exports excess electricity back to the grid when local generation and batteries are full.
* Island Mode (Standalone): Disconnects the microgrid from the utility grid. The system must rely entirely on its own generation and battery storage. If local supply falls short and the battery reaches 0%, a blackout occurs.


## 3. Control Actions & Safety Protocols

### 3.1 Storm Lockout Protection
In high-speed wind conditions (Storm preset), wind turbines are vulnerable to severe mechanical stress and structural damage. The grid controller automatically activates safety brakes, bringing wind power output immediately to 0 kW and displaying a red warning alert on the node. The utility grid and battery step in to keep the network stable.

### 3.2 Blackout Prevention & Load Shedding
In Island Mode, if generation is low (e.g., night time with no wind) and the battery runs completely out of charge (0%), the controller cannot deliver power. This triggers a localized blackout state, turning consumer nodes off (red/dark state) and dropping grid efficiency to 0% until power generation increases or grid connection is restored.


## 4. Mathematical Calculations

These formulas match the calculations performed in the simulation code:

### 4.1 Total Power Calculations
* Total Generated Power (kW):
  Total Generated Power = Solar Generation + Wind Generation

* Total Demand (kW):
  Total Demand = Residential Load + Commercial Load + Industrial Load

* Net Power Balance (kW):
  Net Power Balance = Total Generated Power - Total Demand
  * If Net Power Balance is positive (+), the grid has a surplus.
  * If Net Power Balance is negative (-), the grid has a deficit.

### 4.2 Battery Power Exchange (kW)
* Under a Surplus: The battery charges at a maximum rate of 150 kW.
  Battery Power Exchange = -Min(Net Power Balance, 150)
* Under a Deficit: The battery discharges at a maximum rate of 200 kW.
  Battery Power Exchange = Min(Deficit Power, 200)

### 4.3 Grid Efficiency (%)
Grid Efficiency measures the proportion of consumer load demand met by local resources (renewable generation + battery storage) without relying on external utility grid imports:
* In Surplus/Balanced Conditions: Grid Efficiency is 100.0% as local supply covers the entire demand.
* In Deficit Conditions (Grid-Tied Mode): Efficiency drops below 100.0% because backup power is imported from the utility grid to cover the deficit.
* In Deficit Conditions (Island Mode): Efficiency drops below 100.0% because local generation and battery storage cannot cover the demand, resulting in unmet load (load shedding/blackout).

Grid Efficiency = ((Actual Load Covered - Utility Import) / Total Demand) * 100

### 4.4 Renewable Share
Renewable Share measures the proportion of demand powered by solar and wind:
Renewable Share (%) = (Min(Total Generated Power, Total Demand) / Total Demand) * 100


## 5. Performance Classifications

### 5.1 Renewable Share Classification
* High: Renewable Share is 80% or greater.
* Moderate: Renewable Share is between 40% and 79%.
* Low: Renewable Share is less than 40%.

### 5.2 Grid Conditions
* Grid Stable: Power generation matches demand; no active imports, exports, or battery exchanges.
* Grid Importing: Reconnected to the utility grid to bring in backup power.
* Grid Exporting: Exporting clean surplus generation to the utility grid.
* Battery Charging: Storing surplus power in the local BESS.
* Battery Discharging: Supplying battery power to cover deficits.
* Storm Protocol: Turbine output is locked to 0 kW for safety.
* Blackout / Alarm: Standalone system has run out of battery and generation, causing a total blackout.


## 6. Conclusion
This simulation shows the practical application of smart grids in smart city infrastructure. It highlights the role of energy storage buffers, grid-tied safety nets, and automated safety overrides (like Storm Lockout) in managing volatile renewable energy inputs and keeping electricity delivery stable and reliable.