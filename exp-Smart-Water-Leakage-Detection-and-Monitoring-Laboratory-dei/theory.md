# Theory

Water Distribution Networks (WDNs) transport clean water from treatment plants to residential, commercial, and industrial consumers through a network of pipelines. One of the major challenges in these systems is **water leakage**, which leads to water loss, increased operational costs, reduced water availability, and environmental damage. Water that is produced but never reaches consumers is known as **Non-Revenue Water (NRW)**.

Modern water distribution systems use **Internet of Things (IoT)** technology to continuously monitor the condition of pipelines. Flow sensors, pressure sensors, soil moisture sensors, and automated control devices work together to detect leaks, identify abnormal conditions, and isolate damaged pipeline sections automatically. This experiment demonstrates how sensor data and IoT-based automation can be used to detect and control pipeline leakages.

---

# 1. Mass Balance Principle (Flow Difference)

The Mass Balance Principle is based on the **Law of Conservation of Mass**, which states that the amount of water entering a pipeline should be equal to the amount of water leaving it when there is no leakage.

Let,

- **Qin** = Flow rate measured by the inlet flow sensor (FS-01)
- **Qout** = Flow rate measured by the outlet flow sensor (FS-02)

### Normal Condition

**Qin = Qout**

This indicates that there is no water loss inside the pipeline.

### Leak Condition

When a leak occurs, some water escapes before reaching the outlet sensor.

**Leak Flow = Qin − Qout**

where,

- **Leak Flow** = Amount of water lost due to leakage
- **Qin** = Inlet flow rate
- **Qout** = Outlet flow rate

A larger difference between Qin and Qout indicates a larger leak.

Since real sensors may produce small measurement errors, the IoT controller uses a threshold value.

### Leak Detection Rule

**|Qin − Qout| > Flow Difference Limit**

If this condition is true, the system identifies the presence of a pipeline leak.

---

# 2. Pressure Drop Analysis

Pressure monitoring is another important technique used for leak detection.

During normal operation, water flows through the pipeline with a nearly constant pressure.

When a leak develops,

- Water escapes from the damaged section.
- Internal pressure decreases.
- Larger leaks produce a greater pressure drop.
- Severe pipe bursts cause pressure to approach zero.

The leak flow depends on the size of the opening and the pressure difference between the inside and outside of the pipe.

### Orifice Flow Equation

**Leak Flow = Cd × Aleak × √(2 × ΔP / ρ)**

where,

- **Cd** = Discharge coefficient of the leak
- **Aleak** = Area of the leak opening
- **ΔP** = Pressure difference across the pipe wall
- **ρ** = Density of water

This equation shows that larger holes and higher pressure differences produce greater leakage.

### Pressure Alert Condition

**Pressure < Minimum Pressure Threshold**

If the measured pressure falls below the safety limit, the IoT controller considers the pipeline to be in an unsafe condition.

---

# 3. Soil Moisture Monitoring

In addition to flow and pressure sensors, a **Soil Moisture Sensor** is placed beneath the pipeline.

When water leaks into the surrounding soil,

- Soil moisture increases.
- The sensor detects the presence of water.
- The moisture indicator changes its status.

This provides additional confirmation that a pipeline leak has occurred.

---

# 4. IoT-Based Leak Detection

The IoT controller continuously receives measurements from all sensors.

The following parameters are monitored:

- Inflow (FS-01)
- Outflow (FS-02)
- Line Pressure (PT-01)
- Soil Moisture
- Water Wasted

The controller continuously calculates the flow difference.

### Flow Difference

**Flow Difference = |Qin − Qout|**

The controller compares this value with the predefined flow threshold.

At the same time, it checks whether the pipeline pressure is below the minimum allowable pressure.

If either condition becomes true, the controller recognizes that a leak has occurred.

---

# 5. Automatic Solenoid Valve Control

The smart water system uses a **Solenoid Valve** to isolate the damaged pipeline automatically.

The valve remains **OPEN** during normal operation.

The IoT controller automatically closes the valve when:

- **Flow Difference > Flow Difference Limit**

OR

- **Pressure < Minimum Pressure Threshold**

Once the valve closes,

- Water supply to the damaged section stops.
- Further leakage is prevented.
- Water wastage is minimized.
- The pipeline becomes isolated until repairs are completed.

---

# 6. Water Wastage Calculation

The amount of water lost depends on both the leak rate and the duration of the leak.

### Water Wasted

**Water Wasted = Leak Flow × Leak Duration**

where,

- **Leak Flow** = Water escaping through the leak
- **Leak Duration** = Time before the leak is isolated

Reducing the detection and isolation time significantly decreases total water loss.

---

# 7. Effect of Pump Speed

Pump speed directly affects the flow rate and pressure inside the pipeline.

- At **low pump speed**, flow rate and pressure are lower, resulting in smaller leakage.
- At **medium pump speed**, the system operates under normal conditions.
- At **high pump speed**, both pressure and flow increase, causing more water to escape if a leak occurs.

Therefore, increasing pump speed generally increases water loss during a leak.

---

# Components Used

- **Flow Sensor (FS-01):** Measures the water entering the pipeline.
- **Flow Sensor (FS-02):** Measures the water leaving the pipeline.
- **Pressure Sensor (PT-01):** Measures pipeline pressure.
- **Soil Moisture Sensor:** Detects leaked water around the pipeline.
- **Pump:** Supplies water through the pipeline.
- **Solenoid Valve:** Automatically opens or closes the water supply.
- **IoT Controller:** Monitors sensor data and controls the valve.
- **Water Wasted Counter:** Displays the total volume of leaked water.
- **Observation Log:** Stores all recorded experimental readings for analysis.