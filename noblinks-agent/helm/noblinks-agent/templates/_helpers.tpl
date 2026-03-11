{{/*
Expand the name of the chart.
*/}}
{{- define "noblinks-agent.name" -}}
{{- default .Chart.Name .Values.nameOverride | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Create a default fully qualified app name.
*/}}
{{- define "noblinks-agent.fullname" -}}
{{- if .Values.fullnameOverride }}
{{- .Values.fullnameOverride | trunc 63 | trimSuffix "-" }}
{{- else }}
{{- $name := default .Chart.Name .Values.nameOverride }}
{{- if contains $name .Release.Name }}
{{- .Release.Name | trunc 63 | trimSuffix "-" }}
{{- else }}
{{- printf "%s-%s" .Release.Name $name | trunc 63 | trimSuffix "-" }}
{{- end }}
{{- end }}
{{- end }}

{{/*
Create chart label
*/}}
{{- define "noblinks-agent.chart" -}}
{{- printf "%s-%s" .Chart.Name .Chart.Version | replace "+" "_" | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Common labels
*/}}
{{- define "noblinks-agent.labels" -}}
helm.sh/chart: {{ include "noblinks-agent.chart" . }}
{{ include "noblinks-agent.selectorLabels" . }}
app.kubernetes.io/version: {{ .Chart.AppVersion | quote }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
{{- end }}

{{/*
Selector labels
*/}}
{{- define "noblinks-agent.selectorLabels" -}}
app.kubernetes.io/name: {{ include "noblinks-agent.name" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
{{- end }}

{{/*
ServiceAccount name
*/}}
{{- define "noblinks-agent.serviceAccountName" -}}
{{- if .Values.serviceAccount.create }}
{{- default (include "noblinks-agent.fullname" .) .Values.serviceAccount.name }}
{{- else }}
{{- default "default" .Values.serviceAccount.name }}
{{- end }}
{{- end }}

{{/*
Determine whether to deploy Prometheus.
Returns "true" or "false" as a string.
Checks common existing Prometheus service names via Helm lookup.
*/}}
{{- define "noblinks-agent.deployPrometheus" -}}
{{- if .Values.prometheus.externalUrl -}}
false
{{- else if eq (toString .Values.prometheus.enabled) "false" -}}
false
{{- else if eq (toString .Values.prometheus.enabled) "true" -}}
true
{{- else -}}
{{- /* auto: detect existing prometheus */}}
{{- $found := false -}}
{{- $checks := list
    (list "monitoring"        "prometheus-operated")
    (list "monitoring"        "kube-prometheus-stack-prometheus")
    (list "monitoring"        "prometheus-kube-prometheus-prometheus")
    (list "default"           "prometheus-server")
    (list "prometheus"        "prometheus-server")
    (list "prometheus"        "prometheus-operated")
    (list .Release.Namespace  "prometheus-server")
    (list .Release.Namespace  "prometheus-operated")
-}}
{{- range $checks -}}
  {{- if not $found -}}
    {{- $svc := lookup "v1" "Service" (index . 0) (index . 1) -}}
    {{- if $svc -}}{{- $found = true -}}{{- end -}}
  {{- end -}}
{{- end -}}
{{- if $found -}}false{{- else -}}true{{- end -}}
{{- end -}}
{{- end }}

{{/*
Resolve the Prometheus URL the agent should use.
*/}}
{{- define "noblinks-agent.prometheusUrl" -}}
{{- if .Values.prometheus.externalUrl -}}
{{- .Values.prometheus.externalUrl -}}
{{- else if eq (include "noblinks-agent.deployPrometheus" .) "false" -}}
  {{- /* Existing prometheus -- try to find its URL */}}
  {{- $url := "" -}}
  {{- $checks := list
      (list "monitoring"        "prometheus-operated"                    "9090")
      (list "monitoring"        "kube-prometheus-stack-prometheus"       "9090")
      (list "monitoring"        "prometheus-kube-prometheus-prometheus"  "9090")
      (list "default"           "prometheus-server"                      "80")
      (list "prometheus"        "prometheus-server"                      "80")
      (list .Release.Namespace  "prometheus-server"                      "80")
  -}}
  {{- range $checks -}}
    {{- if not $url -}}
      {{- $svc := lookup "v1" "Service" (index . 0) (index . 1) -}}
      {{- if $svc -}}
        {{- $url = printf "http://%s.%s.svc.cluster.local:%s" (index . 1) (index . 0) (index . 2) -}}
      {{- end -}}
    {{- end -}}
  {{- end -}}
  {{- if $url -}}{{- $url -}}{{- else -}}http://prometheus-server.default.svc.cluster.local:80{{- end -}}
{{- else -}}
http://{{ include "noblinks-agent.fullname" . }}-prometheus.{{ .Release.Namespace }}.svc.cluster.local:9090
{{- end -}}
{{- end }}

{{/*
Determine whether to deploy Alertmanager.
*/}}
{{- define "noblinks-agent.deployAlertmanager" -}}
{{- if .Values.alertmanager.externalUrl -}}
false
{{- else if eq (toString .Values.alertmanager.enabled) "false" -}}
false
{{- else if eq (toString .Values.alertmanager.enabled) "true" -}}
true
{{- else -}}
{{- $found := false -}}
{{- $checks := list
    (list "monitoring"        "alertmanager-operated")
    (list "monitoring"        "kube-prometheus-stack-alertmanager")
    (list "monitoring"        "prometheus-kube-prometheus-alertmanager")
    (list "default"           "prometheus-alertmanager")
    (list .Release.Namespace  "alertmanager-operated")
-}}
{{- range $checks -}}
  {{- if not $found -}}
    {{- $svc := lookup "v1" "Service" (index . 0) (index . 1) -}}
    {{- if $svc -}}{{- $found = true -}}{{- end -}}
  {{- end -}}
{{- end -}}
{{- if $found -}}false{{- else -}}true{{- end -}}
{{- end -}}
{{- end }}

{{/*
Resolve the Alertmanager URL.
*/}}
{{- define "noblinks-agent.alertmanagerUrl" -}}
{{- if .Values.alertmanager.externalUrl -}}
{{- .Values.alertmanager.externalUrl -}}
{{- else if eq (include "noblinks-agent.deployAlertmanager" .) "false" -}}
  {{- $url := "" -}}
  {{- $checks := list
      (list "monitoring"        "alertmanager-operated"                     "9093")
      (list "monitoring"        "kube-prometheus-stack-alertmanager"        "9093")
      (list "default"           "prometheus-alertmanager"                   "80")
      (list .Release.Namespace  "alertmanager-operated"                     "9093")
  -}}
  {{- range $checks -}}
    {{- if not $url -}}
      {{- $svc := lookup "v1" "Service" (index . 0) (index . 1) -}}
      {{- if $svc -}}
        {{- $url = printf "http://%s.%s.svc.cluster.local:%s" (index . 1) (index . 0) (index . 2) -}}
      {{- end -}}
    {{- end -}}
  {{- end -}}
  {{- if $url -}}{{- $url -}}{{- else -}}http://prometheus-alertmanager.default.svc.cluster.local:80{{- end -}}
{{- else -}}
http://{{ include "noblinks-agent.fullname" . }}-alertmanager.{{ .Release.Namespace }}.svc.cluster.local:9093
{{- end -}}
{{- end }}
