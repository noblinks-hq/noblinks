import type {
  Machine,
  Alert,
  Widget,
  TimeSeriesPoint,
} from "./types";

// --- Helpers ---

export function generateTimeSeriesData(
  points: number,
  min: number,
  max: number,
  spikeAtEnd = false
): TimeSeriesPoint[] {
  const now = Date.now();
  const hourMs = 60 * 60 * 1000;
  const data: TimeSeriesPoint[] = [];

  for (let i = 0; i < points; i++) {
    const time = new Date(now - (points - 1 - i) * hourMs);
    const label = time.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });

    let value: number;
    if (spikeAtEnd && i >= points - 4) {
      // Trend upward in the last few points to simulate alert trigger
      const progress = (i - (points - 4)) / 3;
      value = min + (max - min) * (0.6 + 0.4 * progress);
    } else {
      value = min + Math.random() * (max - min) * 0.6;
    }

    data.push({ time: label, value: Math.round(value * 10) / 10 });
  }

  return data;
}

let nextId = 1;
export function generateId(): string {
  return `id-${nextId++}-${Date.now().toString(36)}`;
}

// --- Keyword → Widget + Alert mapping ---

interface KeywordConfig {
  keyword: string;
  widgetTitle: string;
  metric: string;
  threshold: number;
  dataMin: number;
  dataMax: number;
  alertTitle: (machineName: string) => string;
  alertSeverity: "critical" | "warning";
  alertDescription: string;
  aiResponse: string;
}

export const keywordConfigs: KeywordConfig[] = [
  {
    keyword: "docker storage",
    widgetTitle: "Docker Storage %",
    metric: "docker_storage_percent",
    threshold: 80,
    dataMin: 40,
    dataMax: 85,
    alertTitle: (name) => `Docker storage at 82% on ${name}`,
    alertSeverity: "warning",
    alertDescription:
      "Docker storage reached 82%. This may cause build failures if images can't be pulled or layers can't be written.",
    aiResponse:
      "I've set up monitoring for Docker storage on this machine. I'm tracking disk usage in `/var/lib/docker` and will alert you when it crosses 80%. I've already noticed it's at 82% — you might want to clean up unused images soon.",
  },
  {
    keyword: "disk filling",
    widgetTitle: "Disk Usage GB",
    metric: "disk_usage_percent",
    threshold: 90,
    dataMin: 50,
    dataMax: 95,
    alertTitle: (name) => `Disk usage at 91% on ${name}`,
    alertSeverity: "critical",
    alertDescription:
      "Root filesystem is at 91% capacity. Services may fail to write logs or temp files.",
    aiResponse:
      "I'm now monitoring disk usage on this machine. The root filesystem is already at 91% — that's critical. I'd recommend checking what's consuming space. I can help you investigate in the terminal.",
  },
  {
    keyword: "pods restart",
    widgetTitle: "Pod Restarts",
    metric: "pod_restart_count",
    threshold: 5,
    dataMin: 0,
    dataMax: 12,
    alertTitle: (name) => `Pod restart loop detected on ${name}`,
    alertSeverity: "critical",
    alertDescription:
      "Multiple pods are restarting frequently. This indicates a CrashLoopBackOff or resource exhaustion.",
    aiResponse:
      "I've set up pod restart monitoring for this cluster. I'm seeing frequent restarts already — looks like a CrashLoopBackOff pattern. Let me know if you want to investigate which pods are affected.",
  },
  {
    keyword: "cpu spike",
    widgetTitle: "CPU Usage %",
    metric: "cpu_usage_percent",
    threshold: 85,
    dataMin: 20,
    dataMax: 96,
    alertTitle: (name) => `CPU spike to 94% on ${name}`,
    alertSeverity: "warning",
    alertDescription:
      "CPU usage spiked to 94%. This may degrade response times and cause request timeouts.",
    aiResponse:
      "CPU monitoring is active. I'm seeing a spike to 94% in the last hour. This could be a runaway process or a traffic surge. I can help you identify the top consumers in the terminal.",
  },
];

export function matchKeyword(input: string): KeywordConfig | null {
  const normalized = input.toLowerCase();
  return keywordConfigs.find((c) => normalized.includes(c.keyword)) ?? null;
}

