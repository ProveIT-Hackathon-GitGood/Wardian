# Sprint 1: Data Preparation

## Objective
Establish a clean, optimized data loading pipeline for the PhysioNet 2019 dataset, ensuring we handle the 150MB `Dataset.csv` efficiently without blowing up memory.

## Tasks
- [ ] **Data Loader Implementation:** Create `src/data_loader.py`.
- [ ] **Efficient I/O:** Use `pandas` (with specific dtypes) or `polars` to read `complete_dataset/Dataset.csv` efficiently.
- [ ] **Basic Exploration Pipeline:** Write a script or notebook to confirm the schema, check the `SepsisLabel`, and ensure categorical columns like hospital/unit IDs are formatted correctly.

## Definition of Done
- Provide a python script that loads the dataset in under a few seconds and prints the memory usage/schema.
- User reviews and confirms the data loaded precisely as expected.
