<div align="center">

<img src="src/assets/asterops-logo.png" alt="AsterOps Logo" width="280">


**An open-source platform for centralized VoIP infrastructure management, automated security hardening, and compliance auditing.**

<br>

[![License: Apache 2.0](https://img.shields.io/badge/License-Apache_2.0-blue.svg)](LICENSE)
[![Python 3.10+](https://img.shields.io/badge/python-3.10+-3776AB.svg?logo=python&logoColor=white)](https://www.python.org)
[![React](https://img.shields.io/badge/dashboard-React_18-61DAFB.svg?logo=react&logoColor=black)](https://react.dev)
[![Asterisk](https://img.shields.io/badge/asterisk-18%20%7C%2020%20%7C%2022-F5821F.svg)](https://www.asterisk.org)
[![Status](https://img.shields.io/badge/status-beta-orange.svg)](#roadmap)
[![PRs welcome](https://img.shields.io/badge/PRs-welcome-3ddc97.svg)](#contributing)

</div>

---

## Dashboard Preview

> **A single control plane for provisioning, securing, monitoring, and auditing your VoIP infrastructure.**

<p align="center">

<img src="src/assets/dashboard.png" alt="AsterOps Dashboard">

</p>

---

## Why AsterOps?

Managing VoIP infrastructure at scale is often repetitive, error-prone, and difficult to standardize. Security hardening is frequently performed manually, configurations drift over time, and operational visibility is fragmented across multiple tools.

**AsterOps** solves this by providing a centralized platform that automates provisioning, security hardening, compliance auditing, and Multiple server management for VoIP infrastructure.

Whether you're operating a single PBX or managing hundreds of deployments across multiple servers, AsterOps helps you build secure, consistent, and manageable VoIP environments.

It started as a university project on automated VoIP security hardening and it continues as an open-source platform because secure communications infrastructure deserves modern engineering practices.

---

## Core Features

- Automated VoIP Provisioning
- Security Hardening Engine
- TLS & SRTP Enforcement
- Centralized Management Dashboard
- Configuration as Code
- Compliance Reporting
- Audit Logging
- Multi-Server Management

---

## Highlights

### Security Hardening Engine

Automatically applies opinionated security baselines to Asterisk deployments, helping reduce attack surface while maintaining repeatable and auditable configurations.

**Includes:**

- TLS 1.2+ configuration
- SRTP enforcement
- Fail2Ban integration
- iptables / nftables configuration
- AMI hardening
- SSH hardening
- File permission enforcement
- Firewall configuration 
- Automatic configuration backups
- Dry-run support before applying changes

---

### Automated Configuration

Define your infrastructure once using simple YAML files and let AsterOps generate deterministic manageable Asterisk configuration files.

Supported configuration generation includes:

- `pjsip.conf`
- `extensions.conf`
- `rtp.conf`

The same input always produces the same output, reducing configuration drift and minimizing human error.

---

### Security Posture & Compliance Reporting

Continuously assess the security posture of every managed server.

Generate:

- JSON reports
- Standalone HTML reports
- PDF exports

Each report includes:

- Security score (0–100)
- Individual security checks
- QoS results
- Recommended remediation steps

Reports can be uploaded automatically to the centralized dashboard for fleet-wide visibility.

---

### 🖥️ Centralized Server Management

Manage multiple Asterisk servers from a single dashboard.

Capabilities include:

- Server overview
- Security posture monitoring
- Provisioning workspace
- Audit logs
- Call records
- Alert management

Designed for organizations managing multiple PBX deployments.

---

### Extensible Platform Architecture

AsterOps is designed around a modular platform abstraction.

While Asterisk is currently the primary supported platform, the architecture allows additional VoIP platforms to be integrated through a lightweight `VoipPlatform` interface.

Future platform support includes:

- FreeSWITCH
- Kamailio
- OpenSIPS

---

### Built for Reliability

Quality is built into the development workflow.

Current testing includes:

- Golden-file renderer tests
- Profile loader validation
- Security scoring tests
- Configuration generation verification

The goal is predictable, repeatable infrastructure automation that engineers can trust.

---