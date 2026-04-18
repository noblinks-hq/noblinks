import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";
import { EC2Client, DescribeInstancesCommand, DescribeVpcsCommand, DescribeVpcEndpointsCommand, DescribeVpcEndpointServiceConfigurationsCommand } from "@aws-sdk/client-ec2";
import { RDSClient, DescribeDBInstancesCommand } from "@aws-sdk/client-rds";
import { S3Client, ListBucketsCommand } from "@aws-sdk/client-s3";
import { LambdaClient, ListFunctionsCommand } from "@aws-sdk/client-lambda";
import { ECSClient, ListClustersCommand } from "@aws-sdk/client-ecs";
import { ElastiCacheClient, DescribeCacheClustersCommand } from "@aws-sdk/client-elasticache";
import { SQSClient, ListQueuesCommand } from "@aws-sdk/client-sqs";
import { SNSClient, ListTopicsCommand } from "@aws-sdk/client-sns";
import { DynamoDBClient, ListTablesCommand } from "@aws-sdk/client-dynamodb";
import { ElasticLoadBalancingV2Client, DescribeLoadBalancersCommand } from "@aws-sdk/client-elastic-load-balancing-v2";
import { EKSClient, ListClustersCommand as ListEKSClustersCommand } from "@aws-sdk/client-eks";
import { SecretsManagerClient, ListSecretsCommand } from "@aws-sdk/client-secrets-manager";
import { APIGatewayClient, GetRestApisCommand } from "@aws-sdk/client-api-gateway";
import { KinesisClient, ListStreamsCommand } from "@aws-sdk/client-kinesis";
import { SFNClient, ListStateMachinesCommand } from "@aws-sdk/client-sfn";
import { EventBridgeClient, ListEventBusesCommand } from "@aws-sdk/client-eventbridge";
import { CognitoIdentityProviderClient, ListUserPoolsCommand } from "@aws-sdk/client-cognito-identity-provider";
import { ECRClient, DescribeRepositoriesCommand } from "@aws-sdk/client-ecr";
import { Route53Client, ListHostedZonesCommand } from "@aws-sdk/client-route-53";
import { OpenSearchClient, ListDomainNamesCommand } from "@aws-sdk/client-opensearch";
import { KafkaClient, ListClustersCommand as ListMSKClustersCommand } from "@aws-sdk/client-kafka";
import { CloudFrontClient, ListDistributionsCommand } from "@aws-sdk/client-cloudfront";
import { KMSClient, ListKeysCommand } from "@aws-sdk/client-kms";
import { ACMClient, ListCertificatesCommand } from "@aws-sdk/client-acm";
import { EFSClient, DescribeFileSystemsCommand } from "@aws-sdk/client-efs";
import { FSxClient, DescribeFileSystemsCommand as DescribeFSxCommand } from "@aws-sdk/client-fsx";
import { RedshiftClient, DescribeClustersCommand } from "@aws-sdk/client-redshift";
import { DocDBClient, DescribeDBClustersCommand } from "@aws-sdk/client-docdb";
import { NeptuneClient, DescribeDBClustersCommand as DescribeNeptuneCommand } from "@aws-sdk/client-neptune";
import { MemoryDBClient, DescribeClustersCommand as DescribeMemoryDBCommand } from "@aws-sdk/client-memorydb";
import { GlobalAcceleratorClient, ListAcceleratorsCommand } from "@aws-sdk/client-global-accelerator";
import { NetworkFirewallClient, ListFirewallsCommand } from "@aws-sdk/client-network-firewall";
import { WAFV2Client, ListWebACLsCommand } from "@aws-sdk/client-wafv2";
import { GuardDutyClient, ListDetectorsCommand } from "@aws-sdk/client-guardduty";
import { FirehoseClient, ListDeliveryStreamsCommand } from "@aws-sdk/client-firehose";
import { AppRunnerClient, ListServicesCommand } from "@aws-sdk/client-apprunner";
import { BatchClient, DescribeComputeEnvironmentsCommand } from "@aws-sdk/client-batch";
import { ElasticBeanstalkClient, DescribeEnvironmentsCommand } from "@aws-sdk/client-elastic-beanstalk";
import { LightsailClient, GetInstancesCommand } from "@aws-sdk/client-lightsail";
import { ApiGatewayV2Client, GetApisCommand } from "@aws-sdk/client-apigatewayv2";
import { AppSyncClient, ListGraphqlApisCommand } from "@aws-sdk/client-appsync";
import { GlueClient, GetDatabasesCommand } from "@aws-sdk/client-glue";
import { AthenaClient, ListWorkGroupsCommand } from "@aws-sdk/client-athena";
import { EMRClient, ListClustersCommand as ListEMRClustersCommand } from "@aws-sdk/client-emr";
import { SageMakerClient, ListEndpointsCommand } from "@aws-sdk/client-sagemaker";
import { BedrockClient, ListFoundationModelsCommand } from "@aws-sdk/client-bedrock";
import { CodeBuildClient, ListProjectsCommand } from "@aws-sdk/client-codebuild";
import { CodePipelineClient, ListPipelinesCommand } from "@aws-sdk/client-codepipeline";
import { CloudFormationClient, ListStacksCommand } from "@aws-sdk/client-cloudformation";
import { CloudWatchClient, DescribeAlarmsCommand } from "@aws-sdk/client-cloudwatch";
import { SSMClient, DescribeInstanceInformationCommand } from "@aws-sdk/client-ssm";
import { BackupClient, ListBackupPlansCommand } from "@aws-sdk/client-backup";
import { TransferClient, ListServersCommand } from "@aws-sdk/client-transfer";
import { IoTClient, ListThingsCommand } from "@aws-sdk/client-iot";
import { RekognitionClient, ListCollectionsCommand } from "@aws-sdk/client-rekognition";
import { SESClient, ListIdentitiesCommand } from "@aws-sdk/client-ses";
import { ConnectClient, ListInstancesCommand } from "@aws-sdk/client-connect";
import { MqClient, ListBrokersCommand } from "@aws-sdk/client-mq";
import { PinpointClient, GetAppsCommand } from "@aws-sdk/client-pinpoint";
// --- Step 1: enable already-installed-but-previously-unused SDKs ---
import { ComprehendClient, ListEntitiesDetectionJobsCommand } from "@aws-sdk/client-comprehend";
import { IoTAnalyticsClient, ListChannelsCommand as ListIoTAnalyticsChannelsCommand } from "@aws-sdk/client-iotanalytics";
import { KeyspacesClient, ListKeyspacesCommand } from "@aws-sdk/client-keyspaces";
import { LexModelsV2Client, ListBotsCommand } from "@aws-sdk/client-lex-models-v2";
import { ShieldClient, ListProtectionsCommand } from "@aws-sdk/client-shield";
import { TextractClient, ListAdaptersCommand } from "@aws-sdk/client-textract";
import { TimestreamQueryClient, ListScheduledQueriesCommand } from "@aws-sdk/client-timestream-query";
import { TranscribeClient, ListTranscriptionJobsCommand } from "@aws-sdk/client-transcribe";
import { TranslateClient, ListTextTranslationJobsCommand } from "@aws-sdk/client-translate";
import { XRayClient, GetGroupsCommand } from "@aws-sdk/client-xray";
// --- Step 2: newly installed SDKs ---
import { CloudTrailClient, ListTrailsCommand } from "@aws-sdk/client-cloudtrail";
import { ConfigServiceClient, DescribeConfigurationRecordersCommand } from "@aws-sdk/client-config-service";
// Security Hub exposes DescribeHubCommand (returns one hub if enabled) rather than a ListHubsCommand.
import { SecurityHubClient, DescribeHubCommand } from "@aws-sdk/client-securityhub";
import { Macie2Client, ListMembersCommand as ListMacieMembersCommand } from "@aws-sdk/client-macie2";
import { Inspector2Client, ListCoverageCommand } from "@aws-sdk/client-inspector2";
import { SSOAdminClient, ListInstancesCommand as ListSSOInstancesCommand } from "@aws-sdk/client-sso-admin";
import { DirectoryServiceClient, DescribeDirectoriesCommand } from "@aws-sdk/client-directory-service";
import { OrganizationsClient, ListAccountsCommand } from "@aws-sdk/client-organizations";
import { CodeCommitClient, ListRepositoriesCommand } from "@aws-sdk/client-codecommit";
import { CodeDeployClient, ListApplicationsCommand } from "@aws-sdk/client-codedeploy";
import { CodeartifactClient, ListDomainsCommand as ListCodeartifactDomainsCommand } from "@aws-sdk/client-codeartifact";
import { IoTEventsClient, ListDetectorModelsCommand } from "@aws-sdk/client-iot-events";
import { IoTSiteWiseClient, ListAssetsCommand } from "@aws-sdk/client-iotsitewise";
import { GreengrassV2Client, ListComponentsCommand } from "@aws-sdk/client-greengrassv2";
import { AmplifyClient, ListAppsCommand } from "@aws-sdk/client-amplify";
import { LicenseManagerClient, ListLicensesCommand } from "@aws-sdk/client-license-manager";
import { DirectConnectClient, DescribeConnectionsCommand } from "@aws-sdk/client-direct-connect";
import { AutoScalingClient, DescribeAutoScalingGroupsCommand } from "@aws-sdk/client-auto-scaling";
import { CloudWatchLogsClient, DescribeLogGroupsCommand } from "@aws-sdk/client-cloudwatch-logs";
import { KendraClient, ListIndicesCommand } from "@aws-sdk/client-kendra";
import { requireApiAuth } from "@/lib/session";
import { getOrgLensPlan, type LensPlan } from "@/lib/plan";
import { lensDb } from "@/lib/lens/db";
import { lensAnalysis } from "@/lib/lens/schema";
import { runComplianceEngine } from "@/lib/lens/compliance-engine";
import { eq, and, gte, count } from "drizzle-orm";

const LENS_MONTHLY_LIMITS: Record<LensPlan, number> = {
  none:    1,   // free tier
  starter: 5,
  growth:  20,
};

const EXTERNAL_ID = "noblinks-lens-dev";
const REGION = "eu-central-1";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Resource {
  id: string;
  name?: string | undefined;
  type?: string | undefined;
  region?: string | undefined;
  extra?: Record<string, string> | undefined;
}

interface ServiceDetail {
  count: number;
  resources: Resource[];
}

type CanonicalModel = Record<string, ServiceDetail>;

// ---------------------------------------------------------------------------
// Hetzner compatibility catalog
// ---------------------------------------------------------------------------

