# Sprint 3: Evaluation Metrics Calculation

## Objective
Implement and validate the PhysioNet Clinical Utility Score ($U_{normalized}$) custom metric.

## Tasks
- [ ] **Utility Score Function:** Create `src/metrics.py`.
- [ ] **Logic Implementation:**
  - Reward predictions made exactly 6 hours prior to onset Sepsis.
  - Penalize late predictions (>3 hours after onset).
  - Penalize false positives.
- [ ] **Unit Tests for Metrics:** Create dummy prediction arrays matching edge cases (perfect prediction, late prediction, false alarm) to test the mathematical output against challenge constraints.

## Definition of Done
- Demonstrable `utility_score(y_true, y_pred)` function that passes sanity checks.
- User reviews test cases to ensure the metric exactly matches the paper's $U_{normalized}$ formula.
