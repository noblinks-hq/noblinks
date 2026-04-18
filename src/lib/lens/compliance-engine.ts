// Compliance Engine — deterministic, no AI.
// All rules are based on service presence/absence + provider origin.
// AI is NOT involved here. Flags are factual, legally referenced.

export type ComplianceRegulation =
  | "cloud_act"
  | "gdpr"
  | "schrems2"
  | "eu_ai_act"
  | "nis2"
  | "sovereignty";

export type ComplianceSeverity = "critical" | "warning" | "info";

export interface ComplianceFlag {
  id: string;
  regulation: ComplianceRegulation;
  severity: ComplianceSeverity;
  title: string;
  description: string;
  legalReference: string;
  remediation: string;
  precedent?: string;
  triggeredBy: string[];
}

interface ComplianceRule {
  id: string;
  regulation: ComplianceRegulation;
  severity: ComplianceSeverity;
  title: string;
  description: string;
  legalReference: string;
  remediation: string;
  precedent?: string;
  // Returns matched service keys, or null/empty if rule does not apply.
  // `detected` is the full set of detected service keys.
  evaluate: (detected: Set<string>) => string[];
}

// ---------------------------------------------------------------------------
// Helper
// ---------------------------------------------------------------------------

function any(detected: Set<string>, keys: string[]): string[] {
  return keys.filter((k) => detected.has(k));
}

function absent(detected: Set<string>, keys: string[]): boolean {
  return keys.every((k) => !detected.has(k));
}

// ---------------------------------------------------------------------------
// Rule definitions
// ---------------------------------------------------------------------------

