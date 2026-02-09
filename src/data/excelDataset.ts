// Drone swarm dataset for the Swarmscape visualization dashboard.


import { DroneSwarmDataset } from '@/types/drone';

const rawDataset = `
{
  "timePoints": [
    0,
    1,
    2,
    3,
    4,
    5
  ],
  "timePointLabels": [
    "TP1",
    "TP2",
    "TP3",
    "TP4",
    "TP5",
    "TP6"
  ],
  "drones": [
    {
      "droneId": "drone-1",
      "timePoint": 0,
      "timeLabel": "TP1",
      "swarmId": "none",
      "swarmLabel": "No Swarm",
      "taskId": "taking-off",
      "taskLabel": "Taking Off",
      "state": "taking-off",
      "stateLabel": "Taking Off",
      "position": {
        "x": 6.0,
        "y": 5.0,
        "z": 7.0
      },
      "velocity": {
        "x": 2.1,
        "y": 2.3,
        "z": 1.04
      },
      "orientation": {
        "pitch": 22.1,
        "roll": 2.3,
        "yaw": 48.2
      },
      "batteryPercentage": 98.0,
      "detectionRange": 50.0,
      "signalIntensity": 5,
      "videoFeedbackOn": true
    },
    {
      "droneId": "drone-1",
      "timePoint": 1,
      "timeLabel": "TP2",
      "swarmId": "alpha",
      "swarmLabel": "Alpha",
      "taskId": "entering-swarm",
      "taskLabel": "Entering Swarm",
      "state": "entering-swarm",
      "stateLabel": "Entering Swarm",
      "position": {
        "x": 21.0,
        "y": 23.0,
        "z": 10.4
      },
      "velocity": {
        "x": 1.9,
        "y": 2.56,
        "z": 0.94
      },
      "orientation": {
        "pitch": 18.4,
        "roll": -1.5,
        "yaw": 52.7
      },
      "batteryPercentage": 98.0,
      "detectionRange": 50.0,
      "signalIntensity": 5,
      "videoFeedbackOn": true
    },
    {
      "droneId": "drone-1",
      "timePoint": 2,
      "timeLabel": "TP3",
      "swarmId": "alpha",
      "swarmLabel": "Alpha",
      "taskId": "hovering",
      "taskLabel": "Hovering",
      "state": "hovering",
      "stateLabel": "Hovering",
      "position": {
        "x": 40.0,
        "y": 48.6,
        "z": 19.8
      },
      "velocity": {
        "x": 2.16,
        "y": 2.2,
        "z": 1.11
      },
      "orientation": {
        "pitch": 21.9,
        "roll": 3.2,
        "yaw": 49.5
      },
      "batteryPercentage": 96.0,
      "detectionRange": 50.0,
      "signalIntensity": 4,
      "videoFeedbackOn": true
    },
    {
      "droneId": "drone-1",
      "timePoint": 3,
      "timeLabel": "TP4",
      "swarmId": "alpha",
      "swarmLabel": "Alpha",
      "taskId": "passing-by",
      "taskLabel": "Passing By",
      "state": "passing-by",
      "stateLabel": "Passing By",
      "position": {
        "x": 61.6,
        "y": 70.6,
        "z": 30.8
      },
      "velocity": {
        "x": 2.19,
        "y": 2.0,
        "z": 1.11
      },
      "orientation": {
        "pitch": 24.1,
        "roll": 3.0,
        "yaw": 49.7
      },
      "batteryPercentage": 95.0,
      "detectionRange": 50.0,
      "signalIntensity": 5,
      "videoFeedbackOn": true
    },
    {
      "droneId": "drone-1",
      "timePoint": 4,
      "timeLabel": "TP5",
      "swarmId": "alpha",
      "swarmLabel": "Alpha",
      "taskId": "passing-by",
      "taskLabel": "Passing By",
      "state": "passing-by",
      "stateLabel": "Passing By",
      "position": {
        "x": 83.5,
        "y": 90.6,
        "z": 41.9
      },
      "velocity": {
        "x": 2.05,
        "y": 1.95,
        "z": 1.08
      },
      "orientation": {
        "pitch": 24.8,
        "roll": 2.5,
        "yaw": 50.2
      },
      "batteryPercentage": 93.0,
      "detectionRange": 50.0,
      "signalIntensity": 5,
      "videoFeedbackOn": true
    },
    {
      "droneId": "drone-1",
      "timePoint": 5,
      "timeLabel": "TP6",
      "swarmId": "alpha",
      "swarmLabel": "Alpha",
      "taskId": "hovering",
      "taskLabel": "Hovering",
      "state": "hovering",
      "stateLabel": "Hovering",
      "position": {
        "x": 88.0,
        "y": 96.3,
        "z": 52.7
      },
      "velocity": {
        "x": 2.05,
        "y": 1.95,
        "z": 1.08
      },
      "orientation": {
        "pitch": 25.3,
        "roll": 2.8,
        "yaw": 50.0
      },
      "batteryPercentage": 91.0,
      "detectionRange": 50.0,
      "signalIntensity": 5,
      "videoFeedbackOn": true
    },
    {
      "droneId": "drone-2",
      "timePoint": 0,
      "timeLabel": "TP1",
      "swarmId": "none",
      "swarmLabel": "No Swarm",
      "taskId": "taking-off",
      "taskLabel": "Taking Off",
      "state": "taking-off",
      "stateLabel": "Taking Off",
      "position": {
        "x": 96.0,
        "y": 40.0,
        "z": 20.0
      },
      "velocity": {
        "x": -2.1,
        "y": 0.96,
        "z": 0.04
      },
      "orientation": {
        "pitch": 0.9,
        "roll": -2.5,
        "yaw": 160.1
      },
      "batteryPercentage": 100.0,
      "detectionRange": 50.0,
      "signalIntensity": 4,
      "videoFeedbackOn": false
    },
    {
      "droneId": "drone-2",
      "timePoint": 1,
      "timeLabel": "TP2",
      "swarmId": "none",
      "swarmLabel": "No Swarm",
      "taskId": "passing-by",
      "taskLabel": "Passing By",
      "state": "passing-by",
      "stateLabel": "Passing By",
      "position": {
        "x": 75.0,
        "y": 49.6,
        "z": 20.4
      },
      "velocity": {
        "x": -2.24,
        "y": 1.04,
        "z": -0.02
      },
      "orientation": {
        "pitch": -1.1,
        "roll": 4.1,
        "yaw": 155.3
      },
      "batteryPercentage": 98.0,
      "detectionRange": 50.0,
      "signalIntensity": 5,
      "videoFeedbackOn": true
    },
    {
      "droneId": "drone-2",
      "timePoint": 2,
      "timeLabel": "TP3",
      "swarmId": "alpha",
      "swarmLabel": "Alpha",
      "taskId": "entering-swarm",
      "taskLabel": "Entering Swarm",
      "state": "entering-swarm",
      "stateLabel": "Entering Swarm",
      "position": {
        "x": 52.6,
        "y": 60.0,
        "z": 20.2
      },
      "velocity": {
        "x": -2.6,
        "y": 0.92,
        "z": 0.06
      },
      "orientation": {
        "pitch": 1.2,
        "roll": -3.7,
        "yaw": 158.2
      },
      "batteryPercentage": 97.0,
      "detectionRange": 50.0,
      "signalIntensity": 5,
      "videoFeedbackOn": true
    },
    {
      "droneId": "drone-2",
      "timePoint": 3,
      "timeLabel": "TP4",
      "swarmId": "alpha",
      "swarmLabel": "Alpha",
      "taskId": "attacking",
      "taskLabel": "Attacking",
      "state": "attacking",
      "stateLabel": "Attacking",
      "position": {
        "x": 26.6,
        "y": 69.2,
        "z": 20.8
      },
      "velocity": {
        "x": -2.3,
        "y": 0.9,
        "z": 0.06
      },
      "orientation": {
        "pitch": 1.3,
        "roll": -3.3,
        "yaw": 158.6
      },
      "batteryPercentage": 95.0,
      "detectionRange": 50.0,
      "signalIntensity": 5,
      "videoFeedbackOn": true
    },
    {
      "droneId": "drone-2",
      "timePoint": 4,
      "timeLabel": "TP5",
      "swarmId": "alpha",
      "swarmLabel": "Alpha",
      "taskId": "attacking",
      "taskLabel": "Attacking",
      "state": "attacking",
      "stateLabel": "Attacking",
      "position": {
        "x": 3.6,
        "y": 78.2,
        "z": 21.4
      },
      "velocity": {
        "x": -2.1,
        "y": 0.95,
        "z": 0.05
      },
      "orientation": {
        "pitch": 1.1,
        "roll": -3.0,
        "yaw": 158.0
      },
      "batteryPercentage": 93.0,
      "detectionRange": 50.0,
      "signalIntensity": 5,
      "videoFeedbackOn": true
    },
    {
      "droneId": "drone-2",
      "timePoint": 5,
      "timeLabel": "TP6",
      "swarmId": "alpha",
      "swarmLabel": "Alpha",
      "taskId": "returning",
      "taskLabel": "Returning",
      "state": "returning",
      "stateLabel": "Returning",
      "position": {
        "x": -17.4,
        "y": 87.7,
        "z": 21.9
      },
      "velocity": {
        "x": -2.1,
        "y": 0.95,
        "z": 0.05
      },
      "orientation": {
        "pitch": 0.9,
        "roll": -2.5,
        "yaw": 157.5
      },
      "batteryPercentage": 91.0,
      "detectionRange": 50.0,
      "signalIntensity": 5,
      "videoFeedbackOn": true
    },
    {
      "droneId": "drone-3",
      "timePoint": 0,
      "timeLabel": "TP1",
      "swarmId": "none",
      "swarmLabel": "No Swarm",
      "taskId": "taking-off",
      "taskLabel": "Taking Off",
      "state": "taking-off",
      "stateLabel": "Taking Off",
      "position": {
        "x": 5.0,
        "y": 5.0,
        "z": 10.0
      },
      "velocity": {
        "x": 2.04,
        "y": 1.7,
        "z": 0.56
      },
      "orientation": {
        "pitch": 15.4,
        "roll": 1.8,
        "yaw": -41.1
      },
      "batteryPercentage": 95.0,
      "detectionRange": 50.0,
      "signalIntensity": 4,
      "videoFeedbackOn": false
    },
    {
      "droneId": "drone-3",
      "timePoint": 1,
      "timeLabel": "TP2",
      "swarmId": "none",
      "swarmLabel": "No Swarm",
      "taskId": "passing-by",
      "taskLabel": "Passing By",
      "state": "passing-by",
      "stateLabel": "Passing By",
      "position": {
        "x": 20.4,
        "y": 17.0,
        "z": 15.6
      },
      "velocity": {
        "x": 1.94,
        "y": 1.56,
        "z": 0.46
      },
      "orientation": {
        "pitch": 12.8,
        "roll": -2.6,
        "yaw": -36.9
      },
      "batteryPercentage": 89.0,
      "detectionRange": 50.0,
      "signalIntensity": 5,
      "videoFeedbackOn": false
    },
    {
      "droneId": "drone-3",
      "timePoint": 2,
      "timeLabel": "TP3",
      "swarmId": "beta",
      "swarmLabel": "Beta",
      "taskId": "entering-swarm",
      "taskLabel": "Entering Swarm",
      "state": "entering-swarm",
      "stateLabel": "Entering Swarm",
      "position": {
        "x": 39.8,
        "y": 32.6,
        "z": 20.2
      },
      "velocity": {
        "x": 2.1,
        "y": 1.64,
        "z": 0.54
      },
      "orientation": {
        "pitch": 14.9,
        "roll": 3.1,
        "yaw": -39.8
      },
      "batteryPercentage": 88.0,
      "detectionRange": 50.0,
      "signalIntensity": 5,
      "videoFeedbackOn": false
    },
    {
      "droneId": "drone-3",
      "timePoint": 3,
      "timeLabel": "TP4",
      "swarmId": "beta",
      "swarmLabel": "Beta",
      "taskId": "hovering",
      "taskLabel": "Hovering",
      "state": "hovering",
      "stateLabel": "Hovering",
      "position": {
        "x": 60.8,
        "y": 49.0,
        "z": 25.6
      },
      "velocity": {
        "x": 2.6,
        "y": 1.33,
        "z": 0.79
      },
      "orientation": {
        "pitch": 15.1,
        "roll": 3.2,
        "yaw": -39.1
      },
      "batteryPercentage": 85.0,
      "detectionRange": 50.0,
      "signalIntensity": 3,
      "videoFeedbackOn": true
    },
    {
      "droneId": "drone-3",
      "timePoint": 4,
      "timeLabel": "TP5",
      "swarmId": "beta",
      "swarmLabel": "Beta",
      "taskId": "hovering",
      "taskLabel": "Hovering",
      "state": "hovering",
      "stateLabel": "Hovering",
      "position": {
        "x": 82.8,
        "y": 62.3,
        "z": 33.5
      },
      "velocity": {
        "x": 2.5,
        "y": 1.2,
        "z": 0.75
      },
      "orientation": {
        "pitch": 15.5,
        "roll": 2.8,
        "yaw": -38.5
      },
      "batteryPercentage": 83.0,
      "detectionRange": 50.0,
      "signalIntensity": 3,
      "videoFeedbackOn": true
    },
    {
      "droneId": "drone-3",
      "timePoint": 5,
      "timeLabel": "TP6",
      "swarmId": "beta",
      "swarmLabel": "Beta",
      "taskId": "hovering",
      "taskLabel": "Hovering",
      "state": "hovering",
      "stateLabel": "Hovering",
      "position": {
        "x": 89.8,
        "y": 74.3,
        "z": 34.3
      },
      "velocity": {
        "x": 2.5,
        "y": 1.2,
        "z": 0.75
      },
      "orientation": {
        "pitch": 15.8,
        "roll": 3.0,
        "yaw": -38.0
      },
      "batteryPercentage": 81.0,
      "detectionRange": 50.0,
      "signalIntensity": 2,
      "videoFeedbackOn": true
    },
    {
      "droneId": "drone-4",
      "timePoint": 0,
      "timeLabel": "TP1",
      "swarmId": "none",
      "swarmLabel": "No Swarm",
      "taskId": "taking-off",
      "taskLabel": "Taking Off",
      "state": "taking-off",
      "stateLabel": "Taking Off",
      "position": {
        "x": 80.0,
        "y": 20.0,
        "z": 0.0
      },
      "velocity": {
        "x": -1.4,
        "y": 2.1,
        "z": 1.06
      },
      "orientation": {
        "pitch": 28.9,
        "roll": -3.4,
        "yaw": -126.5
      },
      "batteryPercentage": 95.0,
      "detectionRange": 50.0,
      "signalIntensity": 5,
      "videoFeedbackOn": false
    },
    {
      "droneId": "drone-4",
      "timePoint": 1,
      "timeLabel": "TP2",
      "swarmId": "none",
      "swarmLabel": "No Swarm",
      "taskId": "passing-by",
      "taskLabel": "Passing By",
      "state": "passing-by",
      "stateLabel": "Passing By",
      "position": {
        "x": 68.0,
        "y": 40.0,
        "z": 3.0
      },
      "velocity": {
        "x": -1.28,
        "y": 1.92,
        "z": 0.96
      },
      "orientation": {
        "pitch": 25.2,
        "roll": 2.8,
        "yaw": -121.7
      },
      "batteryPercentage": 95.0,
      "detectionRange": 50.0,
      "signalIntensity": 5,
      "videoFeedbackOn": false
    },
    {
      "droneId": "drone-4",
      "timePoint": 2,
      "timeLabel": "TP3",
      "swarmId": "beta",
      "swarmLabel": "Beta",
      "taskId": "entering-swarm",
      "taskLabel": "Entering Swarm",
      "state": "entering-swarm",
      "stateLabel": "Entering Swarm",
      "position": {
        "x": 59.2,
        "y": 50.7,
        "z": 16.6
      },
      "velocity": {
        "x": -1.42,
        "y": 2.04,
        "z": 1.02
      },
      "orientation": {
        "pitch": 27.6,
        "roll": -4.6,
        "yaw": -124.9
      },
      "batteryPercentage": 94.0,
      "detectionRange": 50.0,
      "signalIntensity": 5,
      "videoFeedbackOn": false
    },
    {
      "droneId": "drone-4",
      "timePoint": 3,
      "timeLabel": "TP4",
      "swarmId": "beta",
      "swarmLabel": "Beta",
      "taskId": "parachute-deployment",
      "taskLabel": "Parachute Deployment",
      "state": "parachute-deployment",
      "stateLabel": "Parachute Deployment",
      "position": {
        "x": 52.6,
        "y": 60.2,
        "z": 20.2
      },
      "velocity": {
        "x": -1.55,
        "y": 2.12,
        "z": 1.31
      },
      "orientation": {
        "pitch": 27.9,
        "roll": -4.2,
        "yaw": -125.9
      },
      "batteryPercentage": 93.0,
      "detectionRange": 50.0,
      "signalIntensity": 3,
      "videoFeedbackOn": false
    },
    {
      "droneId": "drone-4",
      "timePoint": 4,
      "timeLabel": "TP5",
      "swarmId": "beta",
      "swarmLabel": "Beta",
      "taskId": "descending",
      "taskLabel": "Descending",
      "state": "descending",
      "stateLabel": "Descending",
      "position": {
        "x": 39.0,
        "y": 52.0,
        "z": 30.4
      },
      "velocity": {
        "x": -1.6,
        "y": 2.0,
        "z": 1.25
      },
      "orientation": {
        "pitch": 28.2,
        "roll": -4.0,
        "yaw": -126.5
      },
      "batteryPercentage": 91.0,
      "detectionRange": 50.0,
      "signalIntensity": 3,
      "videoFeedbackOn": false
    },
    {
      "droneId": "drone-4",
      "timePoint": 5,
      "timeLabel": "TP6",
      "swarmId": "beta",
      "swarmLabel": "Beta",
      "taskId": "descending",
      "taskLabel": "Descending",
      "state": "descending",
      "stateLabel": "Descending",
      "position": {
        "x": 23.5,
        "y": 41.8,
        "z": 43.5
      },
      "velocity": {
        "x": -1.6,
        "y": 2.0,
        "z": 1.25
      },
      "orientation": {
        "pitch": 28.6,
        "roll": -3.8,
        "yaw": -127.0
      },
      "batteryPercentage": 89.0,
      "detectionRange": 50.0,
      "signalIntensity": 4,
      "videoFeedbackOn": false
    }
  ],
  "metadata": {
    "totalDrones": 4,
    "totalTimePoints": 6,
    "swarmCounts": {
      "none": 7,
      "alpha": 9,
      "beta": 8
    },
    "taskCounts": {
      "taking-off": 4,
      "entering-swarm": 4,
      "hovering": 5,
      "passing-by": 5,
      "attacking": 2,
      "returning": 1,
      "parachute-deployment": 1,
      "descending": 2
    },
    "stateCounts": {
      "taking-off": 4,
      "entering-swarm": 4,
      "hovering": 5,
      "passing-by": 5,
      "attacking": 2,
      "returning": 1,
      "parachute-deployment": 1,
      "descending": 2
    },
    "boundingBox": {
      "min": {
        "x": -17.4,
        "y": 5.0,
        "z": 0.0
      },
      "max": {
        "x": 96.0,
        "y": 96.3,
        "z": 52.7
      }
    },
    "swarmLabels": {
      "none": "No Swarm",
      "alpha": "Alpha",
      "beta": "Beta"
    }
  }
}
`;

export const excelDataset = JSON.parse(rawDataset) as DroneSwarmDataset;
