## Step 1: Configure the Simulation Parameters

Configure the EV charging station using the controls available in the left sidebar.

* Select the desired Queue Buffer (K) from the dropdown menu.
* Adjust the Charger Bays (c) slider to choose the required number of charging bays.
* Set the Arrival Rate (λ) using the corresponding slider.
* Adjust the Average Charging Time (1/μ) slider according to the desired charging duration.

These parameters determine the operating conditions of the charging station.


## Step 2: Start the Simulation

Click the Start Sim button to begin the experiment.

Observe that:

* The simulation timer starts.
* Electric vehicles begin arriving at the charging station.
* Vehicles are assigned to available charging bays.
* If all chargers are occupied, incoming vehicles join the waiting queue.


## Step 3: Observe Queue Behaviour

Allow the simulation to run for a few minutes and observe the movement of vehicles.

* Vehicles wait in the queue whenever all charging bays are busy.
* Waiting vehicles are served in First-In, First-Out (FIFO) order.
* As soon as a charging bay becomes available, the first vehicle in the queue begins charging.
* Observe how the queue changes as the arrival rate and charging time are varied.


## Step 4: Monitor SCADA Live Telemetry

Observe the SCADA Live Telemetry panel on the right side of the simulation.

Monitor the following performance parameters:

* Total Served EVs
* Charger Utilization
* Average Waiting Time
* Current Queue Size
* Balked/Lost Demand
* EMS Grid Load
* EMS System Status

Analyze how these values change during the simulation.


## Step 5: Study the Effect of Input Parameters

Modify one input parameter at a time and observe its effect on the charging station.

Experiment with:

* Different Arrival Rates (λ).
* Different numbers of Charger Bays (c).
* Different Average Charging Times (1/μ).
* Different Queue Buffer (K) capacities.

Observe the effect of each parameter on:

* Queue length
* Waiting time
* Charger utilization
* Number of served EVs
* System stability


## Step 6: Evaluate Queue Capacity

Select different Queue Buffer (K) values from the dropdown menu.

Observe that:

* Larger queue capacities allow more vehicles to wait.
* Smaller queue capacities cause vehicles to leave when the queue becomes full.
* The Balked/Lost Demand value increases when the queue reaches its maximum capacity.


## Step 7: Improve Charging Station Performance

Increase or decrease the number of Charger Bays (c) and modify the Average Charging Time (1/μ).

Observe the effect on:

* Queue size
* Average waiting time
* Charger utilization
* Total served EVs
* EMS System Status

Compare the performance before and after changing these parameters.


## Step 8: Analyze Simulation Results

Open the SCADA Live Trends tab.

Observe the real-time graphs of:

* Queue Size
* Active Chargers
* Grid Power

Analyze how these parameters vary throughout the simulation.

Next, switch to the Queuing Theory Validator tab.

Compare the empirical simulation results with the theoretical queueing model and observe how closely they match.


## Step 9: Pause the Simulation

Click the Pause Sim button.

Observe that:

* Vehicle movement stops.
* Charging operations pause.
* The simulation timer stops.
* All telemetry values remain unchanged until the simulation resumes.

Click Start Sim again to continue the experiment.


## Step 10: Reset the Experiment

Click the Reset Lab button.

Observe that:

* All vehicles are removed from the charging station.
* The queue is cleared.
* Performance metrics return to their initial values.
* The simulation timer is reset.
* The laboratory is ready for another experiment using different parameter settings.