const RULES: ComplianceRule[] = [
  // ─── CLOUD Act ───────────────────────────────────────────────────────────

  {
    id: "cloud_act_us_provider",
    regulation: "cloud_act",
    severity: "critical",
    title: "CLOUD Act exposure — all AWS services subject to US government access",
    description:
      "All detected services run on AWS, a US-incorporated provider. The US CLOUD Act (18 U.S.C. §2713) compels US companies to disclose customer data to US authorities on demand, regardless of where data is physically stored. AWS Frankfurt, AWS EU Sovereign, and similar 'EU' offerings do not protect against this law.",
    legalReference: "US CLOUD Act, 18 U.S.C. §2713 (2018)",
    remediation:
      "Migrate to an EU-incorporated provider (Hetzner, OVHcloud, Scaleway, IONOS, Exoscale, UpCloud, Open Telekom Cloud). EU regions of US providers do not resolve CLOUD Act exposure.",
    precedent:
      "Microsoft blocked ICC prosecutor accounts under US sanctions (2025). This is documented precedent for how the kill-switch mechanism works in practice.",
    evaluate: (detected) => {
      // Always triggers if any AWS service is detected — they are all AWS.
      const services = Array.from(detected);
      return services.length > 0 ? services.slice(0, 5) : [];
    },
  },

  {
    id: "cloud_act_primary_data_stores",
    regulation: "cloud_act",
    severity: "critical",
    title: "Primary data stores under CLOUD Act jurisdiction",
    description:
      "Database and object storage services containing customer or operational data are hosted on US infrastructure subject to the CLOUD Act. These services are the highest-risk assets in a compelled disclosure scenario.",
    legalReference: "US CLOUD Act, 18 U.S.C. §2713; GDPR Article 44",
    remediation:
      "Prioritise migrating databases and object storage to EU-incorporated providers first. This reduces your primary data exposure even before full migration is complete.",
    evaluate: (detected) =>
      any(detected, ["rds", "dynamodb", "s3", "docdb", "neptune", "redshift", "elasticache", "memorydb", "keyspaces", "timestream", "opensearch"]),
  },

  // ─── GDPR / Schrems II ───────────────────────────────────────────────────

  {
    id: "gdpr_identity_data_us_provider",
    regulation: "gdpr",
    severity: "critical",
    title: "EU citizen identity data stored with US provider",
    description:
      "Amazon Cognito is detected. This service stores authentication credentials, email addresses, and potentially personal attributes of your EU users with a US-incorporated provider. Under GDPR Article 44, transferring personal data outside the EEA requires adequate safeguards. Standard Contractual Clauses (SCCs) are insufficient when the recipient is subject to the CLOUD Act.",
    legalReference: "GDPR Article 44; Schrems II (CJEU C-311/18, 2020)",
    remediation:
      "Migrate authentication to an EU-hosted identity provider: Keycloak (self-hosted), Authentik, or an EU-incorporated IDaaS provider. This is typically a medium-effort migration with SDK compatibility layers available.",
    evaluate: (detected) => any(detected, ["cognito"]),
  },

  {
    id: "schrems2_transfer_without_safeguards",
    regulation: "schrems2",
    severity: "critical",
    title: "Personal data transfer to third country without adequate safeguards",
    description:
      "Services storing or processing EU personal data are operated by a US-incorporated entity. Following Schrems II (CJEU 2020), the Privacy Shield framework was invalidated. While Standard Contractual Clauses remain available, their effectiveness is undermined when the recipient is subject to US mass surveillance laws including FISA §702 and the CLOUD Act.",
    legalReference: "Schrems II (CJEU C-311/18, 2020); GDPR Article 46; EDPB Recommendations 01/2020",
    remediation:
      "Transfer impact assessment (TIA) required. Where adequate safeguards cannot be demonstrated, data must be processed within the EU by an EU-incorporated provider. Consult your DPO before the next scheduled scan.",
    evaluate: (detected) =>
      any(detected, ["rds", "s3", "dynamodb", "cognito", "ses", "sqs", "sns", "kinesis"]),
  },

  {
    id: "gdpr_no_audit_trail",
    regulation: "gdpr",
    severity: "warning",
    title: "No audit logging detected — GDPR Article 30 compliance at risk",
    description:
      "AWS CloudTrail was not detected. Without comprehensive audit logging, it is not possible to demonstrate GDPR Article 30 compliance (records of processing activities) or detect and report data breaches within the 72-hour window required by GDPR Article 33.",
    legalReference: "GDPR Article 30 (records of processing); GDPR Article 33 (breach notification)",
    remediation:
      "Enable AWS CloudTrail in all regions with log file validation and S3 encryption. Ensure logs are retained for at least 12 months. When migrating, select an EU cloud that provides equivalent audit logging.",
    evaluate: (detected) => (absent(detected, ["cloudtrail"]) ? ["cloudtrail (absent)"] : []),
  },

  {
    id: "gdpr_object_storage_residency",
    regulation: "gdpr",
    severity: "warning",
    title: "Object storage detected — verify data residency and replication settings",
    description:
      "Amazon S3 buckets are detected. S3 does not restrict data to a single region by default — cross-region replication or S3 Transfer Acceleration may cause personal data to leave the EU. Additionally, all S3 data is accessible to US authorities via the CLOUD Act regardless of the bucket's region.",
    legalReference: "GDPR Article 44; GDPR Article 46",
    remediation:
      "Audit S3 bucket replication rules. Disable cross-region replication to US regions for buckets containing personal data. For true data residency, migrate to EU-sovereign object storage (Hetzner Object Storage, OVH Object Storage, Scaleway Object Storage — all S3-compatible).",
    evaluate: (detected) => any(detected, ["s3"]),
  },

  {
    id: "gdpr_automated_processing",
    regulation: "gdpr",
    severity: "warning",
    title: "Automated decision-making detected — GDPR Article 22 obligations apply",
    description:
      "AI/ML services capable of automated decision-making are detected. GDPR Article 22 gives individuals the right not to be subject to solely automated decisions with significant effects. Where these services process EU personal data, explicit consent or a legal basis must be documented, and meaningful human review mechanisms must exist.",
    legalReference: "GDPR Article 22 (automated individual decision-making); GDPR Recital 71",
    remediation:
      "Document the legal basis for each automated processing activity. Implement human review mechanisms for high-impact decisions. Ensure model inference logs remain within EU jurisdiction.",
    evaluate: (detected) => any(detected, ["comprehend", "lex", "kendra", "rekognition", "sagemaker"]),
  },

  // ─── EU AI Act ───────────────────────────────────────────────────────────

  {
    id: "eu_ai_act_biometric_processing",
    regulation: "eu_ai_act",
    severity: "critical",
    title: "Biometric processing detected — High-risk AI system under EU AI Act",
    description:
      "Amazon Rekognition is detected. This service performs biometric identification and facial recognition, placing it in the high-risk category under EU AI Act Annex III. High-risk AI systems require a conformity assessment, registration in the EU AI Act database, and ongoing monitoring. Real-time remote biometric identification in public spaces is prohibited with narrow exceptions.",
    legalReference: "EU AI Act Article 6 and Annex III; EU AI Act Articles 9–16 (high-risk obligations)",
    remediation:
      "Conduct a conformity assessment for Rekognition use cases. If biometric identification of individuals in public spaces is performed, this is likely prohibited. Consider self-hosted open-source alternatives (DeepFace, Dlib) under your own EU infrastructure to maintain control over model behaviour.",
    evaluate: (detected) => any(detected, ["rekognition"]),
  },

  {
    id: "eu_ai_act_general_purpose_ai",
    regulation: "eu_ai_act",
    severity: "warning",
    title: "General-purpose AI system detected — EU AI Act transparency obligations",
    description:
      "Amazon Bedrock (foundation models) is detected. General-purpose AI models above a compute threshold are subject to EU AI Act obligations including model documentation, capability reporting, and copyright compliance measures. When integrated into downstream applications, systemic risk assessment may be required.",
    legalReference: "EU AI Act Chapter V (general-purpose AI models); EU AI Act Article 53",
    remediation:
      "Document use of foundation models and assess downstream application risk levels. Ensure model providers supply technical documentation per Article 53. Consider EU-hosted open-source model alternatives (Mistral, Llama via EU provider) for workloads requiring stronger data sovereignty.",
    evaluate: (detected) => any(detected, ["bedrock"]),
  },

  {
    id: "eu_ai_act_ml_platform",
    regulation: "eu_ai_act",
    severity: "warning",
    title: "ML training platform detected — AI system obligations may apply",
    description:
      "Amazon SageMaker is detected. Models trained or deployed on SageMaker may constitute AI systems under the EU AI Act, depending on their use case. High-risk applications (credit scoring, hiring, medical devices, critical infrastructure) require conformity assessments. Training data and model weights processed by SageMaker are under US jurisdiction via the CLOUD Act.",
    legalReference: "EU AI Act Article 6 and Annex III; EU AI Act Article 9 (risk management)",
    remediation:
      "Classify each SageMaker use case against EU AI Act Annex III risk categories. For high-risk classifications, initiate conformity assessment. For sovereignty, consider migrating model training to EU-hosted infrastructure (OVHcloud AI Training, Scaleway GPU instances).",
    evaluate: (detected) => any(detected, ["sagemaker"]),
  },

  {
    id: "eu_ai_act_language_processing",
    regulation: "eu_ai_act",
    severity: "info",
    title: "Language AI services processing potential EU citizen data",
    description:
      "Text analysis, transcription, or translation services are detected. When applied to communications involving EU individuals, these may constitute automated processing subject to GDPR Article 22 and EU AI Act transparency requirements.",
    legalReference: "EU AI Act Article 50 (transparency for AI-generated content); GDPR Article 22",
    remediation:
      "Review whether processed content involves EU personal data. If so, ensure GDPR legal basis is established and consider EU-hosted alternatives for processing sensitive communications.",
    evaluate: (detected) => any(detected, ["comprehend", "transcribe", "translate", "textract", "kendra"]),
  },

  // ─── NIS2 ────────────────────────────────────────────────────────────────

  {
    id: "nis2_no_audit_logging",
    regulation: "nis2",
    severity: "critical",
    title: "No audit logging — NIS2 Article 21 incident detection requirement",
    description:
      "AWS CloudTrail is not detected. NIS2 Directive Article 21 requires essential and important entities to implement measures for monitoring, incident detection, and logging. Without audit logging, neither incident detection nor NIS2 compliance reporting is possible. EU member states can impose fines up to €10M or 2% of global annual turnover for NIS2 violations.",
    legalReference: "NIS2 Directive Article 21(2)(b); NIS2 Article 23 (incident reporting)",
    remediation:
      "Enable comprehensive audit logging immediately — this is a compliance requirement regardless of cloud provider. When migrating, ensure the target EU cloud provides equivalent logging (all 7 supported EU clouds offer logging services).",
    evaluate: (detected) => (absent(detected, ["cloudtrail"]) ? ["cloudtrail (absent)"] : []),
  },

  {
    id: "nis2_no_backup",
    regulation: "nis2",
    severity: "warning",
    title: "No backup service detected — NIS2 business continuity requirement",
    description:
      "AWS Backup is not detected. NIS2 Article 21 requires entities to implement business continuity measures including backup management and disaster recovery. The absence of a managed backup service creates compliance and operational risk.",
    legalReference: "NIS2 Directive Article 21(2)(c) (business continuity and disaster recovery)",
    remediation:
      "Implement a backup strategy covering all stateful services (databases, file systems, object storage). When migrating to EU clouds, prioritise backup configuration as part of the initial setup.",
    evaluate: (detected) => (absent(detected, ["backup"]) ? ["backup (absent)"] : []),
  },

  {
    id: "nis2_no_threat_detection",
    regulation: "nis2",
    severity: "warning",
    title: "No threat detection — NIS2 monitoring requirement",
    description:
      "AWS GuardDuty is not detected. NIS2 Article 21 requires continuous monitoring and threat detection capabilities. Without active threat detection, incident detection timelines increase, and NIS2's 24-hour early warning reporting obligation becomes difficult to meet.",
    legalReference: "NIS2 Directive Article 21(2)(b); NIS2 Article 23(4) (24-hour early warning)",
    remediation:
      "Enable GuardDuty or an equivalent threat detection service. When migrating to EU clouds, implement open-source equivalents (Falco for containers, Wazuh for SIEM) or EU-provider security services.",
    evaluate: (detected) => (absent(detected, ["guardduty"]) ? ["guardduty (absent)"] : []),
  },

  {
    id: "nis2_no_vulnerability_management",
    regulation: "nis2",
    severity: "info",
    title: "No vulnerability management detected",
    description:
      "AWS Inspector is not detected. NIS2 Article 21 includes vulnerability management in its security requirements. Without automated vulnerability scanning, patch management gaps may go undetected.",
    legalReference: "NIS2 Directive Article 21(2)(e) (vulnerability handling and disclosure)",
    remediation:
      "Enable Inspector or implement equivalent vulnerability scanning (Trivy for containers, OpenVAS for infrastructure). This capability is available on all target EU clouds.",
    evaluate: (detected) => (absent(detected, ["inspector"]) ? ["inspector (absent)"] : []),
  },

  {
    id: "nis2_no_config_compliance",
    regulation: "nis2",
    severity: "info",
    title: "No configuration compliance tracking detected",
    description:
      "AWS Config is not detected. Continuous configuration compliance assessment is a NIS2 security control requirement. Without it, drift from secure baselines may go undetected.",
    legalReference: "NIS2 Directive Article 21(2)(a) (policies on risk analysis and information system security)",
    remediation:
      "Enable AWS Config with managed rules. When migrating to EU clouds, implement Open Policy Agent (OPA) or equivalent policy-as-code tooling.",
    evaluate: (detected) => (absent(detected, ["config"]) ? ["config (absent)"] : []),
  },

  {
    id: "nis2_no_encryption_key_management",
    regulation: "nis2",
    severity: "info",
    title: "No centralised encryption key management detected",
    description:
      "AWS KMS is not detected. Centralised key management is a security baseline requirement for protecting data at rest and in transit. NIS2 includes cryptography controls among its Article 21 security measures.",
    legalReference: "NIS2 Directive Article 21(2)(h) (cryptography and encryption)",
    remediation:
      "Implement centralised key management (KMS or HashiCorp Vault). EU cloud equivalents: Hetzner does not offer managed KMS — consider self-hosted Vault on Hetzner, or OVHcloud / IONOS which offer managed KMS.",
    evaluate: (detected) => (absent(detected, ["kms"]) ? ["kms (absent)"] : []),
  },

  // ─── Sovereignty ─────────────────────────────────────────────────────────

  {
    id: "sovereignty_serverless_no_eu_equivalent",
    regulation: "sovereignty",
    severity: "warning",
    title: "Serverless compute has no direct EU sovereign equivalent",
    description:
      "AWS Lambda functions are detected. No EU-incorporated cloud provider offers a fully managed FaaS platform equivalent to Lambda. Scaleway Serverless Functions is the closest partial equivalent. Lambda-heavy architectures require re-architecture before migration — this is typically the highest-effort migration item.",
    legalReference: "EU Cloud Strategy (COM/2021/30); European Gaia-X initiative",
    remediation:
      "Evaluate Scaleway Serverless Functions for simple use cases. For complex Lambda workloads, plan migration to containerised services (Kubernetes Jobs, Hetzner Cloud Servers with function-as-a-service frameworks like OpenFaaS).",
    evaluate: (detected) => any(detected, ["lambda"]),
  },

  {
    id: "sovereignty_cdn_us_controlled",
    regulation: "sovereignty",
    severity: "warning",
    title: "Content delivery via US-controlled CDN infrastructure",
    description:
      "Amazon CloudFront is detected. CloudFront's global PoP network routes traffic through US-controlled infrastructure, including PoPs in the US. Content delivery infrastructure under US control is a sovereignty gap regardless of where origin servers are located.",
    legalReference: "EU Cloud Strategy (COM/2021/30); ENISA Cloud Security Guidance",
    remediation:
      "Migrate CDN to EU-controlled alternatives: OVHcloud CDN, Fastly (EU PoPs configurable), BunnyCDN (EU-incorporated, Slovenian), or KeyCDN (Swiss). Configure origin-pull from EU-sovereign storage after migration.",
    evaluate: (detected) => any(detected, ["cloudfront"]),
  },

  {
    id: "sovereignty_managed_identity",
    regulation: "sovereignty",
    severity: "warning",
    title: "Managed identity with no true EU-sovereign equivalent",
    description:
      "Amazon Cognito is managing user authentication. No EU-incorporated cloud provider offers a fully managed identity platform equivalent. This creates both a sovereignty gap and GDPR risk for EU citizen credential data.",
    legalReference: "GDPR Article 5(1)(f) (integrity and confidentiality); EU Cloud Strategy",
    remediation:
      "Self-host Keycloak or Authentik on an EU cloud — both are production-ready, open-source, and provide full Cognito feature parity. Migration effort is medium but well-documented.",
    evaluate: (detected) => any(detected, ["cognito"]),
  },

  {
    id: "sovereignty_proprietary_nosql",
    regulation: "sovereignty",
    severity: "info",
    title: "Proprietary NoSQL database with no direct EU equivalent",
    description:
      "Amazon DynamoDB is detected. DynamoDB uses a proprietary API with no open-source or EU-cloud equivalent. Migration requires re-architecture to a compatible alternative (MongoDB, Apache Cassandra, ScyllaDB).",
    legalReference: "EU Cloud Strategy (COM/2021/30)",
    remediation:
      "Assess DynamoDB access patterns to choose the right migration target: ScyllaDB (high throughput, DynamoDB-compatible API available), MongoDB Atlas (available on EU clouds), or PostgreSQL with JSONB for simpler use cases. Budget medium-to-high migration effort.",
    evaluate: (detected) => any(detected, ["dynamodb"]),
  },

  {
    id: "sovereignty_network_dependency",
    regulation: "sovereignty",
    severity: "info",
    title: "Network connectivity depends on US provider infrastructure",
    description:
      "AWS Direct Connect or VPC PrivateLink is detected. Network connectivity routed through AWS infrastructure means traffic paths and routing decisions are under US-incorporated provider control, even for nominally EU-region traffic.",
    legalReference: "EU Cloud Strategy (COM/2021/30); ENISA Network Security Guidelines",
    remediation:
      "Plan network architecture re-design as part of migration. EU cloud providers offer equivalent private networking (Hetzner Cloud Networks, OVHcloud vRack, Scaleway Private Networks). Direct Connect equivalents include provider-specific interconnect services.",
    evaluate: (detected) => any(detected, ["directconnect", "privatelink"]),
  },

  {
    id: "sovereignty_cicd_us_controlled",
    regulation: "sovereignty",
    severity: "info",
    title: "CI/CD pipeline under US-controlled infrastructure",
    description:
      "AWS CodeBuild or CodePipeline is detected. Software build and deployment pipelines running on US-controlled infrastructure mean that software supply chain integrity is subject to US government access. This is particularly relevant for defence and critical infrastructure customers.",
    legalReference: "EU Cloud Strategy (COM/2021/30); NIS2 Article 21(2)(d) (supply chain security)",
    remediation:
      "Migrate CI/CD to EU-controlled alternatives: Gitea + Woodpecker CI (self-hosted), Forgejo, or EU-hosted GitLab. All are compatible with existing pipeline definitions with minor configuration changes.",
    evaluate: (detected) => any(detected, ["codebuild", "codepipeline", "codecommit", "codedeploy"]),
  },

  {
    id: "sovereignty_secrets_us_controlled",
    regulation: "sovereignty",
    severity: "info",
    title: "Secrets and credentials stored with US-incorporated provider",
    description:
      "AWS Secrets Manager is detected. Application secrets, API keys, and credentials stored in Secrets Manager are accessible to US authorities under the CLOUD Act. In a kill-switch scenario, access to secrets could be revoked simultaneously with data access.",
    legalReference: "US CLOUD Act, 18 U.S.C. §2713; EU Cloud Strategy",
    remediation:
      "Migrate secrets to HashiCorp Vault or OpenBao (self-hosted on EU cloud) or an EU-provider KMS service. All major EU clouds support Vault integration. This is typically a low-effort migration.",
    evaluate: (detected) => any(detected, ["secretsmanager"]),
  },

  {
    id: "sovereignty_dns_us_controlled",
    regulation: "sovereignty",
    severity: "info",
    title: "DNS infrastructure under US-incorporated provider control",
    description:
      "Amazon Route 53 is detected. DNS resolution through a US-incorporated provider means that domain resolution — a fundamental internet layer — is subject to US government control. A sanctions scenario could disrupt DNS resolution for services relying on Route 53.",
    legalReference: "US CLOUD Act, 18 U.S.C. §2713; EU Cloud Strategy",
    remediation:
      "Migrate DNS to an EU-incorporated DNS provider: Hetzner DNS (free), OVH DNS, or a self-hosted BIND/PowerDNS instance on EU infrastructure. DNS migration is typically low-effort.",
    evaluate: (detected) => any(detected, ["route53"]),
  },
];

// ---------------------------------------------------------------------------
// Engine
// ---------------------------------------------------------------------------

export function runComplianceEngine(detectedServices: string[]): ComplianceFlag[] {
  const detected = new Set(detectedServices);
  const flags: ComplianceFlag[] = [];

  for (const rule of RULES) {
    const triggeredBy = rule.evaluate(detected);
    if (triggeredBy.length > 0) {
      flags.push({
        id: rule.id,
        regulation: rule.regulation,
        severity: rule.severity,
        title: rule.title,
        description: rule.description,
        legalReference: rule.legalReference,
        remediation: rule.remediation,
        ...(rule.precedent ? { precedent: rule.precedent } : {}),
        triggeredBy,
      });
    }
  }

  // Sort: critical first, then warning, then info
  const order: Record<ComplianceSeverity, number> = { critical: 0, warning: 1, info: 2 };
  return flags.sort((a, b) => order[a.severity] - order[b.severity]);
}

export function complianceSummary(flags: ComplianceFlag[]): {
  critical: number;
  warning: number;
  info: number;
} {
  return {
    critical: flags.filter((f) => f.severity === "critical").length,
    warning: flags.filter((f) => f.severity === "warning").length,
    info: flags.filter((f) => f.severity === "info").length,
  };
}