const HETZNER_CATALOG: Record<string, {
  match: "compatible" | "partial" | "none";
  hetznerEquivalent: string;
  notes: string;
  migrationEffort: "low" | "medium" | "high";
  migrationNotes: string[];
  hetznerDocs?: string;
}> = {
  "ec2": {
    match: "compatible",
    hetznerEquivalent: "Hetzner Cloud Servers (CX/CCX)",
    notes: "Direct equivalent. Choose server type based on EC2 instance family.",
    migrationEffort: "low",
    migrationNotes: [
      "Map t3.micro → CX22 (2 vCPU, 4GB RAM)",
      "Map t3.medium → CX32 (4 vCPU, 8GB RAM)",
      "Map m5.large → CCX23 (4 vCPU, 16GB RAM, dedicated)",
      "Use Hetzner Cloud API or Terraform hetznercloud provider",
      "Snapshots and volumes available via Hetzner Volumes",
    ],
    hetznerDocs: "https://docs.hetzner.com/cloud/servers/overview",
  },
  "vpc": {
    match: "compatible",
    hetznerEquivalent: "Hetzner Cloud Networks",
    notes: "Private networks with subnets and routing are fully supported.",
    migrationEffort: "low",
    migrationNotes: [
      "Create a Hetzner Cloud Network per VPC",
      "Map subnets to network zones (eu-central for Frankfurt)",
      "Security groups → Hetzner Firewall rules",
    ],
    hetznerDocs: "https://docs.hetzner.com/cloud/networks/overview",
  },
  "rds": {
    match: "partial",
    hetznerEquivalent: "Hetzner Managed Databases (beta)",
    notes: "PostgreSQL and MySQL supported. No Oracle, MSSQL, or Aurora.",
    migrationEffort: "medium",
    migrationNotes: [
      "PostgreSQL and MySQL are directly supported",
      "Aurora clusters require migration to standard PostgreSQL/MySQL",
      "Oracle or MSSQL require self-hosting on a Cloud Server",
      "Automated backups available; point-in-time recovery limited",
      "No read replicas in beta — plan for self-managed replication if needed",
    ],
  },
  "s3": {
    match: "partial",
    hetznerEquivalent: "Hetzner Object Storage (S3-compatible)",
    notes: "S3-compatible API. Lifecycle policies and replication not supported.",
    migrationEffort: "medium",
    migrationNotes: [
      "S3-compatible API — most SDKs work with endpoint override",
      "Set endpoint to fsn1.your-objectstorage.com (Falkenstein)",
      "Lifecycle policies not supported — implement via external cron",
      "No cross-region replication",
      "No S3 events/notifications — use polling or webhooks instead",
    ],
    hetznerDocs: "https://docs.hetzner.com/storage/object-storage",
  },
  "lambda": {
    match: "none",
    hetznerEquivalent: "None",
    notes: "No managed FaaS on Hetzner. Requires re-architecture (containers or VMs).",
    migrationEffort: "high",
    migrationNotes: [
      "No FaaS product available on Hetzner",
      "Option 1: Containerise functions and run on Hetzner Cloud Servers",
      "Option 2: Use a self-hosted OpenFaaS or Knative deployment",
      "Option 3: Use an external GDPR-compliant FaaS (e.g. Scaleway Functions)",
      "Significant re-architecture required for event-driven workloads",
    ],
  },
  "ecs": {
    match: "partial",
    hetznerEquivalent: "Hetzner Cloud + Docker / Nomad",
    notes: "No managed container orchestration. Self-managed Docker Swarm or Nomad needed.",
    migrationEffort: "high",
    migrationNotes: [
      "No managed container service on Hetzner",
      "Option 1: Self-managed Docker Swarm on Cloud Servers",
      "Option 2: HashiCorp Nomad for task scheduling",
      "Option 3: Migrate to Kubernetes (see EKS path)",
      "Use Hetzner Load Balancers for service exposure",
    ],
  },
  "eks": {
    match: "partial",
    hetznerEquivalent: "Self-managed Kubernetes on Hetzner",
    notes: "No managed Kubernetes. Use hetzner-k3s or kubeadm on Cloud Servers.",
    migrationEffort: "medium",
    migrationNotes: [
      "Use hetzner-k3s (community tool) for fast cluster provisioning",
      "Or use the official Hetzner Cloud Controller Manager with kubeadm",
      "Hetzner CSI driver available for persistent volumes",
      "Cluster Autoscaler has Hetzner provider support",
      "No managed control plane — plan for HA master node setup",
    ],
    hetznerDocs: "https://github.com/vitobotta/hetzner-k3s",
  },
  "cloudfront": {
    match: "none",
    hetznerEquivalent: "None (use Cloudflare CDN)",
    notes: "No CDN product. Cloudflare or BunnyCDN recommended as GDPR-compliant alternatives.",
    migrationEffort: "medium",
    migrationNotes: [
      "Hetzner has no CDN offering",
      "Cloudflare (EU data processing addendum available) is the standard alternative",
      "BunnyCDN is a GDPR-compliant European CDN option",
      "KeyCDN (Swiss) is another EU-based alternative",
    ],
  },
  "elb": {
    match: "compatible",
    hetznerEquivalent: "Hetzner Load Balancers",
    notes: "HTTP/HTTPS and TCP load balancing supported.",
    migrationEffort: "low",
    migrationNotes: [
      "HTTP, HTTPS and TCP targets supported",
      "SSL termination available",
      "Health checks configurable",
      "Use Hetzner Cloud Controller Manager for Kubernetes integration",
    ],
    hetznerDocs: "https://docs.hetzner.com/cloud/load-balancers/overview",
  },
  "elasticache": {
    match: "none",
    hetznerEquivalent: "None",
    notes: "No managed Redis/Memcached. Self-host Redis on a Cloud Server.",
    migrationEffort: "medium",
    migrationNotes: [
      "No managed caching service on Hetzner",
      "Deploy Redis on a dedicated Cloud Server (CX22 is sufficient for most workloads)",
      "Use Redis Sentinel or Cluster for HA",
      "Managed Redis available from external EU providers (Upstash EU region)",
    ],
  },
  "sqs": {
    match: "none",
    hetznerEquivalent: "None",
    notes: "No managed message queue. Use self-hosted RabbitMQ or NATS.",
    migrationEffort: "high",
    migrationNotes: [
      "No managed queue service on Hetzner",
      "Option 1: Self-hosted RabbitMQ on Cloud Server",
      "Option 2: Self-hosted NATS for lightweight messaging",
      "Option 3: Use an external GDPR-compliant broker (CloudAMQP EU)",
      "Application code changes required to swap SQS SDK",
    ],
  },
  "sns": {
    match: "none",
    hetznerEquivalent: "None",
    notes: "No managed pub/sub. Use self-hosted solutions.",
    migrationEffort: "high",
    migrationNotes: [
      "No managed pub/sub on Hetzner",
      "Self-hosted RabbitMQ exchanges or NATS JetStream as alternatives",
      "For email/SMS notifications, use Brevo or Postmark (EU-based)",
    ],
  },
  "privatelink": {
    match: "none",
    hetznerEquivalent: "None",
    notes: "AWS PrivateLink has no equivalent on Hetzner. Private service connectivity must be redesigned using VPNs, Tailscale, or Hetzner private networks.",
    migrationEffort: "high",
    migrationNotes: [
      "No managed private endpoint service exists on Hetzner",
      "Option 1: Hetzner private networks (vSwitch) for internal service-to-service traffic",
      "Option 2: Tailscale or WireGuard overlay network for zero-trust private connectivity",
      "Option 3: Self-hosted HAProxy or Nginx as a private service proxy",
      "All consumers of PrivateLink services must be reconfigured to use new private endpoints",
    ],
  },
  "kms": {
    match: "none",
    hetznerEquivalent: "None (self-host HashiCorp Vault)",
    notes: "No managed KMS on Hetzner. Use self-hosted HashiCorp Vault or age encryption.",
    migrationEffort: "high",
    migrationNotes: ["No managed KMS on Hetzner","Option 1: Self-hosted HashiCorp Vault on a Cloud Server","Option 2: Use age or SOPS for secret encryption","All KMS key references in code must be replaced"],
  },
  "acm": {
    match: "none",
    hetznerEquivalent: "Let's Encrypt (free) / Sectigo",
    notes: "No managed certificate service. Use Let's Encrypt via Certbot or cert-manager.",
    migrationEffort: "low",
    migrationNotes: ["Use Let's Encrypt (free) via Certbot or cert-manager on Kubernetes","Hetzner Load Balancers support Let's Encrypt natively","Commercial certs available via Sectigo or DigiCert EU"],
  },
  "efs": {
    match: "none",
    hetznerEquivalent: "None (self-host NFS)",
    notes: "No managed NFS on Hetzner. Self-host NFS server or use Longhorn for Kubernetes.",
    migrationEffort: "medium",
    migrationNotes: ["No managed shared filesystem on Hetzner","Option 1: Self-hosted NFS server on a dedicated Cloud Server","Option 2: Longhorn distributed storage for Kubernetes workloads","Option 3: Hetzner Volumes for single-node block storage"],
  },
  "fsx": {
    match: "none",
    hetznerEquivalent: "None",
    notes: "No FSx equivalent on Hetzner. Requires self-hosted Windows File Server or Lustre.",
    migrationEffort: "high",
    migrationNotes: ["No managed Windows or Lustre filesystem on Hetzner","FSx for Windows → self-hosted Windows Server on a dedicated server","FSx for Lustre → self-hosted Lustre cluster on Cloud Servers"],
  },
  "redshift": {
    match: "none",
    hetznerEquivalent: "None (use ClickHouse or self-hosted)",
    notes: "No managed data warehouse on Hetzner. ClickHouse or self-hosted PostgreSQL recommended.",
    migrationEffort: "high",
    migrationNotes: ["No managed data warehouse on Hetzner","Option 1: ClickHouse (EU cloud or self-hosted) for columnar analytics","Option 2: Self-hosted PostgreSQL with TimescaleDB for time-series","Option 3: Managed ClickHouse via DoubleCloud EU"],
  },
  "docdb": {
    match: "none",
    hetznerEquivalent: "None (self-host MongoDB)",
    notes: "No managed DocumentDB/MongoDB on Hetzner. Self-host MongoDB Community.",
    migrationEffort: "high",
    migrationNotes: ["No managed MongoDB-compatible DB on Hetzner","Self-host MongoDB Community Edition on a Cloud Server","Use MongoDB Atlas EU (Frankfurt) if managed service required","Update connection strings from DocumentDB to MongoDB endpoint"],
  },
  "neptune": {
    match: "none",
    hetznerEquivalent: "None (self-host Neo4j or ArangoDB)",
    notes: "No managed graph database on Hetzner. Self-host Neo4j Community or ArangoDB.",
    migrationEffort: "high",
    migrationNotes: ["No managed graph DB on Hetzner","Option 1: Self-hosted Neo4j Community on a Cloud Server","Option 2: ArangoDB (multi-model) as an alternative","Neo4j AuraDB EU available as managed alternative"],
  },
  "memorydb": {
    match: "none",
    hetznerEquivalent: "None (self-host Redis)",
    notes: "No managed Redis-compatible durable DB on Hetzner. Self-host Redis with AOF persistence.",
    migrationEffort: "medium",
    migrationNotes: ["No managed MemoryDB equivalent on Hetzner","Self-host Redis with AOF + RDB persistence on a Cloud Server","Use Redis Sentinel for HA","Upstash EU region offers managed Redis as an alternative"],
  },
  "globalaccelerator": {
    match: "none",
    hetznerEquivalent: "None (use Cloudflare or Anycast BGP)",
    notes: "No global accelerator on Hetzner. Cloudflare or self-managed Anycast routing.",
    migrationEffort: "high",
    migrationNotes: ["No global anycast acceleration on Hetzner","Option 1: Cloudflare (with EU data processing addendum) for global routing","Option 2: Self-managed Anycast BGP with Hetzner dedicated servers","Option 3: Deploy in multiple Hetzner locations (Falkenstein, Nuremberg, Helsinki)"],
  },
  "networkfirewall": {
    match: "none",
    hetznerEquivalent: "None (use pfSense or Suricata)",
    notes: "No managed network firewall on Hetzner. Self-host pfSense, OPNsense, or Suricata.",
    migrationEffort: "high",
    migrationNotes: ["No managed deep-packet inspection firewall on Hetzner","Option 1: Self-hosted OPNsense or pfSense on a dedicated server","Option 2: Suricata IDS/IPS for network threat detection","Hetzner Cloud Firewall covers basic L3/L4 — not L7 application rules"],
  },
  "waf": {
    match: "none",
    hetznerEquivalent: "None (use Cloudflare WAF)",
    notes: "No managed WAF on Hetzner. Cloudflare WAF or ModSecurity recommended.",
    migrationEffort: "medium",
    migrationNotes: ["No managed WAF on Hetzner","Option 1: Cloudflare WAF (EU DPA available)","Option 2: Self-hosted ModSecurity with NGINX or Apache","Option 3: Bunny.net WAF (European CDN with WAF)"],
  },
  "guardduty": {
    match: "none",
    hetznerEquivalent: "None (use Wazuh or Falco)",
    notes: "No managed threat detection on Hetzner. Self-host Wazuh or Falco for runtime security.",
    migrationEffort: "medium",
    migrationNotes: ["No managed threat detection on Hetzner","Option 1: Wazuh SIEM (open source, self-hosted) for log analysis","Option 2: Falco for Kubernetes runtime security","Option 3: CrowdSec (EU-based) for collaborative threat intelligence"],
  },
  "firehose": {
    match: "none",
    hetznerEquivalent: "None (self-host)",
    notes: "No managed data delivery stream on Hetzner. Use self-hosted Vector or Logstash.",
    migrationEffort: "high",
    migrationNotes: ["No managed streaming ETL on Hetzner","Option 1: Self-hosted Vector.dev for high-performance data pipelines","Option 2: Self-hosted Logstash or Fluent Bit","Option 3: Use self-hosted Kafka (MSK alternative) with Kafka Connect"],
  },
  "apprunner": {
    match: "none",
    hetznerEquivalent: "None (use Hetzner Cloud Servers + Docker)",
    notes: "No managed container runtime service. Deploy containers directly on Hetzner Cloud Servers.",
    migrationEffort: "medium",
    migrationNotes: ["No App Runner equivalent on Hetzner","Option 1: Deploy containers on Hetzner Cloud Servers with Docker + Caddy","Option 2: Use k3s for container orchestration","Option 3: Use Coolify (self-hosted PaaS) on a Hetzner server"],
  },
  "batch": {
    match: "none",
    hetznerEquivalent: "None (self-host)",
    notes: "No managed batch computing on Hetzner. Use self-hosted job queues.",
    migrationEffort: "high",
    migrationNotes: ["No managed batch processing on Hetzner","Option 1: Self-hosted Celery + Redis for task queues","Option 2: KEDA-powered Kubernetes jobs for auto-scaling batch work","Option 3: HashiCorp Nomad batch scheduler on Cloud Servers"],
  },
  "elasticbeanstalk": {
    match: "none",
    hetznerEquivalent: "None (use Coolify or Dokku)",
    notes: "No PaaS on Hetzner. Self-hosted Coolify or Dokku provides similar developer experience.",
    migrationEffort: "medium",
    migrationNotes: ["No managed PaaS on Hetzner","Option 1: Coolify (self-hosted Heroku alternative) on a Hetzner server","Option 2: Dokku for git-push deployments","Redeploy application code using Docker and a reverse proxy (Caddy/Nginx)"],
  },
  "lightsail": {
    match: "compatible",
    hetznerEquivalent: "Hetzner Cloud Servers (CX series)",
    notes: "Direct equivalent. Hetzner Cloud is more cost-effective than Lightsail.",
    migrationEffort: "low",
    migrationNotes: ["Hetzner CX22 (2 vCPU, 4GB) is cheaper than equivalent Lightsail plan","Migrate disk snapshot and restore on Hetzner Volume","Update DNS records to new server IP","Hetzner Cloud Console provides similar simplicity to Lightsail"],
  },
  "apigatewayv2": {
    match: "none",
    hetznerEquivalent: "None (use Kong, Traefik, or Nginx)",
    notes: "No managed API gateway on Hetzner. Self-host Kong, Traefik, or Nginx.",
    migrationEffort: "high",
    migrationNotes: ["No managed HTTP/WebSocket API gateway on Hetzner","Option 1: Self-hosted Kong Gateway on a Cloud Server","Option 2: Traefik with middleware for rate limiting and auth","Option 3: Nginx with Lua scripting for custom gateway logic"],
  },
  "appsync": {
    match: "none",
    hetznerEquivalent: "None (self-host Hasura or GraphQL Yoga)",
    notes: "No managed GraphQL service. Self-host Hasura or Apollo Server.",
    migrationEffort: "high",
    migrationNotes: ["No managed GraphQL API on Hetzner","Option 1: Self-hosted Hasura on a Cloud Server for auto-generated GraphQL","Option 2: Apollo Server or GraphQL Yoga for custom schema","Re-implement real-time subscriptions using WebSockets"],
  },
  "glue": {
    match: "none",
    hetznerEquivalent: "None (use Apache Spark or dbt)",
    notes: "No managed ETL service on Hetzner. Self-host Apache Spark or dbt Core.",
    migrationEffort: "high",
    migrationNotes: ["No managed ETL/data catalog on Hetzner","Option 1: Self-hosted Apache Spark cluster on Cloud Servers","Option 2: dbt Core for SQL-based transformations","Option 3: Airbyte (open source) for ELT pipelines"],
  },
  "athena": {
    match: "none",
    hetznerEquivalent: "None (use ClickHouse or DuckDB)",
    notes: "No serverless SQL query engine on Hetzner. Use ClickHouse or DuckDB.",
    migrationEffort: "high",
    migrationNotes: ["No serverless query engine on Hetzner","Option 1: DuckDB for in-process analytical queries","Option 2: Self-hosted ClickHouse for petabyte-scale analytics","Option 3: Trino (self-hosted) for federated SQL queries"],
  },
  "emr": {
    match: "none",
    hetznerEquivalent: "None (self-host Spark cluster)",
    notes: "No managed Hadoop/Spark on Hetzner. Self-host Apache Spark on Cloud Servers.",
    migrationEffort: "high",
    migrationNotes: ["No managed big data processing on Hetzner","Self-host Apache Spark cluster using Spark Standalone or YARN","Use Hetzner dedicated servers (AX line) for cost-effective Spark nodes","Consider managed Spark via Databricks EU or Qubole EU"],
  },
  "sagemaker": {
    match: "none",
    hetznerEquivalent: "None (self-host)",
    notes: "No managed ML platform on Hetzner. Self-host MLflow, Kubeflow, or use EU-based alternatives.",
    migrationEffort: "high",
    migrationNotes: ["No managed ML platform on Hetzner","Option 1: Self-hosted MLflow for experiment tracking and model registry","Option 2: Kubeflow on self-managed Kubernetes for ML pipelines","Option 3: Hetzner GPU servers (GX series) for model training","Consider Scaleway ML Platform or OVHcloud AI for managed EU ML"],
  },
  "bedrock": {
    match: "none",
    hetznerEquivalent: "None (use EU-based LLM APIs)",
    notes: "No managed LLM/foundation model service on Hetzner. Use EU-based AI APIs.",
    migrationEffort: "high",
    migrationNotes: ["No managed AI/LLM service on Hetzner","Option 1: Anthropic Claude API (EU data processing available)","Option 2: Mistral AI (French company, GDPR-compliant)","Option 3: Self-hosted open models (Llama, Mistral) on Hetzner GPU servers","Option 4: Aleph Alpha (German LLM provider) for sovereign AI"],
  },
  "codebuild": {
    match: "none",
    hetznerEquivalent: "None (use GitHub Actions or self-hosted Gitea CI)",
    notes: "No managed CI service on Hetzner. Use GitHub Actions, GitLab CI, or self-hosted runners.",
    migrationEffort: "medium",
    migrationNotes: ["No managed CI/CD on Hetzner","Option 1: GitHub Actions with self-hosted runners on Hetzner for cost savings","Option 2: Self-hosted Gitea + Gitea Actions on a Cloud Server","Option 3: Self-hosted GitLab CE with integrated CI runners"],
  },
  "codepipeline": {
    match: "none",
    hetznerEquivalent: "None (use GitHub Actions or Argo CD)",
    notes: "No managed pipeline service on Hetzner. GitHub Actions or Argo CD recommended.",
    migrationEffort: "medium",
    migrationNotes: ["No managed deployment pipeline on Hetzner","Option 1: GitHub Actions for CI/CD pipelines","Option 2: Argo CD for Kubernetes GitOps deployments","Option 3: Self-hosted Drone CI or Woodpecker CI"],
  },
  "cloudformation": {
    match: "partial",
    hetznerEquivalent: "Terraform (Hetzner provider) or Pulumi",
    notes: "No CloudFormation equivalent, but Terraform has full Hetzner Cloud provider support.",
    migrationEffort: "medium",
    migrationNotes: ["Terraform hetznercloud provider covers all Hetzner resources","Rewrite CloudFormation templates as Terraform HCL or Pulumi code","Use cf2tf (community tool) to assist CloudFormation → Terraform migration","Hetzner also supports Ansible via community modules"],
  },
  "cloudwatch": {
    match: "none",
    hetznerEquivalent: "None (use Prometheus + Grafana)",
    notes: "No managed monitoring on Hetzner. Self-host Prometheus, Grafana, and Loki stack.",
    migrationEffort: "medium",
    migrationNotes: ["No managed monitoring/alerting on Hetzner","Option 1: Prometheus + Grafana + Loki (metrics, dashboards, logs)","Option 2: VictoriaMetrics as a lightweight Prometheus replacement","Option 3: Grafana Cloud EU for managed observability stack","Hetzner provides basic CPU/network metrics in the Cloud Console"],
  },
  "ssm": {
    match: "none",
    hetznerEquivalent: "None (use Ansible or Teleport)",
    notes: "No managed systems manager on Hetzner. Use Ansible for configuration or Teleport for access.",
    migrationEffort: "medium",
    migrationNotes: ["No managed SSM equivalent on Hetzner","Option 1: Ansible for remote configuration management","Option 2: Teleport for secure bastion/SSH access management","Option 3: HashiCorp Nomad + Consul for service mesh and config"],
  },
  "backup": {
    match: "none",
    hetznerEquivalent: "None (use Restic or Velero)",
    notes: "No centralized backup service on Hetzner. Use Restic for files or Velero for Kubernetes.",
    migrationEffort: "medium",
    migrationNotes: ["No managed backup service on Hetzner","Option 1: Restic with Hetzner Object Storage as the backup target","Option 2: Velero for Kubernetes workload backup","Hetzner Volumes support snapshots; Cloud Servers support manual snapshots"],
  },
  "transfer": {
    match: "none",
    hetznerEquivalent: "None (self-host SFTP server)",
    notes: "No managed SFTP/FTPS service on Hetzner. Self-host vsftpd or OpenSSH SFTP.",
    migrationEffort: "medium",
    migrationNotes: ["No managed file transfer service on Hetzner","Self-host OpenSSH SFTP subsystem on a Cloud Server","Use NGINX or ProFTPD for FTPS support","Store files in Hetzner Object Storage via rclone or s3fs"],
  },
  "iot": {
    match: "none",
    hetznerEquivalent: "None (self-host MQTT broker)",
    notes: "No managed IoT platform on Hetzner. Self-host Eclipse Mosquitto or EMQX.",
    migrationEffort: "high",
    migrationNotes: ["No managed IoT broker on Hetzner","Option 1: Self-hosted Eclipse Mosquitto (MQTT) on a Cloud Server","Option 2: EMQX for high-throughput IoT messaging","Option 3: Use HiveMQ Cloud EU as a managed MQTT alternative"],
  },
  "rekognition": {
    match: "none",
    hetznerEquivalent: "None (use EU-based Vision AI)",
    notes: "No managed computer vision on Hetzner. Use EU-based or self-hosted alternatives.",
    migrationEffort: "high",
    migrationNotes: ["No managed vision AI on Hetzner","Option 1: Self-hosted models on Hetzner GPU servers (YOLOv8, OpenCV)","Option 2: Google Vision API (EU data residency available)","Option 3: Clarifai EU for managed computer vision"],
  },
  "ses": {
    match: "none",
    hetznerEquivalent: "None (use Brevo or Postmark)",
    notes: "No managed email service on Hetzner. Use EU-based transactional email providers.",
    migrationEffort: "low",
    migrationNotes: ["No managed email service on Hetzner","Option 1: Brevo (French company, GDPR-compliant) — drop-in SMTP replacement","Option 2: Postmark for transactional email with EU data processing","Option 3: Self-hosted Postal or Haraka on a Cloud Server"],
  },
  "connect": {
    match: "none",
    hetznerEquivalent: "None (use Twilio or self-hosted)",
    notes: "No managed contact center on Hetzner. Use Twilio Flex or self-hosted Asterisk.",
    migrationEffort: "high",
    migrationNotes: ["No managed contact center on Hetzner","Option 1: Twilio Flex (EU data center available)","Option 2: Self-hosted Asterisk or FreeSWITCH on a Cloud Server","Option 3: 3CX (EU-based) for managed cloud telephony"],
  },
  "mq": {
    match: "none",
    hetznerEquivalent: "None (self-host RabbitMQ or ActiveMQ)",
    notes: "No managed message broker on Hetzner. Self-host RabbitMQ or ActiveMQ.",
    migrationEffort: "medium",
    migrationNotes: ["No managed AMQP/STOMP broker on Hetzner","Option 1: Self-hosted RabbitMQ on a Cloud Server (AMQP-compatible with Amazon MQ)","Option 2: Self-hosted ActiveMQ Artemis for JMS workloads","CloudAMQP EU offers managed RabbitMQ as an alternative"],
  },
  "pinpoint": {
    match: "none",
    hetznerEquivalent: "None (use Brevo or Customer.io)",
    notes: "No managed marketing/engagement platform on Hetzner. Use EU-based alternatives.",
    migrationEffort: "medium",
    migrationNotes: ["No managed customer engagement platform on Hetzner","Option 1: Brevo (formerly Sendinblue) for email/SMS campaigns","Option 2: Customer.io (EU data processing available)","Option 3: Self-hosted Mautic for marketing automation"],
  },
  "dynamodb": {
    match: "none",
    hetznerEquivalent: "None",
    notes: "No managed NoSQL. Use self-hosted MongoDB or CockroachDB.",
    migrationEffort: "high",
    migrationNotes: [
      "No managed NoSQL database on Hetzner",
      "Option 1: Self-hosted MongoDB (use MongoDB Atlas EU if managed needed)",
      "Option 2: CockroachDB for distributed SQL with NoSQL patterns",
      "Option 3: Migrate to PostgreSQL with JSONB if workload allows",
      "Application-level changes required to replace DynamoDB SDK",
    ],
  },

  // ---------------------------------------------------------------------------
  // Expanded AWS service coverage — entries below are terse because the Hetzner
  // compatibility story for most of these is simply "self-host or choose an EU
  // SaaS". Any service where a richer story exists gets its own dedicated entry.
  // ---------------------------------------------------------------------------

  // Fill-in entries for services that were enumerated previously but lacked
  // catalog coverage. Without these, scoreServices would silently drop the
  // results and they'd never appear in the final report.
  "route53": {
    match: "partial",
    hetznerEquivalent: "Hetzner DNS Console",
    notes: "Authoritative DNS available via Hetzner DNS. No private hosted zones.",
    migrationEffort: "low",
    migrationNotes: ["Hetzner DNS Console provides authoritative DNS with an API","No private hosted zones — use split-horizon DNS on a self-hosted CoreDNS for internal names","Cloudflare DNS is a common managed alternative"],
  },
  "secretsmanager": {
    match: "none",
    hetznerEquivalent: "None (HashiCorp Vault / SOPS)",
    notes: "No managed secrets service on Hetzner. Self-host HashiCorp Vault or use SOPS.",
    migrationEffort: "medium",
    migrationNotes: ["Self-host HashiCorp Vault on a Hetzner Cloud Server","Use SOPS + age for Git-encrypted secrets","Doppler / Infisical (EU) as managed alternatives"],
  },
  "apigateway": {
    match: "none",
    hetznerEquivalent: "None (Kong / Traefik / Nginx)",
    notes: "No managed API gateway on Hetzner. Self-host Kong, Traefik, or Nginx.",
    migrationEffort: "high",
    migrationNotes: ["Self-host Kong Gateway on Hetzner Cloud","Traefik for Kubernetes-native API gateway + ingress","Nginx + Lua for custom gateway behaviour"],
  },
  "kinesis": {
    match: "none",
    hetznerEquivalent: "None (Kafka / Redpanda)",
    notes: "No managed streaming on Hetzner. Self-host Apache Kafka or Redpanda.",
    migrationEffort: "high",
    migrationNotes: ["Self-host Apache Kafka or Redpanda (Kafka-compatible) on Hetzner","Use NATS JetStream for lighter streaming","Aiven (EU) offers managed Kafka as an alternative"],
  },
  "stepfunctions": {
    match: "partial",
    hetznerEquivalent: "Temporal.io / Airflow",
    notes: "No managed orchestrator. Temporal.io or Apache Airflow self-hosted.",
    migrationEffort: "medium",
    migrationNotes: ["Self-host Temporal.io for durable workflow execution","Apache Airflow for DAG-based data pipelines","Prefect / Dagster as modern alternatives"],
  },
  "eventbridge": {
    match: "none",
    hetznerEquivalent: "None (NATS / Kafka)",
    notes: "No managed event bus. Self-host NATS JetStream, Kafka, or RabbitMQ.",
    migrationEffort: "high",
    migrationNotes: ["Self-host NATS JetStream for lightweight event routing","Kafka/Redpanda for high-throughput event logs","RabbitMQ exchanges for AMQP-style routing"],
  },
  "cognito": {
    match: "none",
    hetznerEquivalent: "None (Keycloak / Authentik)",
    notes: "No managed identity service. Self-host Keycloak, Authentik, or use Auth0 EU.",
    migrationEffort: "medium",
    migrationNotes: ["Self-host Keycloak for enterprise SSO and user pools","Authentik is a modern open-source alternative","Auth0 EU / Clerk EU for managed options"],
  },
  "ecr": {
    match: "partial",
    hetznerEquivalent: "Self-hosted Harbor / GHCR",
    notes: "No managed container registry. Self-host Harbor on Hetzner or use GHCR.",
    migrationEffort: "low",
    migrationNotes: ["Self-host Harbor (CNCF) for a feature-rich registry","GitHub Container Registry or GitLab Container Registry as managed alternatives","Hetzner Object Storage can back a minimal OCI registry"],
  },
  "opensearch": {
    match: "partial",
    hetznerEquivalent: "Self-hosted OpenSearch",
    notes: "Self-host OpenSearch or Elasticsearch on Hetzner — fully compatible API.",
    migrationEffort: "medium",
    migrationNotes: ["Self-host OpenSearch on Hetzner dedicated or Cloud Servers","Use Hetzner Volumes for data persistence","Elastic Cloud EU is a managed alternative"],
  },
  "msk": {
    match: "none",
    hetznerEquivalent: "None (Kafka / Redpanda)",
    notes: "No managed Kafka on Hetzner. Self-host Apache Kafka or Redpanda.",
    migrationEffort: "high",
    migrationNotes: ["Self-host Apache Kafka or Redpanda on Hetzner dedicated servers","Aiven EU offers managed Kafka","Use Hetzner Volumes for log persistence"],
  },

  "cloudtrail": {
    match: "none",
    hetznerEquivalent: "None (Graylog or Loki)",
    notes: "No managed audit logging. Use self-hosted Graylog or Loki.",
    migrationEffort: "medium",
    migrationNotes: ["Self-host Graylog on a Hetzner Cloud Server for API audit trails","Alternatively, ship logs to Grafana Loki","Hetzner Cloud API activity is available through the Hetzner Cloud Console"],
  },
  "config": {
    match: "none",
    hetznerEquivalent: "None (Open Policy Agent)",
    notes: "No managed compliance/config service. Use Open Policy Agent.",
    migrationEffort: "high",
    migrationNotes: ["No AWS Config equivalent on Hetzner","Self-host Open Policy Agent (OPA) for policy-as-code","Use Terraform drift detection + custom alerting for config monitoring"],
  },
  "securityhub": {
    match: "none",
    hetznerEquivalent: "None (Wazuh / Grafana)",
    notes: "No managed SIEM. Use self-hosted Wazuh or Grafana.",
    migrationEffort: "high",
    migrationNotes: ["Self-host Wazuh on Hetzner Cloud Servers for SIEM","Aggregate findings into Grafana dashboards","Use CrowdSec (EU-based) for collaborative threat intelligence"],
  },
  "macie": {
    match: "none",
    hetznerEquivalent: "None",
    notes: "No managed data classification. Use self-hosted tools.",
    migrationEffort: "high",
    migrationNotes: ["No data classification service on Hetzner","Self-host tools like DataHub or custom classifiers on Hetzner Cloud","Encrypt sensitive data at rest using Hetzner Volume encryption"],
  },
  "inspector": {
    match: "none",
    hetznerEquivalent: "None (Trivy / Grype)",
    notes: "No managed vulnerability scanning. Use Trivy/Grype.",
    migrationEffort: "medium",
    migrationNotes: ["Self-host Trivy or Grype for container/image scanning","Integrate scans into CI pipelines","Use Wazuh for host-level vulnerability detection"],
  },
  "identitycenter": {
    match: "none",
    hetznerEquivalent: "None (Keycloak / Authentik)",
    notes: "No managed SSO. Use self-hosted Keycloak or Authentik.",
    migrationEffort: "medium",
    migrationNotes: ["Self-host Keycloak on Hetzner for enterprise SSO + SAML/OIDC","Authentik is a modern open-source alternative","Both integrate with SCIM for user provisioning"],
  },
  "directoryservice": {
    match: "none",
    hetznerEquivalent: "None (Samba AD / Authentik)",
    notes: "No managed AD. Self-host Samba AD or use Authentik.",
    migrationEffort: "high",
    migrationNotes: ["Self-host Samba AD on a Hetzner Cloud Server for Active Directory","Authentik can act as an LDAP directory for modern apps","Plan for HA: run at least two domain controllers"],
  },
  "organizations": {
    match: "none",
    hetznerEquivalent: "None",
    notes: "No multi-account management. Manual account separation.",
    migrationEffort: "medium",
    migrationNotes: ["No Organizations equivalent on Hetzner","Use separate Hetzner Projects per team/environment","Centralised billing is handled at the Hetzner account level"],
  },
  "codecommit": {
    match: "partial",
    hetznerEquivalent: "Gitea / self-hosted GitLab",
    notes: "Gitea or self-hosted GitLab on Hetzner Cloud Servers.",
    migrationEffort: "low",
    migrationNotes: ["Self-host Gitea (lightweight) or GitLab CE on Hetzner","Mirror existing CodeCommit repos with git push --mirror","Hetzner Object Storage works as Git LFS backend"],
  },
  "codedeploy": {
    match: "partial",
    hetznerEquivalent: "GitLab CI/CD, ArgoCD, Ansible",
    notes: "Use GitLab CI/CD, ArgoCD, or Ansible for deployments.",
    migrationEffort: "medium",
    migrationNotes: ["Adopt GitLab CI or GitHub Actions with self-hosted runners on Hetzner","ArgoCD for Kubernetes GitOps","Ansible + ansible-pull for VM-based deployments"],
  },
  "codeartifact": {
    match: "none",
    hetznerEquivalent: "Nexus / Verdaccio",
    notes: "Self-host Nexus or Verdaccio on Hetzner Cloud.",
    migrationEffort: "medium",
    migrationNotes: ["Self-host Sonatype Nexus for multi-format artifact hosting","Verdaccio for lightweight npm registries","Use Hetzner Object Storage as artifact backend"],
  },
  "iotevents": {
    match: "none",
    hetznerEquivalent: "None (Node-RED)",
    notes: "No managed IoT event detection. Use self-hosted Node-RED.",
    migrationEffort: "medium",
    migrationNotes: ["Self-host Node-RED on Hetzner for low-code event automation","Integrate with Mosquitto/EMQX for IoT messaging"],
  },
  "iotsitewise": {
    match: "none",
    hetznerEquivalent: "None (InfluxDB / Grafana)",
    notes: "No managed industrial IoT. Self-host InfluxDB/Grafana stack.",
    migrationEffort: "high",
    migrationNotes: ["Self-host InfluxDB + Grafana for time-series industrial data","Telegraf/Node-RED for data collection","Hetzner dedicated servers recommended for high-ingest workloads"],
  },
  "greengrass": {
    match: "none",
    hetznerEquivalent: "None",
    notes: "No edge IoT runtime. Use self-deployed Docker on edge devices.",
    migrationEffort: "high",
    migrationNotes: ["No Greengrass equivalent","Ship containers to edge devices via Balena or custom Docker deployments","Use k3s for orchestrated edge workloads"],
  },
  "amplify": {
    match: "none",
    hetznerEquivalent: "None (Vercel / Netlify / self-host)",
    notes: "No Amplify equivalent. Use Vercel, Netlify, or self-host on Hetzner.",
    migrationEffort: "medium",
    migrationNotes: ["Vercel / Netlify for hosted frontend CI/CD (EU regions available)","Self-host with Coolify or CapRover on a Hetzner server","Static sites can be served directly from Hetzner Object Storage"],
  },
  "licensemanager": {
    match: "none",
    hetznerEquivalent: "None",
    notes: "No license manager equivalent. Manual license tracking.",
    migrationEffort: "medium",
    migrationNotes: ["Track software licences manually or via a self-hosted tool (Snipe-IT)","Hetzner servers come with OS licences pre-included"],
  },
  "directconnect": {
    match: "none",
    hetznerEquivalent: "None (dedicated + BGP)",
    notes: "No dedicated connection service. Use Hetzner dedicated servers with BGP.",
    migrationEffort: "high",
    migrationNotes: ["Hetzner offers dedicated fibre cross-connects via their colocation product","BGP sessions available for AS customers","Public Internet + IPsec/WireGuard is usually sufficient"],
  },
  "autoscaling": {
    match: "partial",
    hetznerEquivalent: "Hetzner Cloud Autoscaling (beta) / API scripts",
    notes: "Use Hetzner Cloud Autoscaling or custom scripts with the Hetzner API.",
    migrationEffort: "medium",
    migrationNotes: ["Hetzner Cloud now has native autoscaling for Cloud Servers","Kubernetes Cluster Autoscaler has a Hetzner provider","Custom scripts against the Hetzner Cloud API are a reliable fallback"],
  },
  "cloudwatchlogs": {
    match: "partial",
    hetznerEquivalent: "Loki + Grafana / Graylog",
    notes: "Self-host Loki + Grafana or use Graylog on Hetzner Cloud.",
    migrationEffort: "medium",
    migrationNotes: ["Self-host Loki + Grafana (low-footprint) for log aggregation","Graylog for enterprise features","ELK/OpenSearch as a heavier alternative"],
  },
  "kendra": {
    match: "none",
    hetznerEquivalent: "None (Elasticsearch / Weaviate)",
    notes: "No managed enterprise search. Self-host Elasticsearch/Weaviate.",
    migrationEffort: "high",
    migrationNotes: ["Self-host OpenSearch/Elasticsearch for keyword search","Weaviate or Qdrant for semantic search","Combine with LLMs for RAG-based search experiences"],
  },
  "comprehend": {
    match: "none",
    hetznerEquivalent: "None (Transformers / spaCy)",
    notes: "No managed NLP. Self-host HuggingFace Transformers or spaCy.",
    migrationEffort: "high",
    migrationNotes: ["Self-host HuggingFace models on Hetzner GPU servers","spaCy / Stanza for CPU-based NLP pipelines","Mistral AI (EU) for managed NLP"],
  },
  "iotanalytics": {
    match: "none",
    hetznerEquivalent: "None (InfluxDB + Grafana)",
    notes: "No managed IoT analytics. Self-host InfluxDB + Grafana.",
    migrationEffort: "medium",
    migrationNotes: ["Self-host InfluxDB / TimescaleDB + Grafana on Hetzner","Telegraf for ingestion","Apache Kafka (self-hosted) for high-throughput pipelines"],
  },
  "keyspaces": {
    match: "none",
    hetznerEquivalent: "None (Apache Cassandra)",
    notes: "No managed Cassandra. Self-host Apache Cassandra on Hetzner.",
    migrationEffort: "high",
    migrationNotes: ["Self-host Apache Cassandra on Hetzner dedicated servers","ScyllaDB as a drop-in alternative","Hetzner's NVMe volumes give Cassandra good I/O"],
  },
  "lex": {
    match: "none",
    hetznerEquivalent: "None (Rasa)",
    notes: "No managed chatbot service. Self-host Rasa or use external APIs.",
    migrationEffort: "high",
    migrationNotes: ["Self-host Rasa (open source) on Hetzner","LLM-based chatbots via Mistral AI / Anthropic APIs (EU)","Botpress as an alternative OSS platform"],
  },
  "shield": {
    match: "none",
    hetznerEquivalent: "Built-in Hetzner DDoS protection",
    notes: "Hetzner provides basic DDoS protection. No advanced Shield equivalent.",
    migrationEffort: "low",
    migrationNotes: ["Hetzner includes free DDoS protection on all Cloud and dedicated servers","For advanced protection, use Cloudflare / Bunny.net in front","No paid Shield Advanced equivalent"],
  },
  "textract": {
    match: "none",
    hetznerEquivalent: "None (Tesseract / Donut)",
    notes: "No managed OCR/document AI. Self-host Tesseract or Donut.",
    migrationEffort: "high",
    migrationNotes: ["Self-host Tesseract for classic OCR","Donut / LayoutLM for document understanding (GPU)","Run pipelines with Celery workers on Hetzner"],
  },
  "timestream": {
    match: "none",
    hetznerEquivalent: "None (InfluxDB / TimescaleDB)",
    notes: "No managed time series DB. Self-host InfluxDB or TimescaleDB.",
    migrationEffort: "medium",
    migrationNotes: ["Self-host TimescaleDB (PostgreSQL extension) on Hetzner","InfluxDB 3 for pure time-series workloads","VictoriaMetrics for metric-focused storage"],
  },
  "transcribe": {
    match: "none",
    hetznerEquivalent: "None (Whisper)",
    notes: "No managed STT. Self-host Whisper or use external APIs.",
    migrationEffort: "high",
    migrationNotes: ["Self-host OpenAI Whisper on Hetzner GPU servers","faster-whisper for CPU inference","Mistral AI / Deepgram as managed alternatives"],
  },
  "translate": {
    match: "none",
    hetznerEquivalent: "None (LibreTranslate)",
    notes: "No managed translation. Self-host LibreTranslate or use external APIs.",
    migrationEffort: "medium",
    migrationNotes: ["Self-host LibreTranslate on Hetzner Cloud","DeepL (German company, GDPR-friendly) as managed alternative","Use Hetzner GPU servers for custom NMT models"],
  },
  "xray": {
    match: "partial",
    hetznerEquivalent: "Self-hosted Jaeger / Tempo",
    notes: "Self-host Jaeger or Tempo for distributed tracing on Hetzner.",
    migrationEffort: "medium",
    migrationNotes: ["Self-host Jaeger or Grafana Tempo for distributed tracing","Instrument via OpenTelemetry SDKs","Cloud-agnostic, works identically to X-Ray"],
  },
};