export function createWidgetFromKeyword(
  config: KeywordConfig,
  machineId: string
): Widget {
  return {
    id: generateId(),
    machineId,
    type: "timeseries",
    title: config.widgetTitle,
    metric: config.metric,
    data: generateTimeSeriesData(24, config.dataMin, config.dataMax, true),
    thresholdValue: config.threshold,
  };
}

export function createAlertFromKeyword(
  config: KeywordConfig,
  machineId: string,
  machineName: string
): Alert {
  return {
    id: generateId(),
    machineId,
    title: config.alertTitle(machineName),
    severity: config.alertSeverity,
    status: "triggered",
    triggeredAt: new Date().toISOString(),
    description: config.alertDescription,
  };
}

// --- Terminal command/output mapping by alert metric ---

export interface TerminalEntry {
  command: string;
  output: string;
}

export const terminalCommandsByMetric: Record<string, TerminalEntry[]> = {
  docker_storage_percent: [
    {
      command: "docker system df",
      output: `TYPE            TOTAL     ACTIVE    SIZE      RECLAIMABLE
Images          14        4         4.219GB   3.102GB (73%)
Containers      6         2         1.024GB   892MB (87%)
Local Volumes   8         3         2.107GB   1.405GB (66%)
Build Cache     23        0         1.892GB   1.892GB`,
    },
    {
      command: "docker image prune --dry-run",
      output: `WARNING! This will remove all dangling images.
Total reclaimed space: 3.102GB`,
    },
  ],
  disk_usage_percent: [
    {
      command: "df -h",
      output: `/dev/sda1        50G   46G  4.0G  91% /
tmpfs           3.9G     0  3.9G   0% /dev/shm
/dev/sdb1       100G   22G   78G  22% /data`,
    },
    {
      command: "du -sh /var/lib/docker/*",
      output: `2.1G    /var/lib/docker/overlay2
1.4G    /var/lib/docker/volumes
892M    /var/lib/docker/image
524M    /var/lib/docker/containers`,
    },
  ],
  pod_restart_count: [
    {
      command: "kubectl get pods",
      output: `NAME                          READY   STATUS             RESTARTS   AGE
api-server-7d4f8b6c9-x2k4l   1/1     Running            0          2d
worker-5c8d7e9f1-m8n3p        0/1     CrashLoopBackOff   12         4h
redis-cache-6b3a9d2e7-q5w1r   1/1     Running            0          5d
ingress-ctrl-8f2c4a6b-j7h9k   1/1     Running            3          1d`,
    },
    {
      command: "kubectl describe pod worker-5c8d7e9f1-m8n3p | tail -10",
      output: `  Warning  BackOff    2m (x12 over 4h)  kubelet  Back-off restarting failed container
  Normal   Pulled     2m                 kubelet  Container image "app:latest" already present
  Warning  Unhealthy  2m                 kubelet  Liveness probe failed: connection refused`,
    },
  ],
  cpu_usage_percent: [
    {
      command: "top -bn1 | head -20",
      output: `top - 14:23:01 up 12 days,  3:42,  2 users,  load average: 3.82, 2.91, 1.45
Tasks: 142 total,   3 running, 139 sleeping,   0 stopped,   0 zombie
%Cpu(s): 94.2 us,  3.1 sy,  0.0 ni,  2.1 id,  0.0 wa,  0.6 hi
MiB Mem :   7963.2 total,    412.8 free,   6842.1 used,    708.3 buff/cache

  PID USER      PR  NI    VIRT    RES    SHR S  %CPU %MEM     TIME+ COMMAND
 2847 app       20   0 4218932 1.2g  28412 R  87.3 15.4  142:31.09 node
 1293 root      20   0  892144 124m  14208 S   4.2  1.6   12:08.44 dockerd
    1 root      20   0  169432  12m   8192 S   0.3  0.2    4:12.88 systemd`,
    },
    {
      command: "ps aux --sort=-%cpu | head -10",
      output: `USER       PID %CPU %MEM    VSZ   RSS TTY      STAT START   TIME COMMAND
app       2847 87.3 15.4 4218932 1258412 ?   Rl   10:41 142:31 node /app/server.js
root      1293  4.2  1.6  892144 127488 ?    Ssl  Jun08  12:08 /usr/bin/dockerd
www-data  3102  1.8  0.8  458232  67840 ?    S    12:15   3:42 nginx: worker`,
    },
  ],
};

