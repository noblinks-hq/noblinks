export type MachineType = "linux" | "windows" | "kubernetes";
export type MachineStatus = "online" | "offline";
export type AlertSeverity = "critical" | "warning" | "info";
export type AlertStatus = "triggered" | "resolved";

export interface Machine {
  id: string;
  name: string;
  type: MachineType;
  status: MachineStatus;
  lastSeen: string;
}

export interface Alert {
  id: string;
  machineId: string;
  title: string;
  severity: AlertSeverity;
  status: AlertStatus;
  triggeredAt: string;
  description: string;
}

export interface TimeSeriesPoint {
  time: string;
  value: number;
}

export interface Widget {
  id: string;
  machineId: string;
  type: "timeseries" | "stat";
  title: string;
  metric: string;
  data: TimeSeriesPoint[];
  thresholdValue?: number;
}
