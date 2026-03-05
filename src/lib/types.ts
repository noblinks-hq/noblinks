export type DashboardCategory = "infrastructure" | "docker" | "kubernetes" | "custom";

export interface Dashboard {
  id: string;
  name: string;
  environment: string;
  category: DashboardCategory;
  organizationId: string;
  createdBy: string;
  visualizationCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface AiInsight {
  id: string;
  message: string;
  machineId: string;
  machineName: string;
  confidence?: string;
}

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
  ip?: string;
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

// --- Widget types ---

export type WidgetType = "timeseries" | "stat";

export interface DbWidget {
  id: string;
  dashboardId: string;
  organizationId: string;
  title: string;
  type: WidgetType;
  metric: string;
  machine: string;
  capabilityKey: string | null;
  thresholdValue: number | null;
  createdAt: string;
  updatedAt: string;
}

// --- AI Capability Registry types ---

export type CapabilityCategory = "linux" | "kubernetes" | "docker" | "windows";
export type DbAlertStatus = "configured" | "active" | "firing" | "resolved";

export interface MonitoringCapability {
  id: string;
  capabilityKey: string;
  name: string;
  description: string;
  category: CapabilityCategory;
  metric: string;
  parameters: Record<string, string>;
  alertTemplate: string;
  defaultThreshold: number;
  defaultWindow: string;
  suggestedSeverity: AlertSeverity;
  createdAt: string;
  updatedAt: string;
}

export interface DbAlert {
  id: string;
  organizationId: string;
  name: string;
  description: string | null;
  capabilityId: string;
  machine: string;
  threshold: number;
  window: string;
  severity: AlertSeverity;
  promqlQuery: string;
  status: DbAlertStatus;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface Environment {
  id: string;
  organizationId: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

export interface DbMachine {
  id: string;
  organizationId: string;
  name: string;
  hostname: string | null;
  ip: string | null;
  agentVersion: string | null;
  category: MachineType | null;
  environmentId: string | null;
  status: string;
  lastSeen: string | null;
  createdAt: string;
  updatedAt: string;
}