const WEIGHTS: Record<string, number> = {
  ec2: 3, vpc: 2, rds: 3, s3: 3, lambda: 4, ecs: 2, eks: 3,
  cloudfront: 2, route53: 1, elb: 2, elasticache: 2, sqs: 2, sns: 1, dynamodb: 3, privatelink: 3,
  kms: 2, acm: 1, efs: 2, fsx: 2, redshift: 3, docdb: 3, neptune: 2, memorydb: 2,
  globalaccelerator: 2, networkfirewall: 2, waf: 2, guardduty: 1, firehose: 2,
  apprunner: 2, batch: 2, elasticbeanstalk: 2, lightsail: 1, apigatewayv2: 2,
  appsync: 2, glue: 2, athena: 2, emr: 2, sagemaker: 3, bedrock: 2,
  codebuild: 1, codepipeline: 1, cloudformation: 1, cloudwatch: 1, ssm: 1,
  backup: 1, transfer: 1, iot: 2, rekognition: 2, ses: 1, connect: 2, mq: 2, pinpoint: 1,

  // Expanded coverage — most of these are minor signals with weight 1.
  // More architecturally-impactful services get higher weights.
  autoscaling: 2, cloudwatchlogs: 2, directconnect: 3,
  cloudtrail: 1, config: 1, securityhub: 1, macie: 1, inspector: 1,
  identitycenter: 1, directoryservice: 1, organizations: 1,
  codecommit: 1, codedeploy: 1, codeartifact: 1,
  iotevents: 1, iotsitewise: 1, greengrass: 1,
  amplify: 1,
  licensemanager: 1,
  kendra: 1,
  comprehend: 1, iotanalytics: 1, keyspaces: 1, lex: 1,
  shield: 1, textract: 1, timestream: 1, transcribe: 1,
  translate: 1, xray: 1,
};

