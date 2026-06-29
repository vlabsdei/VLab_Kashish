## Introduction

An Electric Vehicle (EV) Charging Station operates as a queueing system where vehicles arrive randomly to charge their batteries. If a charging bay is available, the vehicle starts charging immediately. Otherwise, it waits in a queue until a charger becomes available.

Efficient queue management helps to:

* Reduce vehicle waiting time.
* Improve charger utilization.
* Prevent long queues.
* Reduce vehicle rejection.
* Manage available grid power efficiently.


# Queueing System

A queueing system consists of four main components:

* Customers: Electric Vehicles (EVs)
* Servers: Charging Bays
* Queue: Waiting area for vehicles
* Service: Battery charging process

The charging time depends on:

* Battery capacity
* Initial State of Charge (SOC)
* Charger power


# Kendall's Queueing Notation

The simulator uses M/M/c/K notation.

Where:

* First M: Vehicle arrivals follow a random (Poisson) process.
* Second M: Charging times follow an exponential distribution.
* c: Number of charging bays.
* K: Maximum number of vehicles allowed in the charging station.


# Queue Models

## 1. M/M/c (Infinite Queue)

In this model:

* Vehicles can always wait in the queue.
* No arriving vehicle is rejected.
* Queue length may become very large if arrival rate exceeds charging capacity.

### Stability Condition

The system remains stable only when:

```
ρ = λ' / (c × μ)

ρ < 1
```
Where:

* ρ = Utilization factor
* λ' = Arrival rate per minute
* c = Number of charging bays
* μ = Service rate

If ρ ≥ 1, the queue continuously grows and the waiting time increases.


## 2. M/M/c/K (Finite Queue)

In this model:

* Waiting space is limited.
* Vehicles can wait only if buffer space is available.
* If the queue is full, the arriving vehicle leaves immediately. This is called Balking.

Unlike the infinite queue model, this system always remains stable because the queue length is limited.


# Queue Parameters

## Arrival Rate (λ)

Arrival rate represents the average number of EVs arriving every hour.

### Formula

```
Arrival Rate per minute = λ / 60
```

Where:

* λ = Average number of vehicles arriving per hour


## Service Rate (μ)

Service rate represents how many vehicles one charger can serve.

### Formula

```
μ = 1 / Ts
```
Where:

* μ = Service rate
* Ts = Average charging time (minutes)


## Offered Load (r)

Offered load represents the expected charging demand.

### Formula

```
r = λ' × Ts
```

or

```
r = λ' / μ
```
Where:

* r = Offered load
* λ' = Arrival rate per minute
* Ts = Average charging time
* μ = Service rate

---

## Utilization (ρ)

Utilization indicates how busy the charging station is.

### Formula

```
ρ = λ' / (c × μ)
```

or

```
ρ = r / c
```
Where:

* ρ = Utilization factor
* λ' = Arrival rate per minute
* c = Number of charging bays
* μ = Service rate
* r = Offered load

Higher utilization means chargers remain busy most of the time.


# Performance Measures

## Average Queue Length (Lq)

Average number of vehicles waiting for charging.

### Formula

```
Lq = Average waiting vehicles
```
Where:

* Lq = Average queue length

The simulator calculates this value using Queueing Theory equations.


## Average Waiting Time (Wq)

Average time a vehicle spends waiting before charging starts.

### Formula

```
Wq = Lq / λ'
```

Where:

* Wq = Average waiting time (minutes)
* Lq = Average queue length
* λ' = Arrival rate per minute


## Average Number of Vehicles in the System (L)

Total number of vehicles charging and waiting.

### Formula

```
L = Lq + r
```
Where:

* L = Total vehicles in the system
* Lq = Average queue length
* r = Offered load


## Effective Arrival Rate

Used only in the finite queue model.

### Formula

```
λeff = λ' × (1 − Pk)
```

**Where:**

* λeff = Effective arrival rate
* λ' = Arrival rate per minute
* Pk = Probability that the charging station is full


## Balking Probability

Probability that an arriving vehicle leaves because the station is full.

### Infinite Queue

```
Pk = 0
```

### Finite Queue

```
Pk = Probability that the charging station is full
```
Where:

* Pk = Balking probability


## Charger Utilization

Percentage of time charging bays remain busy.

### Formula

```
Utilization (%) = (Busy Chargers / Total Chargers) × 100
```
Where:

* Busy Chargers = Number of chargers currently charging EVs
* Total Chargers = Total charging bays

Higher utilization indicates better use of charging infrastructure.


# Energy Management System (EMS)

When multiple EVs charge simultaneously, the total power demand may exceed the available grid power.

The Energy Management System (EMS) distributes power among charging bays while keeping the total demand within the grid limit.


## Fixed Mode

Each active charger receives equal power.

### Formula

```
Power per Charger = Minimum (120 kW, Grid Limit / Active Chargers)
```
Where:

* 120 kW = Maximum charging power of one charger
* Grid Limit = Maximum power available from the grid
* Active Chargers = Chargers currently in use


## Smart Mode

Power allocation depends on battery level and vehicle priority.

Vehicles with lower battery charge receive higher priority.

### Weight Calculation

```
Weight = (100 − SOC) × Priority
```
Where:

* SOC = State of Charge of the battery (%)
* Priority = 2.0 for emergency vehicles
* Priority = 1.0 for normal vehicles


### Power Allocation

```
Power = (Vehicle Weight / Total Weight) × Grid Power Limit
```
Where:

* Vehicle Weight = Weight of one EV
* Total Weight = Sum of weights of all charging EVs
* Grid Power Limit = Maximum available grid power

Power allocation is limited between:

```
30 kW ≤ Power ≤ 150 kW
```


# Simulation Validation

The simulator compares practical simulation results with theoretical calculations.

The following parameters are validated:

* Average Queue Length
* Average Waiting Time
* Charger Utilization

### Relative Error Formula

```
Relative Error (%) =
|Theoretical Value − Simulation Value|
-------------------------------------- × 100
        Theoretical Value
```
Where:

* Theoretical Value = Value calculated using Queueing Theory
* Simulation Value = Value obtained from the simulator

As the simulation runs for a longer time, the simulation results become closer to the theoretical values.


# Conclusion

Queueing Theory helps evaluate the performance of EV charging stations by estimating queue length, waiting time, charger utilization, and vehicle rejection. The M/M/c and M/M/c/K models assist engineers in designing efficient charging stations that reduce customer waiting time, improve charger usage, and manage available grid power effectively.