// --- AI guidance suggestions by metric ---

export const aiGuidanceByMetric: Record<
  string,
  { icon: string; text: string }[]
> = {
  docker_storage_percent: [
    {
      icon: "trash",
      text: "Unused Docker images are consuming 3.1 GB. Run `docker image prune` to reclaim space.",
    },
    {
      icon: "archive",
      text: "Build cache is using 1.9 GB. Consider running `docker builder prune` if you don't need cached layers.",
    },
    {
      icon: "settings",
      text: "Set up a cron job to auto-prune images older than 7 days to prevent this from recurring.",
    },
  ],
  disk_usage_percent: [
    {
      icon: "hard-drive",
      text: "Docker overlay2 is the largest consumer at 2.1 GB. Cleaning unused containers may help.",
    },
    {
      icon: "search",
      text: "Check for large log files in /var/log — they often grow unnoticed.",
    },
    {
      icon: "alert-triangle",
      text: "At 91% usage, you have about 4 GB free. Services may fail to write if this reaches 95%.",
    },
  ],
  pod_restart_count: [
    {
      icon: "rotate-ccw",
      text: "Pod `worker-5c8d7e9f1-m8n3p` is in CrashLoopBackOff with 12 restarts. Check its logs.",
    },
    {
      icon: "activity",
      text: "The liveness probe is failing — the container may be crashing before it can respond.",
    },
    {
      icon: "code",
      text: "Run `kubectl logs worker-5c8d7e9f1-m8n3p --previous` to see the last crash output.",
    },
  ],
  cpu_usage_percent: [
    {
      icon: "cpu",
      text: "Process `node /app/server.js` (PID 2847) is consuming 87% CPU. This is likely the bottleneck.",
    },
    {
      icon: "trending-up",
      text: "Load average is 3.82 — well above the number of cores. Requests may be queuing.",
    },
    {
      icon: "zap",
      text: "Consider profiling the Node.js process with `--inspect` or restarting it as a short-term fix.",
    },
  ],
};

// --- Seed data ---

export const seedMachines: Machine[] = [
  {
    id: "machine-prod-api-1",
    name: "prod-api-1",
    type: "linux",
    status: "online",
    lastSeen: "2 minutes ago",
  },
  {
    id: "machine-k8s-cluster-1",
    name: "k8s-cluster-1",
    type: "kubernetes",
    status: "online",
    lastSeen: "30 seconds ago",
  },
];

export const seedAlerts: Alert[] = [
  {
    id: "alert-seed-1",
    machineId: "machine-prod-api-1",
    title: "Docker storage at 82% on prod-api-1",
    severity: "warning",
    status: "triggered",
    triggeredAt: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
    description:
      "Docker storage reached 82%. This may cause build failures if images can't be pulled or layers can't be written.",
  },
  {
    id: "alert-seed-2",
    machineId: "machine-k8s-cluster-1",
    title: "Pod restart loop detected on k8s-cluster-1",
    severity: "critical",
    status: "triggered",
    triggeredAt: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
    description:
      "Multiple pods are restarting frequently. This indicates a CrashLoopBackOff or resource exhaustion.",
  },
  {
    id: "alert-seed-3",
    machineId: "machine-prod-api-1",
    title: "CPU spike to 94% on prod-api-1",
    severity: "warning",
    status: "resolved",
    triggeredAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
    description:
      "CPU usage spiked to 94%. This may degrade response times and cause request timeouts.",
  },
];

export const seedWidgets: Widget[] = [
  {
    id: "widget-seed-1",
    machineId: "machine-prod-api-1",
    type: "timeseries",
    title: "Docker Storage %",
    metric: "docker_storage_percent",
    data: generateTimeSeriesData(24, 40, 85, true),
    thresholdValue: 80,
  },
  {
    id: "widget-seed-2",
    machineId: "machine-k8s-cluster-1",
    type: "timeseries",
    title: "Pod Restarts",
    metric: "pod_restart_count",
    data: generateTimeSeriesData(24, 0, 12, true),
    thresholdValue: 5,
  },
];