const MATCH_SCORES: Record<string, number> = { compatible: 100, partial: 50, none: 0 };

// ---------------------------------------------------------------------------
// AWS enumeration — parallel direct API calls across all major services
// ---------------------------------------------------------------------------

async function enumerateServices(credentials: { accessKeyId: string; secretAccessKey: string; sessionToken: string }): Promise<CanonicalModel> {
  const cfg = { region: REGION, credentials };
  const globalCfg = { region: "us-east-1", credentials };
  const model: CanonicalModel = {};

  // PrivateLink has two sides (consumer interface endpoints and provider endpoint services);
  // we collect each independently and merge at the end to avoid any read-modify-write races
  // across the parallel Promise.all branches.
  let privatelinkConsumers: Resource[] = [];
  let privatelinkProviders: Resource[] = [];

  await Promise.all([
    // EC2 instances
    (async () => {
      try {
        const ec2 = new EC2Client(cfg);
        const { Reservations } = await ec2.send(new DescribeInstancesCommand({ MaxResults: 50 }));
        const instances = (Reservations ?? []).flatMap((r) => r.Instances ?? []);
        if (instances.length > 0) {
          model.ec2 = {
            count: instances.length,
            resources: instances.map((i) => ({
              id: i.InstanceId ?? "unknown",
              name: i.Tags?.find((t) => t.Key === "Name")?.Value,
              type: i.InstanceType as string | undefined,
              region: REGION,
              extra: { state: i.State?.Name ?? "unknown" },
            })),
          };
        }
      } catch {}
    })(),

    // VPCs (non-default only — the default VPC is noise in every account)
    (async () => {
      try {
        const ec2 = new EC2Client(cfg);
        const { Vpcs } = await ec2.send(new DescribeVpcsCommand({}));
        const nonDefault = (Vpcs ?? []).filter((v) => !v.IsDefault);
        if (nonDefault.length > 0) {
          model.vpc = {
            count: nonDefault.length,
            resources: nonDefault.map((v) => ({
              id: v.VpcId ?? "unknown",
              name: v.Tags?.find((t) => t.Key === "Name")?.Value,
              extra: { cidr: v.CidrBlock ?? "unknown" },
            })),
          };
        }
      } catch {}
    })(),

    // VPC Endpoints (consumer side — Interface type represents AWS PrivateLink usage)
    (async () => {
      try {
        const ec2 = new EC2Client(cfg);
        const { VpcEndpoints } = await ec2.send(new DescribeVpcEndpointsCommand({}));
        const interfaceEndpoints = (VpcEndpoints ?? [])
          .filter((e) => e.State?.toString() !== "deleted")
          .filter((e) => e.VpcEndpointType?.toString() === "Interface");
        privatelinkConsumers = interfaceEndpoints.map((e) => ({
          id: e.VpcEndpointId ?? "unknown",
          name: e.ServiceName?.split(".").pop(),
          extra: {
            service: e.ServiceName ?? "unknown",
            state: e.State?.toString() ?? "unknown",
            kind: "consumer",
          },
        }));
      } catch {}
    })(),

    // VPC Endpoint Services (provider side — services exposed via PrivateLink)
    (async () => {
      try {
        const ec2 = new EC2Client(cfg);
        const { ServiceConfigurations } = await ec2.send(new DescribeVpcEndpointServiceConfigurationsCommand({}));
        const active = (ServiceConfigurations ?? []).filter((s) => s.ServiceState?.toString() !== "Deleted");
        privatelinkProviders = active.map((s) => ({
          id: s.ServiceId ?? "unknown",
          name: s.ServiceName?.split(".").pop(),
          extra: {
            serviceId: s.ServiceId ?? "unknown",
            state: s.ServiceState?.toString() ?? "unknown",
            kind: "provider",
          },
        }));
      } catch {}
    })(),

    // RDS
    (async () => {
      try {
        const rds = new RDSClient(cfg);
        const { DBInstances } = await rds.send(new DescribeDBInstancesCommand({}));
        if (DBInstances && DBInstances.length > 0) {
          model.rds = {
            count: DBInstances.length,
            resources: DBInstances.map((db) => ({
              id: db.DBInstanceIdentifier ?? "unknown",
              type: db.DBInstanceClass,
              extra: {
                engine: `${db.Engine ?? ""} ${db.EngineVersion ?? ""}`.trim(),
                status: db.DBInstanceStatus ?? "unknown",
                storage: `${db.AllocatedStorage ?? 0} GB`,
              },
            })),
          };
        }
      } catch {}
    })(),

    // S3 (bucket namespace is global — always query us-east-1)
    (async () => {
      try {
        const s3 = new S3Client(globalCfg);
        const { Buckets } = await s3.send(new ListBucketsCommand({}));
        if (Buckets && Buckets.length > 0) {
          model.s3 = {
            count: Buckets.length,
            resources: Buckets.map((b) => ({
              id: b.Name ?? "unknown",
              name: b.Name,
              extra: { created: b.CreationDate?.toISOString().split("T")[0] ?? "" },
            })),
          };
        }
      } catch {}
    })(),

    // Lambda
    (async () => {
      try {
        const lambda = new LambdaClient(cfg);
        const { Functions } = await lambda.send(new ListFunctionsCommand({ MaxItems: 50 }));
        if (Functions && Functions.length > 0) {
          model.lambda = {
            count: Functions.length,
            resources: Functions.map((f) => ({
              id: f.FunctionName ?? "unknown",
              type: f.Runtime as string | undefined,
              extra: { memory: `${f.MemorySize ?? 128} MB`, timeout: `${f.Timeout ?? 3}s` },
            })),
          };
        }
      } catch {}
    })(),

    // ECS
    (async () => {
      try {
        const ecs = new ECSClient(cfg);
        const { clusterArns } = await ecs.send(new ListClustersCommand({}));
        if (clusterArns && clusterArns.length > 0) {
          model.ecs = {
            count: clusterArns.length,
            resources: clusterArns.map((arn) => ({ id: arn.split("/").pop() ?? arn })),
          };
        }
      } catch {}
    })(),

    // EKS
    (async () => {
      try {
        const eks = new EKSClient(cfg);
        const { clusters } = await eks.send(new ListEKSClustersCommand({}));
        if (clusters && clusters.length > 0) {
          model.eks = {
            count: clusters.length,
            resources: clusters.map((name) => ({ id: name })),
          };
        }
      } catch {}
    })(),

    // ElastiCache
    (async () => {
      try {
        const elasticache = new ElastiCacheClient(cfg);
        const { CacheClusters } = await elasticache.send(new DescribeCacheClustersCommand({}));
        if (CacheClusters && CacheClusters.length > 0) {
          model.elasticache = {
            count: CacheClusters.length,
            resources: CacheClusters.map((c) => ({
              id: c.CacheClusterId ?? "unknown",
              type: c.CacheNodeType,
              extra: {
                engine: `${c.Engine ?? ""} ${c.EngineVersion ?? ""}`.trim(),
                status: c.CacheClusterStatus ?? "unknown",
              },
            })),
          };
        }
      } catch {}
    })(),

    // SQS
    (async () => {
      try {
        const sqs = new SQSClient(cfg);
        const { QueueUrls } = await sqs.send(new ListQueuesCommand({}));
        if (QueueUrls && QueueUrls.length > 0) {
          model.sqs = {
            count: QueueUrls.length,
            resources: QueueUrls.map((url) => ({ id: url.split("/").pop() ?? url })),
          };
        }
      } catch {}
    })(),

    // SNS
    (async () => {
      try {
        const sns = new SNSClient(cfg);
        const { Topics } = await sns.send(new ListTopicsCommand({}));
        if (Topics && Topics.length > 0) {
          model.sns = {
            count: Topics.length,
            resources: Topics.filter((t) => t.TopicArn).map((t) => ({
              id: t.TopicArn!.split(":").pop() ?? t.TopicArn!,
            })),
          };
        }
      } catch {}
    })(),

    // DynamoDB
    (async () => {
      try {
        const dynamo = new DynamoDBClient(cfg);
        const { TableNames } = await dynamo.send(new ListTablesCommand({}));
        if (TableNames && TableNames.length > 0) {
          model.dynamodb = {
            count: TableNames.length,
            resources: TableNames.map((name) => ({ id: name })),
          };
        }
      } catch {}
    })(),

    // ELB v2 (Application & Network Load Balancers)
    (async () => {
      try {
        const elb = new ElasticLoadBalancingV2Client(cfg);
        const { LoadBalancers } = await elb.send(new DescribeLoadBalancersCommand({}));
        if (LoadBalancers && LoadBalancers.length > 0) {
          model.elb = {
            count: LoadBalancers.length,
            resources: LoadBalancers.map((lb) => ({
              id: lb.LoadBalancerName ?? "unknown",
              type: lb.Type as string | undefined,
              extra: {
                state: lb.State?.Code?.toString() ?? "unknown",
                dns: lb.DNSName ?? "unknown",
              },
            })),
          };
        }
      } catch {}
    })(),

    // CloudFront (global — query us-east-1)
    (async () => {
      try {
        const cloudfront = new CloudFrontClient(globalCfg);
        const { DistributionList } = await cloudfront.send(new ListDistributionsCommand({}));
        const items = DistributionList?.Items ?? [];
        if (items.length > 0) {
          model.cloudfront = {
            count: items.length,
            resources: items.map((d) => ({
              id: d.Id ?? "unknown",
              extra: {
                domain: d.DomainName ?? "unknown",
                status: d.Status ?? "unknown",
              },
            })),
          };
        }
      } catch {}
    })(),

    // Route53 (global — query us-east-1)
    (async () => {
      try {
        const route53 = new Route53Client(globalCfg);
        const { HostedZones } = await route53.send(new ListHostedZonesCommand({}));
        if (HostedZones && HostedZones.length > 0) {
          model.route53 = {
            count: HostedZones.length,
            resources: HostedZones.map((z) => ({
              id: z.Name ?? "unknown",
              extra: {
                type: z.Config?.PrivateZone ? "Private" : "Public",
                recordCount: String(z.ResourceRecordSetCount ?? 0),
              },
            })),
          };
        }
      } catch {}
    })(),

    // Secrets Manager (names only — never log secret values)
    (async () => {
      try {
        const secrets = new SecretsManagerClient(cfg);
        const { SecretList } = await secrets.send(new ListSecretsCommand({}));
        if (SecretList && SecretList.length > 0) {
          model.secretsmanager = {
            count: SecretList.length,
            resources: SecretList.map((s) => ({ id: s.Name ?? "unknown" })),
          };
        }
      } catch {}
    })(),

    // API Gateway (REST APIs)
    (async () => {
      try {
        const apigw = new APIGatewayClient(cfg);
        const { items } = await apigw.send(new GetRestApisCommand({}));
        if (items && items.length > 0) {
          model.apigateway = {
            count: items.length,
            resources: items.map((api) => ({
              id: api.id ?? "unknown",
              name: api.name,
            })),
          };
        }
      } catch {}
    })(),

    // Kinesis
    (async () => {
      try {
        const kinesis = new KinesisClient(cfg);
        const { StreamNames } = await kinesis.send(new ListStreamsCommand({}));
        if (StreamNames && StreamNames.length > 0) {
          model.kinesis = {
            count: StreamNames.length,
            resources: StreamNames.map((name) => ({ id: name })),
          };
        }
      } catch {}
    })(),

    // Step Functions
    (async () => {
      try {
        const sfn = new SFNClient(cfg);
        const { stateMachines } = await sfn.send(new ListStateMachinesCommand({}));
        if (stateMachines && stateMachines.length > 0) {
          model.stepfunctions = {
            count: stateMachines.length,
            resources: stateMachines.map((sm) => ({ id: sm.name ?? "unknown" })),
          };
        }
      } catch {}
    })(),

    // EventBridge (only non-default event buses — "default" exists in every account)
    (async () => {
      try {
        const events = new EventBridgeClient(cfg);
        const { EventBuses } = await events.send(new ListEventBusesCommand({}));
        const custom = (EventBuses ?? []).filter((b) => b.Name && b.Name !== "default");
        if (custom.length > 0) {
          model.eventbridge = {
            count: custom.length,
            resources: custom.map((b) => ({ id: b.Name ?? "unknown" })),
          };
        }
      } catch {}
    })(),

    // Cognito user pools
    (async () => {
      try {
        const cognito = new CognitoIdentityProviderClient(cfg);
        const { UserPools } = await cognito.send(new ListUserPoolsCommand({ MaxResults: 50 }));
        if (UserPools && UserPools.length > 0) {
          model.cognito = {
            count: UserPools.length,
            resources: UserPools.map((p) => ({
              id: p.Id ?? "unknown",
              name: p.Name,
            })),
          };
        }
      } catch {}
    })(),

    // ECR
    (async () => {
      try {
        const ecr = new ECRClient(cfg);
        const { repositories } = await ecr.send(new DescribeRepositoriesCommand({}));
        if (repositories && repositories.length > 0) {
          model.ecr = {
            count: repositories.length,
            resources: repositories.map((repo) => ({ id: repo.repositoryName ?? "unknown" })),
          };
        }
      } catch {}
    })(),

    // OpenSearch
    (async () => {
      try {
        const opensearch = new OpenSearchClient(cfg);
        const { DomainNames } = await opensearch.send(new ListDomainNamesCommand({}));
        if (DomainNames && DomainNames.length > 0) {
          model.opensearch = {
            count: DomainNames.length,
            resources: DomainNames.filter((d) => d.DomainName).map((d) => ({ id: d.DomainName! })),
          };
        }
      } catch {}
    })(),

    // MSK (Managed Streaming for Kafka)
    (async () => {
      try {
        const kafka = new KafkaClient(cfg);
        const { ClusterInfoList } = await kafka.send(new ListMSKClustersCommand({}));
        if (ClusterInfoList && ClusterInfoList.length > 0) {
          model.msk = {
            count: ClusterInfoList.length,
            resources: ClusterInfoList.map((c) => ({ id: c.ClusterName ?? "unknown" })),
          };
        }
      } catch {}
    })(),

    // KMS
    (async () => {
      try {
        const kms = new KMSClient(cfg);
        const { Keys } = await kms.send(new ListKeysCommand({}));
        if (Keys && Keys.length > 0) {
          model.kms = {
            count: Keys.length,
            resources: Keys.map((k) => ({ id: k.KeyId ?? "unknown" })),
          };
        }
      } catch {}
    })(),

    // ACM (Certificate Manager is regional — querying primary region us-east-1 for CloudFront certs)
    (async () => {
      try {
        const acm = new ACMClient(globalCfg);
        const { CertificateSummaryList } = await acm.send(new ListCertificatesCommand({}));
        if (CertificateSummaryList && CertificateSummaryList.length > 0) {
          model.acm = {
            count: CertificateSummaryList.length,
            resources: CertificateSummaryList.map((c) => ({ id: c.DomainName ?? "unknown" })),
          };
        }
      } catch {}
    })(),

    // EFS
    (async () => {
      try {
        const efs = new EFSClient(cfg);
        const { FileSystems } = await efs.send(new DescribeFileSystemsCommand({}));
        if (FileSystems && FileSystems.length > 0) {
          model.efs = {
            count: FileSystems.length,
            resources: FileSystems.map((fs) => ({
              id: fs.FileSystemId ?? "unknown",
              extra: {
                state: fs.LifeCycleState?.toString() ?? "unknown",
                size: `${fs.SizeInBytes?.Value ?? 0} bytes`,
              },
            })),
          };
        }
      } catch {}
    })(),

    // FSx
    (async () => {
      try {
        const fsx = new FSxClient(cfg);
        const { FileSystems } = await fsx.send(new DescribeFSxCommand({}));
        if (FileSystems && FileSystems.length > 0) {
          model.fsx = {
            count: FileSystems.length,
            resources: FileSystems.map((fs) => ({
              id: fs.FileSystemId ?? "unknown",
              type: fs.FileSystemType?.toString(),
              extra: { state: fs.Lifecycle?.toString() ?? "unknown" },
            })),
          };
        }
      } catch {}
    })(),

    // Redshift
    (async () => {
      try {
        const redshift = new RedshiftClient(cfg);
        const { Clusters } = await redshift.send(new DescribeClustersCommand({}));
        if (Clusters && Clusters.length > 0) {
          model.redshift = {
            count: Clusters.length,
            resources: Clusters.map((c) => ({
              id: c.ClusterIdentifier ?? "unknown",
              extra: {
                status: c.ClusterStatus ?? "unknown",
                nodeType: c.NodeType ?? "unknown",
              },
            })),
          };
        }
      } catch {}
    })(),

    // DocumentDB
    (async () => {
      try {
        const docdb = new DocDBClient(cfg);
        const { DBClusters } = await docdb.send(new DescribeDBClustersCommand({}));
        if (DBClusters && DBClusters.length > 0) {
          model.docdb = {
            count: DBClusters.length,
            resources: DBClusters.map((c) => ({
              id: c.DBClusterIdentifier ?? "unknown",
              extra: {
                status: c.Status ?? "unknown",
                engine: c.Engine ?? "unknown",
              },
            })),
          };
        }
      } catch {}
    })(),

    // Neptune (shares Describe DB Clusters shape with DocDB; filter by engine=neptune)
    (async () => {
      try {
        const neptune = new NeptuneClient(cfg);
        const { DBClusters } = await neptune.send(new DescribeNeptuneCommand({}));
        const neptuneClusters = (DBClusters ?? []).filter((c) => (c.Engine ?? "").toLowerCase().includes("neptune"));
        if (neptuneClusters.length > 0) {
          model.neptune = {
            count: neptuneClusters.length,
            resources: neptuneClusters.map((c) => ({
              id: c.DBClusterIdentifier ?? "unknown",
              extra: {
                status: c.Status ?? "unknown",
                engine: c.Engine ?? "unknown",
              },
            })),
          };
        }
      } catch {}
    })(),

    // MemoryDB
    (async () => {
      try {
        const memorydb = new MemoryDBClient(cfg);
        const { Clusters } = await memorydb.send(new DescribeMemoryDBCommand({}));
        if (Clusters && Clusters.length > 0) {
          model.memorydb = {
            count: Clusters.length,
            resources: Clusters.map((c) => ({
              id: c.Name ?? "unknown",
              extra: {
                status: c.Status ?? "unknown",
                nodeType: c.NodeType ?? "unknown",
              },
            })),
          };
        }
      } catch {}
    })(),

    // Global Accelerator (global service — only available in us-west-2 endpoint)
    (async () => {
      try {
        const ga = new GlobalAcceleratorClient({ region: "us-west-2", credentials });
        const { Accelerators } = await ga.send(new ListAcceleratorsCommand({}));
        if (Accelerators && Accelerators.length > 0) {
          model.globalaccelerator = {
            count: Accelerators.length,
            resources: Accelerators.map((a) => ({
              id: a.Name ?? "unknown",
              extra: { status: a.Status?.toString() ?? "unknown" },
            })),
          };
        }
      } catch {}
    })(),

    // Network Firewall
    (async () => {
      try {
        const nfw = new NetworkFirewallClient(cfg);
        const { Firewalls } = await nfw.send(new ListFirewallsCommand({}));
        if (Firewalls && Firewalls.length > 0) {
          model.networkfirewall = {
            count: Firewalls.length,
            resources: Firewalls.map((f) => ({ id: f.FirewallName ?? "unknown" })),
          };
        }
      } catch {}
    })(),

    // WAFv2 (REGIONAL scope covers ALB/API Gateway/AppSync — CLOUDFRONT scope is separate)
    (async () => {
      try {
        const waf = new WAFV2Client(cfg);
        const { WebACLs } = await waf.send(new ListWebACLsCommand({ Scope: "REGIONAL" }));
        if (WebACLs && WebACLs.length > 0) {
          model.waf = {
            count: WebACLs.length,
            resources: WebACLs.map((w) => ({ id: w.Name ?? "unknown" })),
          };
        }
      } catch {}
    })(),

    // GuardDuty
    (async () => {
      try {
        const gd = new GuardDutyClient(cfg);
        const { DetectorIds } = await gd.send(new ListDetectorsCommand({}));
        if (DetectorIds && DetectorIds.length > 0) {
          model.guardduty = {
            count: DetectorIds.length,
            resources: DetectorIds.map((id) => ({ id })),
          };
        }
      } catch {}
    })(),

    // Kinesis Firehose
    (async () => {
      try {
        const firehose = new FirehoseClient(cfg);
        const { DeliveryStreamNames } = await firehose.send(new ListDeliveryStreamsCommand({}));
        if (DeliveryStreamNames && DeliveryStreamNames.length > 0) {
          model.firehose = {
            count: DeliveryStreamNames.length,
            resources: DeliveryStreamNames.map((name) => ({ id: name })),
          };
        }
      } catch {}
    })(),

    // App Runner
    (async () => {
      try {
        const apprunner = new AppRunnerClient(cfg);
        const { ServiceSummaryList } = await apprunner.send(new ListServicesCommand({}));
        if (ServiceSummaryList && ServiceSummaryList.length > 0) {
          model.apprunner = {
            count: ServiceSummaryList.length,
            resources: ServiceSummaryList.map((s) => ({
              id: s.ServiceName ?? "unknown",
              extra: { status: s.Status?.toString() ?? "unknown" },
            })),
          };
        }
      } catch {}
    })(),

    // Batch
    (async () => {
      try {
        const batch = new BatchClient(cfg);
        const { computeEnvironments } = await batch.send(new DescribeComputeEnvironmentsCommand({}));
        if (computeEnvironments && computeEnvironments.length > 0) {
          model.batch = {
            count: computeEnvironments.length,
            resources: computeEnvironments.map((ce) => ({
              id: ce.computeEnvironmentName ?? "unknown",
              extra: { state: ce.state?.toString() ?? "unknown" },
            })),
          };
        }
      } catch {}
    })(),

    // Elastic Beanstalk
    (async () => {
      try {
        const eb = new ElasticBeanstalkClient(cfg);
        const { Environments } = await eb.send(new DescribeEnvironmentsCommand({}));
        if (Environments && Environments.length > 0) {
          model.elasticbeanstalk = {
            count: Environments.length,
            resources: Environments.map((e) => ({
              id: e.EnvironmentName ?? "unknown",
              extra: {
                status: e.Status?.toString() ?? "unknown",
                health: e.Health?.toString() ?? "unknown",
              },
            })),
          };
        }
      } catch {}
    })(),

    // Lightsail
    (async () => {
      try {
        const lightsail = new LightsailClient(cfg);
        const { instances } = await lightsail.send(new GetInstancesCommand({}));
        if (instances && instances.length > 0) {
          model.lightsail = {
            count: instances.length,
            resources: instances.map((i) => ({
              id: i.name ?? "unknown",
              type: i.bundleId,
              extra: { state: i.state?.name ?? "unknown" },
            })),
          };
        }
      } catch {}
    })(),

    // API Gateway v2 (HTTP/WebSocket)
    (async () => {
      try {
        const apigwv2 = new ApiGatewayV2Client(cfg);
        const { Items } = await apigwv2.send(new GetApisCommand({}));
        if (Items && Items.length > 0) {
          model.apigatewayv2 = {
            count: Items.length,
            resources: Items.map((api) => ({
              id: api.Name ?? "unknown",
              type: api.ProtocolType?.toString(),
            })),
          };
        }
      } catch {}
    })(),

    // AppSync (GraphQL)
    (async () => {
      try {
        const appsync = new AppSyncClient(cfg);
        const { graphqlApis } = await appsync.send(new ListGraphqlApisCommand({}));
        if (graphqlApis && graphqlApis.length > 0) {
          model.appsync = {
            count: graphqlApis.length,
            resources: graphqlApis.map((api) => ({
              id: api.name ?? "unknown",
              type: api.authenticationType?.toString(),
            })),
          };
        }
      } catch {}
    })(),

    // Glue (Data Catalog databases)
    (async () => {
      try {
        const glue = new GlueClient(cfg);
        const { DatabaseList } = await glue.send(new GetDatabasesCommand({}));
        if (DatabaseList && DatabaseList.length > 0) {
          model.glue = {
            count: DatabaseList.length,
            resources: DatabaseList.map((d) => ({ id: d.Name ?? "unknown" })),
          };
        }
      } catch {}
    })(),

    // Athena (skip the default "primary" workgroup which exists in every account)
    (async () => {
      try {
        const athena = new AthenaClient(cfg);
        const { WorkGroups } = await athena.send(new ListWorkGroupsCommand({}));
        const custom = (WorkGroups ?? []).filter((w) => w.Name && w.Name !== "primary");
        if (custom.length > 0) {
          model.athena = {
            count: custom.length,
            resources: custom.map((w) => ({ id: w.Name ?? "unknown" })),
          };
        }
      } catch {}
    })(),

    // EMR (only RUNNING or WAITING clusters — ignore terminated history)
    (async () => {
      try {
        const emr = new EMRClient(cfg);
        const { Clusters } = await emr.send(new ListEMRClustersCommand({ ClusterStates: ["RUNNING", "WAITING"] }));
        if (Clusters && Clusters.length > 0) {
          model.emr = {
            count: Clusters.length,
            resources: Clusters.map((c) => ({ id: c.Name ?? "unknown" })),
          };
        }
      } catch {}
    })(),

    // SageMaker endpoints (production inference endpoints)
    (async () => {
      try {
        const sagemaker = new SageMakerClient(cfg);
        const { Endpoints } = await sagemaker.send(new ListEndpointsCommand({}));
        if (Endpoints && Endpoints.length > 0) {
          model.sagemaker = {
            count: Endpoints.length,
            resources: Endpoints.map((e) => ({
              id: e.EndpointName ?? "unknown",
              extra: { status: e.EndpointStatus?.toString() ?? "unknown" },
            })),
          };
        }
      } catch {}
    })(),

    // Bedrock (presence of foundation models indicates the service is enabled in this region)
    (async () => {
      try {
        const bedrock = new BedrockClient({ region: "us-east-1", credentials });
        const { modelSummaries } = await bedrock.send(new ListFoundationModelsCommand({}));
        if (modelSummaries && modelSummaries.length > 0) {
          model.bedrock = {
            count: modelSummaries.length,
            resources: modelSummaries.slice(0, 10).map((m) => ({ id: m.modelId ?? "unknown" })),
          };
        }
      } catch {}
    })(),

    // CodeBuild
    (async () => {
      try {
        const codebuild = new CodeBuildClient(cfg);
        const { projects } = await codebuild.send(new ListProjectsCommand({}));
        if (projects && projects.length > 0) {
          model.codebuild = {
            count: projects.length,
            resources: projects.map((name) => ({ id: name })),
          };
        }
      } catch {}
    })(),

    // CodePipeline
    (async () => {
      try {
        const codepipeline = new CodePipelineClient(cfg);
        const { pipelines } = await codepipeline.send(new ListPipelinesCommand({}));
        if (pipelines && pipelines.length > 0) {
          model.codepipeline = {
            count: pipelines.length,
            resources: pipelines.map((p) => ({ id: p.name ?? "unknown" })),
          };
        }
      } catch {}
    })(),

    // CloudFormation (active stacks only)
    (async () => {
      try {
        const cf = new CloudFormationClient(cfg);
        const { StackSummaries } = await cf.send(new ListStacksCommand({
          StackStatusFilter: ["CREATE_COMPLETE", "UPDATE_COMPLETE"],
        }));
        if (StackSummaries && StackSummaries.length > 0) {
          model.cloudformation = {
            count: StackSummaries.length,
            resources: StackSummaries.map((s) => ({ id: s.StackName ?? "unknown" })),
          };
        }
      } catch {}
    })(),

    // CloudWatch alarms (cap at 50 to keep the initial scan fast)
    (async () => {
      try {
        const cw = new CloudWatchClient(cfg);
        const { MetricAlarms } = await cw.send(new DescribeAlarmsCommand({ MaxRecords: 50 }));
        if (MetricAlarms && MetricAlarms.length > 0) {
          model.cloudwatch = {
            count: MetricAlarms.length,
            resources: MetricAlarms.map((a) => ({ id: a.AlarmName ?? "unknown" })),
          };
        }
      } catch {}
    })(),

    // Systems Manager (managed instances)
    (async () => {
      try {
        const ssm = new SSMClient(cfg);
        const { InstanceInformationList } = await ssm.send(new DescribeInstanceInformationCommand({}));
        if (InstanceInformationList && InstanceInformationList.length > 0) {
          model.ssm = {
            count: InstanceInformationList.length,
            resources: InstanceInformationList.map((i) => ({ id: i.InstanceId ?? "unknown" })),
          };
        }
      } catch {}
    })(),

    // AWS Backup
    (async () => {
      try {
        const backup = new BackupClient(cfg);
        const { BackupPlansList } = await backup.send(new ListBackupPlansCommand({}));
        if (BackupPlansList && BackupPlansList.length > 0) {
          model.backup = {
            count: BackupPlansList.length,
            resources: BackupPlansList.map((p) => ({ id: p.BackupPlanName ?? "unknown" })),
          };
        }
      } catch {}
    })(),

    // Transfer Family (ListedServer shape doesn't include Protocols — requires a follow-up DescribeServer call)
    (async () => {
      try {
        const transfer = new TransferClient(cfg);
        const { Servers } = await transfer.send(new ListServersCommand({}));
        if (Servers && Servers.length > 0) {
          model.transfer = {
            count: Servers.length,
            resources: Servers.map((s) => ({
              id: s.ServerId ?? "unknown",
              extra: { state: s.State?.toString() ?? "unknown" },
            })),
          };
        }
      } catch {}
    })(),

    // IoT (things — cap at 50 for initial scan)
    (async () => {
      try {
        const iot = new IoTClient(cfg);
        const { things } = await iot.send(new ListThingsCommand({ maxResults: 50 }));
        if (things && things.length > 0) {
          model.iot = {
            count: things.length,
            resources: things.map((t) => ({ id: t.thingName ?? "unknown" })),
          };
        }
      } catch {}
    })(),

    // Rekognition collections
    (async () => {
      try {
        const rekognition = new RekognitionClient(cfg);
        const { CollectionIds } = await rekognition.send(new ListCollectionsCommand({}));
        if (CollectionIds && CollectionIds.length > 0) {
          model.rekognition = {
            count: CollectionIds.length,
            resources: CollectionIds.map((id) => ({ id })),
          };
        }
      } catch {}
    })(),

    // SES (global-ish — us-east-1 is the primary identity store)
    (async () => {
      try {
        const ses = new SESClient(globalCfg);
        const { Identities } = await ses.send(new ListIdentitiesCommand({ IdentityType: "Domain" }));
        if (Identities && Identities.length > 0) {
          model.ses = {
            count: Identities.length,
            resources: Identities.map((id) => ({ id })),
          };
        }
      } catch {}
    })(),

    // Connect (contact center instances)
    (async () => {
      try {
        const connect = new ConnectClient(cfg);
        const { InstanceSummaryList } = await connect.send(new ListInstancesCommand({}));
        if (InstanceSummaryList && InstanceSummaryList.length > 0) {
          model.connect = {
            count: InstanceSummaryList.length,
            resources: InstanceSummaryList.map((i) => ({
              id: i.InstanceAlias ?? i.Id ?? "unknown",
              extra: { status: i.InstanceStatus?.toString() ?? "unknown" },
            })),
          };
        }
      } catch {}
    })(),

    // Amazon MQ
    (async () => {
      try {
        const mq = new MqClient(cfg);
        const { BrokerSummaries } = await mq.send(new ListBrokersCommand({}));
        if (BrokerSummaries && BrokerSummaries.length > 0) {
          model.mq = {
            count: BrokerSummaries.length,
            resources: BrokerSummaries.map((b) => ({
              id: b.BrokerName ?? "unknown",
              extra: { state: b.BrokerState?.toString() ?? "unknown" },
            })),
          };
        }
      } catch {}
    })(),

    // Pinpoint (marketing/engagement apps)
    (async () => {
      try {
        const pinpoint = new PinpointClient(cfg);
        const { ApplicationsResponse } = await pinpoint.send(new GetAppsCommand({}));
        const items = ApplicationsResponse?.Item ?? [];
        if (items.length > 0) {
          model.pinpoint = {
            count: items.length,
            resources: items.map((a) => ({ id: a.Name ?? a.Id ?? "unknown" })),
          };
        }
      } catch {}
    })(),

    // -----------------------------------------------------------------------
    // Expanded service coverage — each probe is best-effort and silently
    // swallows errors (missing permissions, unsupported regions, disabled
    // services). A service only surfaces in the model if it actually has
    // resources to report, keeping the final payload concise.
    // -----------------------------------------------------------------------

    // CloudTrail (audit trails)
    (async () => {
      try {
        const client = new CloudTrailClient(cfg);
        const { Trails } = await client.send(new ListTrailsCommand({}));
        if (Trails && Trails.length > 0) {
          model.cloudtrail = {
            count: Trails.length,
            resources: Trails.map((t) => ({ id: t.Name ?? "unknown" })),
          };
        }
      } catch {}
    })(),

    // AWS Config (configuration recorders)
    (async () => {
      try {
        const client = new ConfigServiceClient(cfg);
        const { ConfigurationRecorders } = await client.send(new DescribeConfigurationRecordersCommand({}));
        if (ConfigurationRecorders && ConfigurationRecorders.length > 0) {
          model.config = {
            count: ConfigurationRecorders.length,
            resources: ConfigurationRecorders.map((r) => ({ id: r.name ?? "unknown" })),
          };
        }
      } catch {}
    })(),

    // Security Hub (DescribeHub returns the single hub ARN if enabled)
    (async () => {
      try {
        const client = new SecurityHubClient(cfg);
        const resp = await client.send(new DescribeHubCommand({}));
        if (resp.HubArn) {
          model.securityhub = {
            count: 1,
            resources: [{ id: resp.HubArn }],
          };
        }
      } catch {}
    })(),

    // Macie2 (member accounts)
    (async () => {
      try {
        const client = new Macie2Client(cfg);
        const { members } = await client.send(new ListMacieMembersCommand({}));
        if (members && members.length > 0) {
          model.macie = {
            count: members.length,
            resources: members.map((m) => ({ id: m.accountId ?? "unknown" })),
          };
        }
      } catch {}
    })(),

    // Inspector2 (coverage entries indicate resources enrolled in scanning)
    (async () => {
      try {
        const client = new Inspector2Client(cfg);
        const { coveredResources } = await client.send(new ListCoverageCommand({ maxResults: 50 }));
        if (coveredResources && coveredResources.length > 0) {
          model.inspector = {
            count: coveredResources.length,
            resources: coveredResources.slice(0, 50).map((c) => ({ id: c.resourceId ?? "unknown", type: c.resourceType?.toString() })),
          };
        }
      } catch {}
    })(),

    // IAM Identity Center (SSO) — global-ish, probe from us-east-1
    (async () => {
      try {
        const client = new SSOAdminClient(globalCfg);
        const { Instances } = await client.send(new ListSSOInstancesCommand({}));
        if (Instances && Instances.length > 0) {
          model.identitycenter = {
            count: Instances.length,
            resources: Instances.map((i) => ({ id: i.InstanceArn ?? "unknown" })),
          };
        }
      } catch {}
    })(),

    // Directory Service
    (async () => {
      try {
        const client = new DirectoryServiceClient(cfg);
        const { DirectoryDescriptions } = await client.send(new DescribeDirectoriesCommand({}));
        if (DirectoryDescriptions && DirectoryDescriptions.length > 0) {
          model.directoryservice = {
            count: DirectoryDescriptions.length,
            resources: DirectoryDescriptions.map((d) => ({
              id: d.DirectoryId ?? "unknown",
              name: d.Name,
              extra: { type: d.Type?.toString() ?? "unknown" },
            })),
          };
        }
      } catch {}
    })(),

    // Organizations (list member accounts)
    (async () => {
      try {
        const client = new OrganizationsClient(globalCfg);
        const { Accounts } = await client.send(new ListAccountsCommand({}));
        if (Accounts && Accounts.length > 0) {
          model.organizations = {
            count: Accounts.length,
            resources: Accounts.slice(0, 50).map((a) => ({ id: a.Id ?? "unknown", name: a.Name })),
          };
        }
      } catch {}
    })(),

    // CodeCommit
    (async () => {
      try {
        const client = new CodeCommitClient(cfg);
        const { repositories } = await client.send(new ListRepositoriesCommand({}));
        if (repositories && repositories.length > 0) {
          model.codecommit = {
            count: repositories.length,
            resources: repositories.map((r) => ({ id: r.repositoryName ?? "unknown" })),
          };
        }
      } catch {}
    })(),

    // CodeDeploy
    (async () => {
      try {
        const client = new CodeDeployClient(cfg);
        const { applications } = await client.send(new ListApplicationsCommand({}));
        if (applications && applications.length > 0) {
          model.codedeploy = {
            count: applications.length,
            resources: applications.map((name) => ({ id: name })),
          };
        }
      } catch {}
    })(),

    // CodeArtifact
    (async () => {
      try {
        const client = new CodeartifactClient(cfg);
        const { domains } = await client.send(new ListCodeartifactDomainsCommand({}));
        if (domains && domains.length > 0) {
          model.codeartifact = {
            count: domains.length,
            resources: domains.map((d) => ({ id: d.name ?? "unknown" })),
          };
        }
      } catch {}
    })(),

    // IoT Events
    (async () => {
      try {
        const client = new IoTEventsClient(cfg);
        const { detectorModelSummaries } = await client.send(new ListDetectorModelsCommand({}));
        if (detectorModelSummaries && detectorModelSummaries.length > 0) {
          model.iotevents = {
            count: detectorModelSummaries.length,
            resources: detectorModelSummaries.map((d) => ({ id: d.detectorModelName ?? "unknown" })),
          };
        }
      } catch {}
    })(),

    // IoT SiteWise
    (async () => {
      try {
        const client = new IoTSiteWiseClient(cfg);
        const { assetSummaries } = await client.send(new ListAssetsCommand({}));
        if (assetSummaries && assetSummaries.length > 0) {
          model.iotsitewise = {
            count: assetSummaries.length,
            resources: assetSummaries.slice(0, 50).map((a) => ({ id: a.name ?? a.id ?? "unknown" })),
          };
        }
      } catch {}
    })(),

    // Greengrass v2
    (async () => {
      try {
        const client = new GreengrassV2Client(cfg);
        const { components } = await client.send(new ListComponentsCommand({}));
        if (components && components.length > 0) {
          model.greengrass = {
            count: components.length,
            resources: components.map((c) => ({ id: c.componentName ?? "unknown" })),
          };
        }
      } catch {}
    })(),

    // Amplify
    (async () => {
      try {
        const client = new AmplifyClient(cfg);
        const { apps } = await client.send(new ListAppsCommand({}));
        if (apps && apps.length > 0) {
          model.amplify = {
            count: apps.length,
            resources: apps.map((a) => ({ id: a.name ?? a.appId ?? "unknown" })),
          };
        }
      } catch {}
    })(),

    // License Manager
    (async () => {
      try {
        const client = new LicenseManagerClient(cfg);
        const { Licenses } = await client.send(new ListLicensesCommand({}));
        if (Licenses && Licenses.length > 0) {
          model.licensemanager = {
            count: Licenses.length,
            resources: Licenses.slice(0, 50).map((l) => ({ id: l.LicenseName ?? l.LicenseArn ?? "unknown" })),
          };
        }
      } catch {}
    })(),

    // Direct Connect
    (async () => {
      try {
        const client = new DirectConnectClient(cfg);
        const { connections } = await client.send(new DescribeConnectionsCommand({}));
        if (connections && connections.length > 0) {
          model.directconnect = {
            count: connections.length,
            resources: connections.map((c) => ({ id: c.connectionName ?? c.connectionId ?? "unknown" })),
          };
        }
      } catch {}
    })(),

    // Auto Scaling (EC2)
    (async () => {
      try {
        const client = new AutoScalingClient(cfg);
        const { AutoScalingGroups } = await client.send(new DescribeAutoScalingGroupsCommand({}));
        if (AutoScalingGroups && AutoScalingGroups.length > 0) {
          model.autoscaling = {
            count: AutoScalingGroups.length,
            resources: AutoScalingGroups.slice(0, 50).map((g) => ({ id: g.AutoScalingGroupName ?? "unknown" })),
          };
        }
      } catch {}
    })(),

    // CloudWatch Logs (log groups)
    (async () => {
      try {
        const client = new CloudWatchLogsClient(cfg);
        const { logGroups } = await client.send(new DescribeLogGroupsCommand({ limit: 50 }));
        if (logGroups && logGroups.length > 0) {
          model.cloudwatchlogs = {
            count: logGroups.length,
            resources: logGroups.slice(0, 50).map((g) => ({ id: g.logGroupName ?? "unknown" })),
          };
        }
      } catch {}
    })(),

    // Kendra
    (async () => {
      try {
        const client = new KendraClient(cfg);
        const { IndexConfigurationSummaryItems } = await client.send(new ListIndicesCommand({}));
        if (IndexConfigurationSummaryItems && IndexConfigurationSummaryItems.length > 0) {
          model.kendra = {
            count: IndexConfigurationSummaryItems.length,
            resources: IndexConfigurationSummaryItems.map((i) => ({ id: i.Name ?? i.Id ?? "unknown" })),
          };
        }
      } catch {}
    })(),

    // Comprehend (NLP jobs)
    (async () => {
      try {
        const client = new ComprehendClient(cfg);
        const { EntitiesDetectionJobPropertiesList } = await client.send(new ListEntitiesDetectionJobsCommand({}));
        if (EntitiesDetectionJobPropertiesList && EntitiesDetectionJobPropertiesList.length > 0) {
          model.comprehend = {
            count: EntitiesDetectionJobPropertiesList.length,
            resources: EntitiesDetectionJobPropertiesList.slice(0, 20).map((j) => ({ id: j.JobName ?? j.JobId ?? "unknown" })),
          };
        }
      } catch {}
    })(),

    // IoT Analytics
    (async () => {
      try {
        const client = new IoTAnalyticsClient(cfg);
        const { channelSummaries } = await client.send(new ListIoTAnalyticsChannelsCommand({}));
        if (channelSummaries && channelSummaries.length > 0) {
          model.iotanalytics = {
            count: channelSummaries.length,
            resources: channelSummaries.map((c) => ({ id: c.channelName ?? "unknown" })),
          };
        }
      } catch {}
    })(),

    // Keyspaces (managed Cassandra)
    (async () => {
      try {
        const client = new KeyspacesClient(cfg);
        const { keyspaces } = await client.send(new ListKeyspacesCommand({}));
        if (keyspaces && keyspaces.length > 0) {
          model.keyspaces = {
            count: keyspaces.length,
            resources: keyspaces.map((k) => ({ id: k.keyspaceName ?? k.resourceArn ?? "unknown" })),
          };
        }
      } catch {}
    })(),

    // Lex (chatbots)
    (async () => {
      try {
        const client = new LexModelsV2Client(cfg);
        const { botSummaries } = await client.send(new ListBotsCommand({}));
        if (botSummaries && botSummaries.length > 0) {
          model.lex = {
            count: botSummaries.length,
            resources: botSummaries.map((b) => ({ id: b.botName ?? b.botId ?? "unknown" })),
          };
        }
      } catch {}
    })(),

    // Shield (protections — Shield Advanced is global, probe us-east-1)
    (async () => {
      try {
        const client = new ShieldClient(globalCfg);
        const { Protections } = await client.send(new ListProtectionsCommand({}));
        if (Protections && Protections.length > 0) {
          model.shield = {
            count: Protections.length,
            resources: Protections.map((p) => ({ id: p.Name ?? p.Id ?? "unknown" })),
          };
        }
      } catch {}
    })(),

    // Textract (custom adapters)
    (async () => {
      try {
        const client = new TextractClient(cfg);
        const { Adapters } = await client.send(new ListAdaptersCommand({}));
        if (Adapters && Adapters.length > 0) {
          model.textract = {
            count: Adapters.length,
            resources: Adapters.map((a) => ({ id: a.AdapterName ?? a.AdapterId ?? "unknown" })),
          };
        }
      } catch {}
    })(),

    // Timestream (scheduled queries)
    (async () => {
      try {
        const client = new TimestreamQueryClient(cfg);
        const { ScheduledQueries } = await client.send(new ListScheduledQueriesCommand({}));
        if (ScheduledQueries && ScheduledQueries.length > 0) {
          model.timestream = {
            count: ScheduledQueries.length,
            resources: ScheduledQueries.map((q) => ({ id: q.Name ?? q.Arn ?? "unknown" })),
          };
        }
      } catch {}
    })(),

    // Transcribe (jobs)
    (async () => {
      try {
        const client = new TranscribeClient(cfg);
        const { TranscriptionJobSummaries } = await client.send(new ListTranscriptionJobsCommand({}));
        if (TranscriptionJobSummaries && TranscriptionJobSummaries.length > 0) {
          model.transcribe = {
            count: TranscriptionJobSummaries.length,
            resources: TranscriptionJobSummaries.slice(0, 20).map((j) => ({ id: j.TranscriptionJobName ?? "unknown" })),
          };
        }
      } catch {}
    })(),

    // Translate (jobs)
    (async () => {
      try {
        const client = new TranslateClient(cfg);
        const { TextTranslationJobPropertiesList } = await client.send(new ListTextTranslationJobsCommand({}));
        if (TextTranslationJobPropertiesList && TextTranslationJobPropertiesList.length > 0) {
          model.translate = {
            count: TextTranslationJobPropertiesList.length,
            resources: TextTranslationJobPropertiesList.slice(0, 20).map((j) => ({ id: j.JobName ?? j.JobId ?? "unknown" })),
          };
        }
      } catch {}
    })(),

    // X-Ray (tracing groups)
    (async () => {
      try {
        const client = new XRayClient(cfg);
        const { Groups } = await client.send(new GetGroupsCommand({}));
        if (Groups && Groups.length > 0) {
          model.xray = {
            count: Groups.length,
            resources: Groups.map((g) => ({ id: g.GroupName ?? g.GroupARN ?? "unknown" })),
          };
        }
      } catch {}
    })(),
  ]);

  // Merge PrivateLink consumer endpoints and provider endpoint services into a single
  // canonical bucket. Both use AWS PrivateLink and share the same Hetzner migration path.
  const privatelinkResources = [...privatelinkConsumers, ...privatelinkProviders];
  if (privatelinkResources.length > 0) {
    model.privatelink = {
      count: privatelinkResources.length,
      resources: privatelinkResources,
    };
  }

  return model;
}

