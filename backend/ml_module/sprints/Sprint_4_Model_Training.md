# Sprint 4: Model Training & Validation

## Objective
Train the `xgboost.XGBClassifier` and establish rigorous cross-validation using the previously built features and metrics.

## Tasks
- [ ] **Handling Imbalance:** Calculate `scale_pos_weight` dynamically from the training split and apply it to XGBoost.
- [ ] **Cross Validation:** Implement `GroupKFold` so that validation splits are grouped by hospital unit identifiers (e.g., `Unit1`, `Unit2`) to prove generalization.
- [ ] **Model Pipeline:** Write `src/train.py` which:
  - Fetches generated features.
  - Splits data via `GroupKFold`.
  - Trains XGBoost.
  - Evaluates using our custom Utility Score.
- [ ] **Explicability Setup:** Add SHAP integration to output the top 3 global drivers and save the tree explainer.

## Definition of Done
- A fully trained model artifact.
- Model performance report showcasing the Custom Utility Score across folds. 
- (Phase 5 LLM sequence will be left for a subsequent epic/sprint as governed by the user).
