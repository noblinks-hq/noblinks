  Then redeploy the agent on the machine:                                                                                                            
                                                                                                                                                     
    curl -fsSL https://www.noblinks.com/noblinks-agent | sudo tee /usr/local/bin/noblinks-agent > /dev/null                                            
    sudo chmod +x /usr/local/bin/noblinks-agent                                                                                                        
    sudo systemctl restart noblinks-agent
    sudo journalctl -u noblinks-agent -f

The corrected architecture:

  Widget created (AI matched capability)
          ↓
  Agent calls GET /api/agent/metrics-config
    → Server looks at widgets for THIS machine in THIS org
    → Returns only [{key: "node_cpu_usage_percent", promql: "100 - avg(...)..."}]
          ↓
  Agent scrapes ONLY those PromQL queries from local Prometheus
          ↓
  Agent POSTs values to POST /api/agent/metrics
          ↓
  metric_sample table: only rows for metrics actually displayed

  Scale answer: At 1,000 orgs × 10 machines × 5 metrics × 360 samples (3h window) = ~18M rows, ~1GB. Fully manageable in Postgres. The 3-hour prune
  keeps it flat. No TimescaleDB needed until you're at serious scale. The key is that collection is demand-driven — adding a machine without any
  widgets costs zero storage.