// ---------------------------------------------------------------------------
// Scoring
// ---------------------------------------------------------------------------

function deriveEc2Match(detail: ServiceDetail): {
  match: "compatible" | "partial" | "none";
  notes: string;
  migrationEffort: "low" | "medium" | "high";
  migrationNotes: string[];
} {
  const types = detail.resources.map((r) => (r.type ?? "").toLowerCase());

  const gpuFamilies = ["p2", "p3", "p4", "g3", "g4", "g5", "inf1", "inf2", "trn1"];
  const incompatibleFamilies = ["f1", "mac1", "mac2"];
  const hasGpu = types.some((t) => gpuFamilies.some((f) => t.startsWith(f + ".")));
  const hasIncompatible = types.some((t) => incompatibleFamilies.some((f) => t.startsWith(f + ".")));

  if (hasIncompatible) {
    const found = types.filter((t) => incompatibleFamilies.some((f) => t.startsWith(f + ".")));
    return {
      match: "none",
      notes: `FPGA or Mac instance types detected (${[...new Set(found)].join(", ")}) — no equivalent on Hetzner.`,
      migrationEffort: "high",
      migrationNotes: [
        "FPGA (f1) and Mac (mac1/mac2) instance types have no Hetzner equivalent",
        "Re-architect FPGA workloads to software or use external FPGA cloud providers",
        "Mac build workloads may be replaced with self-hosted Tart/QEMU on ARM servers",
      ],
    };
  }

  if (hasGpu) {
    const found = types.filter((t) => gpuFamilies.some((f) => t.startsWith(f + ".")));
    return {
      match: "partial",
      notes: `GPU instance types detected (${[...new Set(found)].join(", ")}). Hetzner offers limited GPU servers (GX series).`,
      migrationEffort: "medium",
      migrationNotes: [
        "Hetzner GX2-8 and GX2-8 (A100/H100) available in beta — capacity limited",
        "Map p2/p3 → Hetzner GX or external GPU cloud (RunPod EU, CoreWeave EU)",
        "Inference workloads: consider CPU-optimised CCX with quantised models",
        "Check availability at: https://www.hetzner.com/gpu-servers",
      ],
    };
  }

  const families = [...new Set(types.map((t) => t.split(".")[0]))].filter(Boolean);
  return {
    match: "compatible",
    notes: `Standard instance types detected (${families.join(", ")}). Direct mapping to Hetzner CX/CCX servers available.`,
    migrationEffort: "low",
    migrationNotes: [
      "t2/t3 → CX22 (2 vCPU, 4 GB) or CX32 (4 vCPU, 8 GB)",
      "m5/m6i → CCX23 (4 vCPU, 16 GB, dedicated) or CCX33 (8 vCPU, 32 GB)",
      "c5/c6i → CCX23/CCX33 (dedicated CPU optimised)",
      "r5/r6i → CX52 (16 vCPU, 32 GB) or CCX63 for memory-heavy workloads",
      "Use Hetzner Terraform provider or Ansible for automated provisioning",
    ],
  };
}

