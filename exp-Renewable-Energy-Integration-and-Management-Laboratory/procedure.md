## Step 1: Start the Simulation Loop

1. Click on the Start Loop button in the top left.
2. Note that the grid cables activate showing dashes (representing power flow), and the Wind Turbine blades begin rotating based on the current wind speed.
3. Observe that the SCADA Live Trends graph starts plotting data in real-time.


## Step 2: Analyze Weather & Generation Parameters

1. Solar PV System:
   - Move the Solar Irradiance slider from 0 to 1000 W/m². Note the change in generation.
   - Adjust the Ambient Temperature slider. Notice how cell temperature increases and solar generation efficiency decreases at higher cell temperatures.
   - Toggle the solar controls on the node card (Sunny, Cloudy, Night) and observe their quick preset impact.
2. Wind Turbine Array:
   - Adjust the Wind Speed slider. Verify that output is 0 kW below the 3.0 m/s cut-in speed, ramps up to rated capacity at 12.0 m/s, and brakes to 0 kW (showing BRAKED badge) at or above 20.0 m/s (cut-out speed).
   - Adjust the Blade Pitch Angle slider. Observe how pitch angle throttling reduces the aerodynamic power coefficient.
3. Biomass Plant:
   - Turn the Biomass Plant Online or Standby using the controls on its node card.
   - Move the Biomass Fuel Rate slider and observe the proportional change in biomass generation.


## Step 3: Configure Consumer Load Demands

1. Adjust the sliders for Residential Load, Commercial Load, and Industrial Load.
2. Observe how the Total Demand metric in the right sidebar changes dynamically.
3. Toggle the Demand Response (DR) switch. Verify that load shedding reduces residential and industrial loads by 15%, and commercial loads by 10%.


## Step 4: Study Smart EMS Dispatch Strategies

1. Max Self-Consumption:
   - Set the grid to Grid-Tied.
   - Generate a power surplus (Generation > Demand). Note that excess power is routed first to charge the Lithium Battery, then to the Hydrogen Storage Cell (electrolysis), and any remaining surplus is exported to the Utility Grid.
   - Create a power deficit (Demand > Generation). Note that the battery discharges (down to its 10.0% SoC safety limit) and the fuel cell produces power (up to its 150 kW limit) to support the deficit before importing grid power.
2. Peak Grid Shaving:
   - Set the dispatch strategy to Peak Grid Shaving.
   - Note the Grid Import Cap slider that appears.
   - Set a cap of 300 kW and set the load deficit to 600 kW.
   - Observe how grid import is capped at 300 kW and the battery/hydrogen cell discharge to cover the remaining deficit.
3. Battery Backup Support:
   - Set the dispatch strategy to Battery Backup Support.
   - Verify that the battery is maintained at 100.0% SoC (charging if below 100%) and is not discharged to shave loads, keeping its storage reserved for outages.


## Step 5: Test Grid Connection Modes

1. Grid-Tied (Standard):
   - Observe that deficits are easily covered by importing grid power, and surpluses are exported.
2. Islanded (Off-Grid):
   - Set the mode to Islanded. Note the ISLAND badge on the Utility Grid.
   - Generate a massive surplus. Observe that any power that exceeds the battery and hydrogen tank charging capacity is curtailed (wasted), triggering a Curtailment Active system status.
   - Generate a deficit that exceeds battery and hydrogen storage discharge limits. Observe that the microgrid enters a Deficit Outage state.


## Step 6: Apply Scenario Presets

Test each scenario button in the left panel and observe the system response:
- Standard Day: Moderate solar and wind, standard demand, grid-tied.
- Peak Demand: High consumer loads, triggering shaving or high import.
- Storm Event: High wind speed (>20 m/s) triggering turbine safety shutdown and low solar.
- Grid Outage: Simulates a utility grid failure, forcing the system into Islanded mode to run on battery and fuel cell storage.


## Step 7: Analyze SCADA Analytics

1. Observe the SCADA Live Trends chart at the bottom center.
2. Review the trends of:
   - Generation (orange)
   - Demand (pink)
   - Battery SoC (purple)
   - Hydrogen Level (cyan)
3. Turn individual datasets on or off by clicking on their labels in the legend to focus on specific interactions.


## Step 8: Reset the System

1. Click the Reset Lab button to restore all default values, clear chart histories, and return the EMS to standard operation.