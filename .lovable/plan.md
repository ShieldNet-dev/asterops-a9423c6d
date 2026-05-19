# AsterOps

## Secure PBX Provisioning & VoIP Orchestration Platform

### Project Overview

AsterOps is an open-source VoIP orchestration and PBX provisioning platform designed to simplify, secure, and automate the deployment and management of Asterisk-based telephony infrastructure.

The platform provides centralized configuration management, TLS/SRTP provisioning, security hardening automation, configuration validation, immutable call auditing, and multi-server orchestration through a lightweight host agent and modern web dashboard.

Rather than functioning only as a security product, AsterOps bridges provisioning, orchestration, compliance, monitoring, and hardening into a unified operational platform for modern VoIP deployments.

---

# Vision

To provide a secure, modern, developer-friendly alternative to legacy PBX administration workflows by:

- Automating Asterisk configuration management
- Simplifying TLS + SRTP deployment
- Standardizing VoIP security hardening
- Providing centralized operational visibility
- Reducing deployment complexity for SMBs, MSPs, ISPs, universities, and call centers
- Enabling reproducible, auditable PBX infrastructure management

---

# Core Positioning

AsterOps should be positioned as:

> “A Secure VoIP Provisioning and PBX Orchestration Platform for Asterisk Infrastructure.”

This positioning better reflects the product’s broader functionality beyond security alone.

---

# Proposed Architecture

## High-Level Architecture

```text
┌────────────────────┐        HTTPS / mTLS         ┌────────────────────────┐
│  Web Dashboard     │ ◄────────────────────────► │  AGENT (Go daemon)    │
│                    │                            │                        │
│  - Auth            │                            │  - Config validation   │
│  - Server registry │                            │  - Signed bundle sync  │
│  - Config builder  │                            │  - Asterisk reloads    │
│  - TLS management  │                            │  - CDR streaming       │
│  - Audit viewer    │                            │  - Health monitoring   │
│  - Hardening UI    │                            │  - Rollback engine     │
└────────────────────┘                            └────────────────────────┘
          │                                                    │
          ▼                                                    ▼
     PostgreSQL                                         Asterisk Host
                                                        /etc/asterisk
                                                        fail2ban
                                                        TLS certs

```

---

# Recommended Technology Stack

## Frontend

- TanStack Start
- React
- TailwindCSS
- TypeScript
- Zod validation
- WebSocket/SSE support for real-time updates

## Backend

- Node.js / TypeScript
- PostgreSQL
- Row-Level Security (RLS)
- Signed configuration bundles
- Audit event pipeline

## Agent

### Recommended Change:

Replace Python agent with Go.

Reasoning:

- Static binaries
- Lower memory footprint
- Easier Linux deployment
- Better daemon reliability
- Simpler systemd integration
- Easier cross-compilation
- Strong concurrency model

The Go agent should:

- Poll or stream configuration updates
- Validate configs before apply
- Apply staged configurations
- Maintain rollback snapshots
- Stream CDRs and health telemetry
- Verify cryptographic signatures on config bundles

---

# Core Platform Modules

## 1. Authentication & Access Control

### Features

- Email/password authentication
- Google OAuth
- Per-server enrollment tokens
- Session management
- Future RBAC support

### Future Enhancements

- Multi-tenant organizations
- Team-based permissions
- API keys
- SSO/SAML support

---

# 2. Server Registry & Fleet Management

### Features

- Centralized PBX inventory
- Agent health monitoring
- Version visibility
- Online/offline state
- Token rotation
- Certificate expiry tracking
- Deployment status history

### Recommended Additions

- Region tagging
- Environment labels (dev/staging/prod)
- Server grouping
- Maintenance mode

---

# 3. PJSIP Provisioning Engine

## Scope

A fully structured configuration orchestration system for:

- Transports
- Endpoints
- Auth objects
- AORs
- Trunks
- Registrations
- Identify sections
- Codec policies
- NAT traversal settings
- Media encryption policies

## Critical Engineering Requirement

Rendering must remain:

- deterministic
- testable
- version-controlled
- environment reproducible

## Mandatory Validation Pipeline

Before any config is applied:

```bash
asterisk -tc
asterisk -rx "pjsip reload"
asterisk -rx "pjsip show endpoints"

```

If validation fails:

- reject deployment
- preserve last-known-good config
- generate deployment diagnostics

This validation system is mandatory.

---

# 4. TLS & SRTP Provisioning

## Objectives

- Simplify encrypted VoIP deployment
- Reduce TLS misconfiguration
- Standardize SRTP enforcement

## Recommended Security Model

### DO NOT store raw private keys in cloud databases.

Instead:

