## 1. Introduction
Traffic signals are essential components of urban transportation systems that regulate the movement of vehicles at road intersections. Proper signal timing helps:
*   Improve traffic flow
*   Reduce delays
*   Minimize congestion
*   Enhance road safety

In modern smart cities, Intelligent Transportation Systems (ITS) leverage real-time traffic data and optimization techniques to dynamically adjust signal timings matching traffic demands.


## 2. Traffic Signal Optimization
Traffic Signal Optimization is the process of determining effective signal phase durations to maximize vehicle throughput and minimize total queue delay at an intersection. 

The optimization process evaluates key input variables:
*   Vehicle Arrival Rate: The rate at which vehicles arrive at the approach (vehicles/minute).
*   Green Signal Time: The duration of the green light for a specific phase (seconds).
*   Yellow Signal Time: The clearance interval (typically fixed at 3 seconds).
*   All Red Time: The buffer interval where all approaches are red (typically fixed at 3 seconds).
*   Traffic Demand: The aggregate volume of vehicles attempting to use the intersection.


## 3. Key Parameters & Formulas

### A. Vehicle Arrival Rate
The Vehicle Arrival Rate represents the number of vehicles entering the intersection per unit of time (e.g., vehicles per minute). 

*Note: A higher arrival rate increases traffic demand. Without proper optimization, this leads to rapid queue growth and severe delays.*

### B. Queue Length
Queue Length represents the total number of vehicles waiting at the stop lines due to a red signal phase.

*   Queue Length = North Queue + South Queue + East Queue + West Queue

Where:
*   North Queue, South Queue: Waiting queues for North and South approaches.
*   East Queue, West Queue: Waiting queues for East and West approaches.

### C. Waiting Time
Waiting Time represents the average delay experienced by vehicles at the intersection before they are cleared to pass.

*   Waiting Time = Queue Length / Arrival Rate

Where:
*   Waiting Time is measured in minutes (multiplied by 60 for seconds).
*   Arrival Rate is in vehicles/minute.

### D. Vehicles Generated
The total number of vehicles spawned during the simulation run. This represents the total traffic load applied to the intersection.

### E. Vehicles Passed
The total number of vehicles that successfully cross the intersection stop lines and exit the simulation field.

### F. Signal Efficiency
Signal Efficiency measures how effectively the signal timing plan handles the traffic load.

*   Signal Efficiency = (Vehicles Passed / Vehicles Generated) * 100

#### Efficiency Interpretation Table
| Efficiency Range | Performance Rating | Description |
| :--- | :--- | :--- |
| Efficiency > 80% | Excellent | Optimal cycle time; minimal queue formation. |
| Efficiency 60% - 80% | Good | Stable flow; manageable delays. |
| Efficiency 40% - 60% | Moderate | Approaching capacity; significant delays during peak. |
| Efficiency < 40% | Poor | Severe oversaturation; gridlock conditions. |

### G. Congestion Status
A qualitative metric evaluating overall traffic flow conditions:
*   Low: Traffic flows freely with minimal queuing.
*   Moderate: Occasional queues form but clear within one signal cycle.
*   High: Queues persist across multiple cycles, causing gridlock risk.


## 4. Conclusion
This laboratory experiment provides hands-on understanding of traffic dynamics, queue formation, delay calculations, and the impact of signal cycle optimization on metropolitan traffic networks.