# Git Commit Activity Tracker Design

This document details the architecture and payload structure for tracking Git commit activity as a digital context metric within the **Human-Vector-Biome**.

---

## 1. Objective

By logging commit frequency and sizes (lines added/deleted), the Biome can correlate development velocity with physiological stress (HRV, Muse stress index) and posture metrics.

*   **Hypothesis A (Stress Coding):** A high volume of small commits in a short window combined with high heart rate or Muse stress indexes may indicate "panic patching" or cognitive fragmentation.
*   **Hypothesis B (Mental Fatigue):** Long periods of zero commit activity during working hours, accompanied by poor posture scores (slouching), correlates with cognitive fatigue or block.

---

## 2. API Schema

The endpoint accepts POST requests at `/api/events/git` with the following JSON structure:

```json
{
  "timestamp": "2026-05-20T19:03:00Z",
  "commits_today": 8,
  "lines_added_today": 254,
  "lines_deleted_today": 62,
  "last_commit_message": "docs: add multi-node wireless split setup option...",
  "last_commit_hash": "d7afc2e"
}
```

---

## 3. Local Git Poller Script (`scripts/git-metrics-poller.js`)

A lightweight Node.js script run on the development machine (either as a Cron job, a shell alias, or a background loop). 

It scans the workspace directories using standard Git shell commands and POSTs the aggregated stats to the local Biome Hub.

### Git Shell Commands Used:
1.  **Commit count since midnight:**
    ```bash
    git log --since="midnight" --author="$(git config user.name)" --oneline | wc -l
    ```
2.  **Last commit hash & message:**
    ```bash
    git log -1 --pretty=format:"%h|%s"
    ```
3.  **Lines added & deleted since midnight:**
    ```bash
    git log --since="midnight" --author="$(git config user.name)" --numstat --pretty="%x00" | awk 'NF==3 {plus+=$1; minus+=$2} END {print plus, minus}'
    ```

---

## 4. Intervention Brain Integrations

*   **Trigger "Deep Work Mode":** When a steady cadence of commits is detected (e.g., 1 commit every 30-45 mins) and posture is good, set a "Deep Work" state, automatically muting non-essential notifications on the Hub.
*   **Warn on "Tired Refactoring":** If git activity shows >500 lines changed late at night and posture score is <50, trigger a watch haptic to suggest sleeping.
