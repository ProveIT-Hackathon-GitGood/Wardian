# Sprint 2: Feature Engineering

## Objective
Construct the specific clinical features required by `system.md` while avoiding data leakage.

## Tasks
- [ ] **Vital Signs Processing:** 
  - Create rolling window variables (mean, std, min, max) over 4-hour, 8-hour, and 12-hour windows for the 8 specific vital signs.
- [ ] **Laboratory Processing (TTL logic):**
  - Implement a 12-hour Time-to-Live (TTL) forward-fill logic for the 26 lab features.
  - Create `time_since_last_measurement` features for all lab values.
  - Create boolean missingness indicator columns for all 26 lab values.

## Architecture Consideration
- Ensure the rolling window and TTL functions group by Patient ID so data from one patient doesn't leak into another.

## Definition of Done
- A standalone `src/features.py` script.
- A small test dataset passed through the pipeline to visually verify TTLs and rolling metrics are mathematically correct. User review required.