- Generate keys locally on agent
- Use CSR-based workflows
- Support ACME / Let’s Encrypt
- Support internal CA integration
- Encrypt local secrets at rest

## Features

- TLS transport generation
- SRTP enforcement toggles
- Certificate validation
- Automatic renewal hooks
- Expiry monitoring
- TLS policy presets

---

# 5. Security Hardening Automation

## Features

- fail2ban templates
- UFW/iptables generation
- AMI lockdown
- Secure file permissions
- SIP rate limiting guidance
- SSH hardening recommendations

## Mandatory Safety Controls

Generated firewall scripts must include:

- dry-run mode
- rollback support
- validation checks
- operator confirmation
- backup snapshots

Unsafe one-click firewall deployment must be avoided.

---

# 6. Configuration Deployment Engine

## Critical Requirement

Configuration deployment must be:

- signed
- versioned
- reversible
- auditable

## Recommended Design

### Signed Bundles

All generated configuration bundles should be cryptographically signed.

Agent verifies:

- integrity
- authenticity
- version
- expiration

before applying.

## Rollback System

Every deployment must:

- preserve previous configs
- allow instant rollback
- support health-check rollback
- support deployment history

This is mandatory for production use.

---

# 7. Real-Time Call Audit Pipeline

## MVP Design

Initial approach:

- tail Master.csv
- batch POST to dashboard

This is acceptable for v1.

## Future Improvements

Long-term migration options:

- ODBC-backed CDR ingestion
- CEL support
- AMI event streaming
- Kafka/NATS pipelines
- WebSocket event streams

## Audit Principles

- append-only records
- immutable history
- export support
- searchable metadata
- retention policies

---

# 8. Database Architecture

## Core Tables

- profiles
- servers
- endpoints
- trunks
- pjsip_configs
- call_records
- tls_metadata
- audit_events

## Security Controls

- Row-Level Security
- append-only audit records
- deny UPDATE/DELETE on call_records
- server ownership isolation

## Recommended Additions

- partitioning strategy for CDR scale
- archival policies
- retention configuration
- indexing optimization
- encrypted secrets table

---

# 9. Threat Model Requirements

AsteriskGuard manages production telephony infrastructure and therefore must implement a formal threat model.

## Required Protections

- mTLS between dashboard and agent
- replay protection
- signed configuration bundles
- nonce validation
- token rotation
- encrypted secret storage
- audit event integrity
- rate limiting
- deployment authorization checks

---

# 10. UI & Operational Experience

## Design Direction

Modern infrastructure-focused UX inspired by:

- Grafana
- Tailscale
- PocketBase
- Datadog

## UI Priorities

- operational clarity
- low clutter
- dark mode support
- searchable infrastructure views
- deployment visibility
- audit traceability
- No gradient at all completely.
- Professional SaaS look minimalist

---

# 11. Open-Source Strategy

## Recommended Licensing Considerations

Current proposal: MIT

Alternative options worth evaluating:

- Apache 2.0
- AGPL
- dual-license model

Reason:

Prevent ecosystem fragmentation while preserving community adoption.

---

# 12. Suggested MVP Scope

## v1 MUST Include

### Core Platform

- Authentication
- Server registry
- Enrollment flow
- Agent communication
- PJSIP config generation
- TLS/SRTP provisioning
- Config validation
- Signed deployments
- Rollback support
- Audit logging
- CDR streaming

### Security Requirements

- RLS enforcement
- secret encryption
- token hashing
- config signature verification
- immutable audit records

---

# 13. Future Roadmap

## v2+

- WebRTC provisioning
- ARI/AMI integrations
- Prometheus exporter
- Grafana dashboards
- SIP anomaly detection
- RBAC
- Multi-tenancy
- Cluster awareness
- Kubernetes deployments
- HA coordination
- Realtime PJSIP support
- Visual dialplan builder
- Call recording pipeline
- AI-assisted diagnostics

---

# Final Technical Assessment

AsteriskGuard has strong potential to become:

- a respected open-source VoIP orchestration platform,
- a DevSecOps tool for telephony infrastructure,
- an MSP-grade PBX management system,
- or a commercial hosted orchestration product.

The concept is technically credible and addresses genuine operational pain points in the Asterisk ecosystem.

However, production-readiness depends heavily on:

- secure secret management,
- signed deployments,
- rollback safety,
- configuration validation,
- and hardened agent communication.

The platform should prioritize operational safety and deployment integrity as first-class engineering goals from the beginning.

---

# Recommended Product Tagline

> “Secure VoIP Provisioning, PBX Orchestration, and Infrastructure Hardening for Modern Asterisk Deployments.”