function deriveS3Match(detail: ServiceDetail): {
  match: "compatible" | "partial" | "none";
  notes: string;
  migrationEffort: "low" | "medium" | "high";
  migrationNotes: string[];
} {
  const count = detail.count;
  return {
    match: "compatible",
    notes: `${count} S3 bucket${count !== 1 ? "s" : ""} detected. Hetzner Object Storage is S3-compatible — most SDKs work with an endpoint override.`,
    migrationEffort: "low",
    migrationNotes: [
      "Hetzner Object Storage uses the S3-compatible API — no SDK changes required",
      "Set endpoint to https://fsn1.your-objectstorage.com (Falkenstein) or nbg1/hel1",
      "Migrate data with rclone: `rclone copy s3:mybucket hetzner:mybucket`",
      "Lifecycle policies not supported — replace with external cron jobs if needed",
      "S3 event notifications → use polling or webhook-based alternatives",
      "No cross-region replication — single region storage only",
    ],
  };
}

function deriveLambdaMatch(detail: ServiceDetail): {
  match: "compatible" | "partial" | "none";
  notes: string;
  migrationEffort: "low" | "medium" | "high";
  migrationNotes: string[];
} {
  const runtimes = [...new Set(detail.resources.map((r) => r.type).filter(Boolean))];
  const runtimeStr = runtimes.length > 0 ? runtimes.join(", ") : "unknown runtime";
  return {
    match: "none",
    notes: `${detail.count} Lambda function${detail.count !== 1 ? "s" : ""} detected (${runtimeStr}). Hetzner has no FaaS offering — containerisation required.`,
    migrationEffort: "high",
    migrationNotes: [
      `Detected runtimes: ${runtimeStr}`,
      "Option 1: Package each function as a container and run on Hetzner Cloud Servers",
      "Option 2: Deploy self-hosted OpenFaaS or Knative on a Hetzner k3s cluster",
      "Option 3: Use Scaleway Functions (EU-based FaaS) as a drop-in alternative",
      "HTTP-triggered functions → convert to a lightweight HTTP server (Fastify/Express)",
      "Scheduled functions → replace with cron jobs or Ofelia scheduler",
      "Event-driven triggers (SQS, S3) → refactor to polling or webhook pattern",
    ],
  };
}

