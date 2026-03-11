# noblinks-agent Helm Chart

Deploy the noblinks monitoring agent into your Kubernetes cluster.

## Prerequisites

- Kubernetes 1.21+
- Helm 3.0+
- A noblinks registration token (from Settings -> Agent Integration)

## Install

```bash
helm install noblinks-agent ./noblinks-agent/helm/noblinks-agent \
  --namespace noblinks \
  --create-namespace \
  --set noblinks.registrationToken=<YOUR_TOKEN> \
  --set noblinks.clusterName=my-cluster
```

## Auto-detection

The chart automatically detects existing Prometheus and Alertmanager installations by checking common service names across common namespaces (`monitoring`, `default`, `prometheus`). If found, the chart reuses them instead of deploying new instances.

To force deploying fresh instances:
```bash
--set prometheus.enabled=true
--set alertmanager.enabled=true
```

To point to a specific existing Prometheus:
```bash
--set prometheus.externalUrl=http://my-prometheus:9090
```

## Upgrade

```bash
helm upgrade noblinks-agent ./noblinks-agent/helm/noblinks-agent \
  --namespace noblinks \
  --set noblinks.registrationToken=<YOUR_TOKEN>
```

## Uninstall

```bash
helm uninstall noblinks-agent -n noblinks
```

## Values

| Key | Default | Description |
|-----|---------|-------------|
| `noblinks.registrationToken` | `""` | **Required.** Registration token from noblinks Settings |
| `noblinks.clusterName` | Release name | Human-readable cluster identifier |
| `noblinks.url` | `https://www.noblinks.com` | Noblinks backend URL |
| `prometheus.enabled` | `auto` | `auto`, `true`, or `false` |
| `prometheus.externalUrl` | `""` | Use existing Prometheus at this URL |
| `alertmanager.enabled` | `auto` | `auto`, `true`, or `false` |
| `nodeExporter.enabled` | `true` | Deploy node-exporter DaemonSet |
| `kubeStateMetrics.enabled` | `true` | Deploy kube-state-metrics |
