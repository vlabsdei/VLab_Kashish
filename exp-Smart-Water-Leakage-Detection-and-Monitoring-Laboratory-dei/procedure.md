## Step 1: Initialize the System
Open the simulation and ensure the **Solenoid Valve** is **OPEN (Green)**. Keep the **IoT Auto-Shutoff Rule** **OFF** and verify that the pipeline is in the **No Leak** condition.

## Step 2: Establish the Normal Operating Condition
Set the **Pump Speed** to **60%** using the slider. Observe the pipeline and verify that water flows smoothly. Check that **Inflow (FS-01)** and **Outflow (FS-02)** are nearly equal, **Line Pressure (PT-01)** is stable (around **180 kPa**), **Water Wasted** is **0 Liters**, and the **System Status** displays **SYSTEM NORMAL**.

## Step 3: Record the Baseline Reading
Click the **Record State** button to save the normal operating condition as the baseline observation.

## Step 4: Simulate a Minor Leak
Select **Zone 2** on the pipeline and click the **Minor Leak** button. Observe the water leak animation, the soil moisture sensor activation, the decrease in outflow, the slight increase in inflow, the pressure drop, and the increase in water wasted. Record the observations by clicking **Record State**.

## Step 5: Simulate a Major Leak
Click the **Major Leak** button. Observe the larger leak, further reduction in outflow, lower pressure, and increased water loss. Record the sensor readings using the **Record State** button.

## Step 6: Simulate a Pipe Burst
Click the **Pipe Burst** button. Observe that the outflow becomes nearly zero, the pressure drops close to zero, and the **Water Wasted** value increases rapidly. Record the readings by clicking **Record State**.

## Step 7: Restore Normal Operation
Click the **No Leak** button to repair the pipeline and verify that the sensor readings gradually return to normal.

## Step 8: Configure the IoT Auto-Shutoff System
Set the **Flow Rate Difference Limit** to **0.50 L/min** and the **Minimum Pressure Threshold** to **120 kPa**. Turn **ON** the **IoT Auto-Shutoff Rule**.

## Step 9: Test Automatic Shutoff
Create a **Major Leak** while the IoT Auto-Shutoff Rule is enabled. Observe that the system detects the abnormal flow difference and pressure drop, automatically closes the **Solenoid Valve**, stops downstream water flow, and prevents further water loss. Record the emergency state using **Record State**.

## Step 10: Reset the System
Click **No Leak** to remove the leak and then click **OPEN SOLENOID VALVE** to restore normal water flow.

## Step 11: Perform Comparative Analysis
Disable the **IoT Auto-Shutoff Rule** and repeat the **Major Leak** experiment at **30%**, **60%**, and **90%** pump speeds. Record the sensor readings for each case and compare the effect of pump speed on flow rate, pressure, and water loss.

## Step 12: Complete the Experiment
Review all recorded observations in the log table and click **Clear** to reset the observation log for the next experiment.