function deriveEcsMatch(detail: ServiceDetail): {
  match: "compatible" | "partial" | "none";
  notes: string;
  migrationEffort: "low" | "medium" | "high";
  migrationNotes: string[];
} {
  const clusterNames = detail.resources.map((r) => (r.id ?? "").toLowerCase());
  const likelyFargate = clusterNames.some((n) => n.includes("fargate") || n.includes("serverless"));

  if (likelyFargate) {
    return {
      match: "none",
      notes: `Fargate cluster(s) detected (${clusterNames.join(", ")}). No managed serverless containers on Hetzner.`,
      migrationEffort: "high",
      migrationNotes: [
        "No Fargate equivalent on Hetzner — requires self-managed orchestration",
        "Option 1: Migrate to self-managed k3s cluster on Hetzner Cloud Servers",
        "Option 2: Use Docker Swarm on Hetzner for simpler workloads",
        "Re-configure task definitions as Kubernetes Deployments or Docker Compose services",
        "Use Hetzner Load Balancers to expose services",
      ],
    };
  }

  return {
    match: "partial",
    notes: `${detail.count} ECS cluster${detail.count !== 1 ? "s" : ""} detected. EC2-based ECS tasks can be migrated to self-managed Docker or Kubernetes on Hetzner.`,
    migrationEffort: "medium",
    migrationNotes: [
      "EC2-based ECS clusters → Docker Swarm or k3s on Hetzner Cloud Servers",
      "Convert ECS task definitions to Docker Compose or Kubernetes manifests",
      "Use hetzner-k3s for fast Kubernetes provisioning",
      "ECR container images → migrate to GitHub Container Registry or self-hosted Harbor",
      "Use Hetzner Load Balancers for service exposure",
    ],
  };
}

