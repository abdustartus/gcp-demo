# Scaling BookMyShow on GCP — A Coldplay Ticket Rush Simulation

> What happens when 1,000 people try to book concert tickets at the same time?  
> We built a replica, broke it, and fixed it — layer by layer — on Google Cloud.

---

## The Problem

When Coldplay announced their India tour, BookMyShow's platform buckled under the load. Millions of fans, one booking window, and a system that wasn't ready for it.

This project simulates exactly that scenario. We took a working ticket booking application, ran it locally to see where it cracked, migrated it to GCP, and kept pushing until it could handle the rush — without dropping a single request.

---

## What's in This Repo

```
gcp-demo/
├── mini-book-my-show/     # The Next.js 15 booking app (the thing being scaled)
├── feedback-form/         # Post-event user feedback form (deployed on Cloud Run)
├── locust-tests/          # Load test scripts and results from all test stages
└── cloud-functions/       # seat-availability-checker — a standalone Cloud Function
```

---

## The Stack

**Application**
- Next.js 15, TypeScript, Prisma v7, MySQL 8
- Containerised with Docker, deployed to Cloud Run

**GCP Infrastructure**
- **Cloud Run** — serves the app, scales 2–10 instances based on traffic
- **Managed Instance Group (MIG)** — e2-micro instances for compute redundancy
- **Global Load Balancer** — routes traffic, sends static assets to CDN
- **Cloud SQL (MySQL 8)** — primary + read replica, private IP only
- **Memorystore Redis 7** — caches movie listings and show schedules
- **Cloud Storage + CDN** — serves movie poster images at the edge
- **Serverless VPC Connector** — keeps all database traffic off the public internet
- **Cloud Functions** — handles seat availability checks independently of the main app

---

## The Journey

### Stage 1 — Local Baseline

Before touching GCP, we ran the app locally and measured what we were dealing with.

| Users | Avg Response | Throughput |
|-------|-------------|------------|
| 10    | 41ms        | 1.95 RPS   |
| 100   | 661ms       | 13.7 RPS   |
| 500   | 5,016ms     | 25.7 RPS   |

At 500 users, average response time crossed 5 seconds. That's the point where people give up. The local setup identified 8 bottlenecks — zero caching, race conditions on seat booking, duplicate database queries, and no horizontal scaling were the critical ones.

---

### Stage 2 — GCP Infrastructure

We moved the app to GCP and added the infrastructure it was missing.

- Cloud Run replaced the single Docker container — auto-scaling, no cold starts, global reach
- Cloud SQL replaced the local MySQL — private networking, read replica, automated backups with PITR
- Redis caching reduced database load on the most-hit endpoints
- Cloud Storage + CDN offloaded static assets entirely from the application tier

The Redis result alone was striking. A cold `/api/movies` request took 1.9 seconds. The same request with a warm cache: **429ms**. 4.5x faster, database never touched.

---

### Stage 3 — Load Testing on GCP

With infrastructure in place, we ran the same load tests against GCP.

| Users | Local Avg | GCP Avg | Improvement |
|-------|-----------|---------|-------------|
| 100   | 661ms     | 420ms   | 1.6x faster |
| 500   | 5,016ms   | 550ms   | 9x faster   |
| 1,000 | —         | 1,100ms | New ceiling  |

0% failure rate at every stage. But at 1,000 users, p99 latency hit 26 seconds — the slowest 1% of users were waiting almost half a minute. Not acceptable.

**The fix:** two configuration changes.
- Concurrency: `80 → 40` (Cloud Run spawns new instances sooner)
- Min instances: `1 → 2` (no cold start delay when the spike hits)

**After tuning at 1,000 users:**

| Metric | Before | After | Improvement |
|--------|--------|-------|-------------|
| Avg latency | 1,100ms | 390ms | 2.8x faster |
| p95 latency | 4,800ms | 600ms | 8x faster |
| p99 latency | 26,000ms | 1,000ms | **26x faster** |
| Throughput | 270 RPS | 430 RPS | 1.6x more |

Same code. Two numbers changed. p99 went from 26 seconds to 1 second.

---

### Stage 4 — Cost Optimisation

The entire infrastructure ran within GCP's free tier — zero billed cost.

What was set up to keep it that way at scale:
- **Budget alert** at ₹10/month with notifications at 50%, 90%, 100% spend
- **SPOT instance template** for the MIG — up to 90% cheaper for non-critical workloads
- **Sustained Use Discounts** — applied automatically by GCP once instances exceed 25% monthly runtime
- **Cloud Function** for seat availability — billed per invocation, scales to zero, first 2M calls/month free

---

### Stage 5 — Monitoring

Three live alert policies in Cloud Monitoring, all with email notifications:

| Alert | Threshold | Why it matters |
|-------|-----------|----------------|
| CPU Usage — MIG | > 80% for 60s | Autoscaler struggling or instance type needs upgrading |
| API Latency — Cloud Run | p99 > 2,000ms | Catches tail latency before users feel it |
| DB Connections — Cloud SQL | > 50 connections | Connection pool exhaustion is a silent killer |

A log sink routes all Cloud Run, MIG, and Cloud SQL logs into Cloud Storage continuously. Every request, every error, every slow query — stored and timestamped. The load test activity from March 11–12 is already in there.

A user feedback form was also deployed as a standalone Cloud Run service.  

It runs separately from the main application deliberately — so it stays up even when the booking engine is under maximum pressure. That's exactly when you need user reports.

---

## Key Numbers

| Metric | Local | GCP (tuned) | Improvement |
|--------|-------|-------------|-------------|
| Max throughput | 25.7 RPS | 430 RPS | **17x** |
| Avg latency @ 500 users | 5,016ms | 550ms | **9x** |
| p99 latency @ 1,000 users | — | 1,000ms | vs 26,000ms before tuning |
| Failure rate | 0% | 0% | Held throughout |
| Redis cache speedup | — | 4.5x | 1,900ms → 429ms |

---

## What's Next

A few things that would make this production-ready:

- **Route reads to the replica** — the read replica is running but not yet used. One application change, real impact on primary load.
- **Add a second region** — current setup is single-region. A regional outage takes everything down. Cross-region failover would fix that.
- **Close the feedback loop** — the form collects responses but has nowhere to send them yet. A Cloud Function writing to Firestore would make that data actionable.
- **Rate limiting at the edge** — Cloud Armor policies on the load balancer would protect against bot traffic and retry storms without touching the application.
- **Chaos engineering** — every test here was clean and controlled. Real incidents aren't. Deliberately killing instances, preempting nodes, and forcing cache misses mid-test would surface failure modes that clean load tests can't.

---

## GCP Project Details

| Resource | Value |
|----------|-------|
| Project ID | `project-894c891e-2fc4-4608-af6` |
| Region | `us-central1` |
| Artifact Registry | `us-central1-docker.pkg.dev/.../mini-bookmyshow/app:v3` |
| Cloud SQL Primary | `10.118.0.3` (private) |
| Cloud SQL Replica | `10.118.0.5` (private) |
| Redis | `10.180.31.115:6379` (private) |
| VPC Connector | `mini-bookmyshow-connector` (`10.9.0.0/28`) |

---

*Built as a GCP scalability case study. All load test results are from real Locust runs against live infrastructure.*