function deriveRdsMatch(detail: ServiceDetail): {
  match: "compatible" | "partial" | "none";
  notes: string;
  migrationEffort: "low" | "medium" | "high";
  migrationNotes: string[];
} {
  const engines = detail.resources.map((r) => (r.extra?.engine ?? "").toLowerCase());

  const hasIncompatible = engines.some((e) => e.startsWith("oracle") || e.startsWith("sqlserver"));
  const hasAurora = engines.some((e) => e.startsWith("aurora"));
  const allNative = engines.every((e) => e.startsWith("postgres") || e.startsWith("mysql") || e.startsWith("mariadb"));

  if (hasIncompatible) {
    return {
      match: "none",
      notes: "Oracle or MSSQL detected — no equivalent on Hetzner. Self-hosting required.",
      migrationEffort: "high",
      migrationNotes: [
        "Oracle and MSSQL have no managed equivalent on Hetzner",
        "Option: self-host on a Hetzner Cloud Server",
        "Consider migrating to PostgreSQL if workload allows",
      ],
    };
  }

  if (hasAurora) {
    return {
      match: "partial",
      notes: "Aurora detected — Aurora-specific features (serverless, global DB) are not available on Hetzner Managed Databases.",
      migrationEffort: "medium",
      migrationNotes: [
        "Aurora PostgreSQL → Hetzner Managed PostgreSQL (compatible engine)",
        "Aurora Serverless → use fixed-size Hetzner DB instance",
        "Aurora Global Database → not available; plan for single-region",
        "Aurora auto-scaling → manual resizing on Hetzner",
      ],
    };
  }

  if (allNative) {
    const engineList = [...new Set(engines.map((e) => e.split(" ")[0]))].join(", ");
    return {
      match: "compatible",
      notes: `${engineList} is fully supported on Hetzner Managed Databases. Direct migration path available.`,
      migrationEffort: "low",
      migrationNotes: [
        "Use pg_dump / pg_restore or mysqldump for data migration",
        "Update connection strings to Hetzner endpoint",
        "Automated daily backups included",
        "Upgrade PostgreSQL version if needed — Hetzner supports PG 13–16",
      ],
    };
  }

  return HETZNER_CATALOG["rds"]!;
}

function scoreServices(model: CanonicalModel) {
  const results = Object.entries(model).map(([svc, detail]) => {
    const catalog = HETZNER_CATALOG[svc];
    if (!catalog) return null;

    // Resource-aware scoring — derive match from actual resource data
    let derived: ReturnType<typeof deriveRdsMatch> | null = null;
    if (svc === "ec2") derived = deriveEc2Match(detail);
    else if (svc === "rds") derived = deriveRdsMatch(detail);
    else if (svc === "s3") derived = deriveS3Match(detail);
    else if (svc === "lambda") derived = deriveLambdaMatch(detail);
    else if (svc === "ecs") derived = deriveEcsMatch(detail);

    return {
      service: svc,
      count: detail.count,
      resources: detail.resources,
      match: derived?.match ?? catalog.match,
      hetznerEquivalent: catalog.hetznerEquivalent,
      notes: derived?.notes ?? catalog.notes,
      migrationEffort: derived?.migrationEffort ?? catalog.migrationEffort,
      migrationNotes: derived?.migrationNotes ?? catalog.migrationNotes,
      hetznerDocs: catalog.hetznerDocs ?? null,
      weight: WEIGHTS[svc] ?? 1,
    };
  }).filter(Boolean) as Array<{
    service: string; count: number; resources: Resource[];
    match: string; hetznerEquivalent: string; notes: string;
    migrationEffort: string; migrationNotes: string[]; hetznerDocs: string | null; weight: number;
  }>;

  const totalWeight = results.reduce((s, r) => s + r.weight, 0);
  const weightedScore = results.reduce((s, r) => s + r.weight * (MATCH_SCORES[r.match] ?? 0), 0);
  const score = totalWeight > 0 ? Math.round(weightedScore / totalWeight) : 0;

  return { score, results };
}

// ---------------------------------------------------------------------------
// AI mapping
// ---------------------------------------------------------------------------

type ScoredResult = {
  service: string; count: number; resources: Resource[];
  match: string; hetznerEquivalent: string; notes: string;
  migrationEffort: string; migrationNotes: string[]; hetznerDocs: string | null; weight: number;
  aiMapping?: string;
};

async function addAiMappings(results: ScoredResult[], targetCloud: string): Promise<ScoredResult[]> {
  const anthropicKey = process.env.ANTHROPIC_API_KEY;
  const openaiKey = process.env.OPENAI_API_KEY;
  const openrouterKey = process.env.OPENROUTER_API_KEY;

  const mapped = await Promise.all(results.map(async (r) => {
    const resourceSummary = r.resources.length > 0
      ? r.resources.map((res) => {
          const parts = [res.name ?? res.id];
          if (res.type) parts.push(res.type);
          if (res.extra) parts.push(...Object.entries(res.extra).map(([k, v]) => `${k}: ${v}`));
          return parts.join(", ");
        }).join("\n")
      : `${r.count} resource(s) detected`;

    const prompt = `You are a cloud migration expert. A customer wants to migrate their AWS ${r.service.toUpperCase()} resources to ${targetCloud}.

DETECTED RESOURCES:
${resourceSummary}

COMPATIBILITY: ${r.match} — ${r.hetznerEquivalent}

Write 2-4 short, specific migration steps tailored to their exact resources. Reference their actual resource names/types. No headers, no preamble. Each step on its own line starting with "→".`;

    try {
      if (anthropicKey) {
        const res = await fetch("https://api.anthropic.com/v1/messages", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-api-key": anthropicKey,
            "anthropic-version": "2023-06-01",
          },
          body: JSON.stringify({
            model: "claude-haiku-4-5-20251001",
            max_tokens: 300,
            messages: [{ role: "user", content: prompt }],
          }),
        });
        if (!res.ok) {
          console.error(`[lens] Anthropic ${res.status} for ${r.service}:`, await res.text());
          return r;
        }
        const json = await res.json() as { content: { type: string; text: string }[] };
        const text = json.content?.find((b) => b.type === "text")?.text?.trim();
        return text ? { ...r, aiMapping: text } : r;
      }

      const apiKey = openaiKey ?? openrouterKey;
      if (!apiKey) return r;
      const isOpenRouter = !openaiKey && !!openrouterKey;
      const baseUrl = isOpenRouter ? "https://openrouter.ai/api/v1" : "https://api.openai.com/v1";
      const model = isOpenRouter ? (process.env.OPENROUTER_MODEL ?? "openai/gpt-4o-mini") : (process.env.OPENAI_MODEL ?? "gpt-4o-mini");

      const res = await fetch(`${baseUrl}/chat/completions`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
        body: JSON.stringify({ model, messages: [{ role: "user", content: prompt }], max_tokens: 250, temperature: 0.3 }),
      });
      if (!res.ok) {
        console.error(`[lens] OpenAI ${res.status} for ${r.service}:`, await res.text());
        return r;
      }
      const json = await res.json() as { choices: { message: { content: string } }[] };
      const text = json.choices?.[0]?.message?.content?.trim();
      return text ? { ...r, aiMapping: text } : r;
    } catch (e) {
      console.error(`[lens] AI mapping failed for ${r.service}:`, e);
      return r;
    }
  }));
  return mapped;
}

// ---------------------------------------------------------------------------
// Route handler
// ---------------------------------------------------------------------------

export async function POST(request: Request) {
  const { session, error } = await requireApiAuth();
  if (error) return error;

  const body = await request.json() as { targetCloud: string; inputMethod: string; roleArn: string };
  const { targetCloud, inputMethod, roleArn } = body;

  const userId = session.user.id;
  const organizationId = session.session.activeOrganizationId ?? "";

  // Quota check
  const lensPlan = await getOrgLensPlan(organizationId);
  const monthlyLimit = LENS_MONTHLY_LIMITS[lensPlan];
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);
  const usageRows = await lensDb
    .select({ value: count() })
    .from(lensAnalysis)
    .where(and(eq(lensAnalysis.organizationId, organizationId), gte(lensAnalysis.createdAt, startOfMonth)));
  const usedThisMonth = usageRows[0]?.value ?? 0;
  if (usedThisMonth >= monthlyLimit) {
    return Response.json(
      { error: "Monthly analysis limit reached.", plan: lensPlan, limit: monthlyLimit },
      { status: 402 }
    );
  }

  const [record] = await lensDb
    .insert(lensAnalysis)
    .values({ userId, organizationId, targetCloud, inputMethod, status: "running" })
    .returning({ id: lensAnalysis.id });

  const analysisId = record!.id;

  void (async () => {
    try {
      const sts = new STSClient({ region: REGION });
      const assumed = await sts.send(new AssumeRoleCommand({
        RoleArn: roleArn,
        RoleSessionName: "noblinks-lens",
        ExternalId: EXTERNAL_ID,
        DurationSeconds: 900,
      }));

      const creds = {
        accessKeyId: assumed.Credentials!.AccessKeyId!,
        secretAccessKey: assumed.Credentials!.SecretAccessKey!,
        sessionToken: assumed.Credentials!.SessionToken!,
      };

      const model = await enumerateServices(creds);
      const { score, results } = scoreServices(model);
      const enrichedResults = await addAiMappings(results, targetCloud);
      const complianceFlags = runComplianceEngine(Object.keys(model));

      await lensDb
        .update(lensAnalysis)
        .set({
          status: "complete",
          canonicalModel: model,
          matchResults: enrichedResults,
          scoringResult: { score, totalServices: Object.keys(model).length },
          complianceFlags,
          report: { targetCloud, score, results: enrichedResults, complianceFlags, generatedAt: new Date().toISOString() },
        })
        .where(eq(lensAnalysis.id, analysisId));
    } catch (err) {
      await lensDb
        .update(lensAnalysis)
        .set({ status: "failed", errorMessage: err instanceof Error ? err.message : "Unknown error" })
        .where(eq(lensAnalysis.id, analysisId));
    }
  })();

  return Response.json({ id: analysisId });
}
