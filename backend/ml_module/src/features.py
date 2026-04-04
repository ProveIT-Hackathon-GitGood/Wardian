import polars as pl
from typing import List

VITALS = [
    'HR', 'O2Sat', 'Temp', 'SBP', 'MAP', 'DBP', 'Resp', 'EtCO2'
]

LABS = [
    'BaseExcess', 'HCO3', 'FiO2', 'pH', 'PaCO2', 'SaO2', 'AST', 'BUN', 
    'Alkalinephos', 'Calcium', 'Chloride', 'Creatinine', 'Bilirubin_direct', 
    'Glucose', 'Lactate', 'Magnesium', 'Phosphate', 'Potassium', 
    'Bilirubin_total', 'TroponinI', 'Hct', 'Hgb', 'PTT', 'WBC', 
    'Fibrinogen', 'Platelets'
]

def generate_vital_features(df: pl.DataFrame) -> pl.DataFrame:
    """
    Generates rolling window statistics (mean, std, min, max) for vital signs
    over 4-hour, 8-hour, 12-hour, and 24-hour windows, grouped per Patient_ID.
    Assumes 1 row = 1 hour.
    """
    windows = [4, 8, 12, 24]
    exprs = []
    
    # Sort strictly by Patient_ID and Hour to ensure rolling works correctly
    df = df.sort(["Patient_ID", "Hour"])
    
    for window in windows:
        for vital in VITALS:
            exprs.extend([
                pl.col(vital).rolling_mean(window_size=window, min_periods=1).over("Patient_ID").alias(f"{vital}_mean_{window}h"),
                pl.col(vital).rolling_std(window_size=window, min_periods=1).over("Patient_ID").alias(f"{vital}_std_{window}h"),
                pl.col(vital).rolling_min(window_size=window, min_periods=1).over("Patient_ID").alias(f"{vital}_min_{window}h"),
                pl.col(vital).rolling_max(window_size=window, min_periods=1).over("Patient_ID").alias(f"{vital}_max_{window}h")
            ])
            
    df = df.with_columns(exprs)
    
    # 1. Surge/Crash: current value vs 4h mean
    surge_exprs = []
    for vital in VITALS:
        surge_exprs.append(
            (pl.col(vital) - pl.col(f"{vital}_mean_4h")).alias(f"{vital}_surge")
        )
    df = df.with_columns(surge_exprs)

    # 2. Trend Delta: short-term (4h) vs medium (12h) vs long (24h)
    trend_exprs = []
    for vital in VITALS:
        trend_exprs.append((pl.col(f"{vital}_mean_4h") - pl.col(f"{vital}_mean_12h")).alias(f"{vital}_trend_12h"))
        trend_exprs.append((pl.col(f"{vital}_mean_12h") - pl.col(f"{vital}_mean_24h")).alias(f"{vital}_trend_24h"))
    
    return df.with_columns(trend_exprs)

def generate_zscore_features(df: pl.DataFrame) -> pl.DataFrame:
    """
    Normalises vital signs to the patient's own historical baseline.
    Z-score = (Current - Cumulative Mean) / Cumulative Std
    """
    exprs = []
    
    # We will use the rolling 24h mean and std as the 'baseline'
    # Adding a small epsilon to standard deviation to avoid division by zero
    epsilon = 1e-6
    
    for vital in ["HR", "SBP", "Resp", "Temp"]:
        mean_col = pl.col(f"{vital}_mean_24h")
        std_col = pl.col(f"{vital}_std_24h")
        zscore = ((pl.col(vital) - mean_col) / (std_col + epsilon)).alias(f"{vital}_zscore_24h")
        exprs.append(zscore)

    return df.with_columns(exprs)

def generate_lab_features(df: pl.DataFrame) -> pl.DataFrame:
    """
    Implements 12-hour TTL forward-fill logic for labs, missingness indicators,
    and time_since_last_measurement tracking.
    """
    df = df.sort(["Patient_ID", "Hour"])
    
    # 1. Missingness indicators
    missing_exprs = [pl.col(lab).is_null().cast(pl.Int8).alias(f"{lab}_is_missing") for lab in LABS]
    df = df.with_columns(missing_exprs)
    
    # To compute time_since_last_measurement, we can track the 'Hour' where a value was not null,
    # forward fill that Hour per patient, then subtract from current Hour.
    ts_exprs = []
    ttl_ffill_exprs = []
    
    for lab in LABS:
        # Create a column that holds the current Hour when lab is NOT null, else null
        last_measured_hour = pl.when(pl.col(lab).is_not_null()).then(pl.col("Hour")).otherwise(None)
        
        # Forward fill the hour per patient
        ffill_hour = last_measured_hour.forward_fill().over("Patient_ID")
        
        # Time since last measurement = Current Hour - Forward-Filled Hour
        time_since = (pl.col("Hour") - ffill_hour).alias(f"{lab}_hours_since_last")
        ts_exprs.append(time_since)
        
        # TTL Forward Fill Logic: Only carry forward if time_since <= 12 hours
        ffill_val = pl.col(lab).forward_fill().over("Patient_ID")
        ttl_fill = pl.when(time_since <= 12).then(ffill_val).otherwise(pl.col(lab)).alias(f"{lab}_ttl_ffill")
        ttl_ffill_exprs.append(ttl_fill)
        
    # Apply Time Since Measurement expressions
    df = df.with_columns(ts_exprs)
    
    # Apply TTL Forward Fill expressions
    df = df.with_columns(ttl_ffill_exprs)
    
    # Optionally, we can drop the old original lab columns and rename the ttl ones to the original names
    # But usually keeping the raw or replacing them is fine. We will replace them to constrain width.
    replace_exprs = [pl.col(f"{lab}_ttl_ffill").alias(lab) for lab in LABS]
    df = df.with_columns(replace_exprs)
    df = df.drop([f"{lab}_ttl_ffill" for lab in LABS])
    
    # Replace null hours_since_last with a large placeholder (e.g. 999) indicating never measured
    fill_ts_exprs = [pl.col(f"{lab}_hours_since_last").fill_null(999) for lab in LABS]
    df = df.with_columns(fill_ts_exprs)
    
    return df

def generate_clinical_interactions(df: pl.DataFrame) -> pl.DataFrame:
    """
    Generate domain-specific interaction terms (Shock Index, BUN/Creatinine)
    and SIRS criteria proxies.

    Uses rolling-window fallbacks (4h mean) when raw values are null so that
    features are non-zero for the majority of rows rather than being silenced
    by NaN -> 0 imputation in the XGBoost pipeline.
    """
    exprs = []

    # ── Null-safe accessors: prefer raw value, fall back to 4h rolling mean ─
    hr_safe   = pl.coalesce([pl.col("HR"),   pl.col("HR_mean_4h")])
    sbp_safe  = pl.coalesce([pl.col("SBP"),  pl.col("SBP_mean_4h")])
    temp_safe = pl.coalesce([pl.col("Temp"), pl.col("Temp_mean_4h")])
    resp_safe = pl.coalesce([pl.col("Resp"), pl.col("Resp_mean_4h")])
    wbc_safe  = pl.coalesce([pl.col("WBC"),  pl.col("WBC_hours_since_last").is_not_null().cast(pl.Float64)])
    bun_safe  = pl.coalesce([pl.col("BUN"),  pl.col("BUN_hours_since_last").is_not_null().cast(pl.Float64)])
    creat_safe = pl.coalesce([pl.col("Creatinine"), pl.lit(1.0)])  # default denom = 1 to avoid /0

    # ── Shock Index = HR / SBP (robust) ──────────────────────────────────
    exprs.append((hr_safe / sbp_safe.fill_null(1.0)).alias("Shock_Index"))

    # ── BUN / Creatinine ratio (renal stress marker) ─────────────────────
    exprs.append((bun_safe / creat_safe).alias("BUN_Creatinine_Ratio"))

    # ── SIRS individual flags (null-safe) ────────────────────────────────
    exprs.append(
        ((temp_safe > 38.0) | (temp_safe < 36.0)).cast(pl.Int8).fill_null(0).alias("SIRS_Temp_Flag")
    )
    exprs.append(
        (hr_safe > 90.0).cast(pl.Int8).fill_null(0).alias("SIRS_HR_Flag")
    )
    exprs.append(
        (resp_safe > 20.0).cast(pl.Int8).fill_null(0).alias("SIRS_Resp_Flag")
    )
    # WBC: use TTL-filled WBC column (already filled up to 12h)
    exprs.append(
        ((pl.col("WBC") > 12.0) | (pl.col("WBC") < 4.0)).cast(pl.Int8).fill_null(0).alias("SIRS_WBC_Flag")
    )

    # ── SIRS Total Score (0-4) ────────────────────────────────────────────
    exprs.append(
        (
            ((temp_safe > 38.0) | (temp_safe < 36.0)).cast(pl.Int8).fill_null(0)
            + (hr_safe > 90.0).cast(pl.Int8).fill_null(0)
            + (resp_safe > 20.0).cast(pl.Int8).fill_null(0)
            + ((pl.col("WBC") > 12.0) | (pl.col("WBC") < 4.0)).cast(pl.Int8).fill_null(0)
        ).alias("SIRS_Total_Score")
    )

    return df.with_columns(exprs)

def generate_advanced_clinical_scores(df: pl.DataFrame) -> pl.DataFrame:
    """
    Implements Partial SOFA and NEWS2 clinical scoring proxies.
    These are the "gold standards" for sepsis and patient deterioration.
    """
    exprs = []

    # 1. NEWS score components (National Early Warning Score)
    # Resp Rate Score
    exprs.append(
        pl.when(pl.col("Resp").is_between(12, 20)).then(0)
        .when(pl.col("Resp").is_between(9, 11)).then(1)
        .when(pl.col("Resp").is_between(21, 24)).then(2)
        .when(pl.col("Resp").is_not_null()).then(3)
        .otherwise(None).alias("NEWS_Resp_Score")
    )
    # SpO2 Score (Scale 1)
    exprs.append(
        pl.when(pl.col("O2Sat") >= 96).then(0)
        .when(pl.col("O2Sat").is_between(94, 95)).then(1)
        .when(pl.col("O2Sat").is_between(92, 93)).then(2)
        .when(pl.col("O2Sat").is_not_null()).then(3)
        .otherwise(None).alias("NEWS_O2Sat_Score")
    )
    # SBP Score
    exprs.append(
        pl.when(pl.col("SBP").is_between(111, 219)).then(0)
        .when(pl.col("SBP").is_between(101, 110)).then(1)
        .when(pl.col("SBP").is_between(91, 100)).then(2)
        .when(pl.col("SBP").is_not_null()).then(3)
        .otherwise(None).alias("NEWS_SBP_Score")
    )
    # HR Score
    exprs.append(
        pl.when(pl.col("HR").is_between(51, 90)).then(0)
        .when((pl.col("HR").is_between(41, 50)) | (pl.col("HR").is_between(91, 110))).then(1)
        .when(pl.col("HR").is_between(111, 130)).then(2)
        .when(pl.col("HR").is_not_null()).then(3)
        .otherwise(None).alias("NEWS_HR_Score")
    )
    # Temp Score
    exprs.append(
        pl.when(pl.col("Temp").is_between(36.1, 38.0)).then(0)
        .when((pl.col("Temp").is_between(35.1, 36.0)) | (pl.col("Temp").is_between(38.1, 39.0))).then(1)
        .when(pl.col("Temp") >= 39.1).then(2)
        .when(pl.col("Temp").is_not_null()).then(3)
        .otherwise(None).alias("NEWS_Temp_Score")
    )
    # Supplemental Oxygen (FiO2 > 21% or 0.21)
    exprs.append(
        pl.when(pl.col("FiO2") > 0.21).then(2).otherwise(0).alias("NEWS_Oxygen_Score")
    )

    # 2. Partial SOFA Score (Sequential Organ Failure Assessment)
    # Respiratory: PaO2/FiO2 (using O2Sat proxy if PaO2 null, but dataset has PaCO2/pH/BaseExcess)
    # Actually dataset has FiO2. We can use simplified clinical proxies.
    # Coagulation: Platelets
    exprs.append(
        pl.when(pl.col("Platelets") < 20).then(4)
        .when(pl.col("Platelets") < 50).then(3)
        .when(pl.col("Platelets") < 100).then(2)
        .when(pl.col("Platelets") < 150).then(1)
        .otherwise(0).alias("SOFA_Coag_Score")
    )
    # Liver: Bilirubin
    exprs.append(
        pl.when(pl.col("Bilirubin_total") > 12.0).then(4)
        .when(pl.col("Bilirubin_total") >= 6.0).then(3)
        .when(pl.col("Bilirubin_total") >= 2.0).then(2)
        .when(pl.col("Bilirubin_total") >= 1.2).then(1)
        .otherwise(0).alias("SOFA_Liver_Score")
    )
    # Renal: Creatinine
    exprs.append(
        pl.when(pl.col("Creatinine") >= 5.0).then(4)
        .when(pl.col("Creatinine") >= 3.5).then(3)
        .when(pl.col("Creatinine") >= 2.0).then(2)
        .when(pl.col("Creatinine") >= 1.2).then(1)
        .otherwise(0).alias("SOFA_Renal_Score")
    )
    # Cardiovascular: MAP
    exprs.append(
        pl.when(pl.col("MAP") < 70).then(1).otherwise(0).alias("SOFA_Cardio_Score")
    )

    return df.with_columns(exprs).with_columns([
        (pl.col("NEWS_Resp_Score").fill_null(0) + 
         pl.col("NEWS_O2Sat_Score").fill_null(0) + 
         pl.col("NEWS_SBP_Score").fill_null(0) + 
         pl.col("NEWS_HR_Score").fill_null(0) + 
         pl.col("NEWS_Temp_Score").fill_null(0) + 
         pl.col("NEWS_Oxygen_Score").fill_null(0)).alias("NEWS_Total_Score"),
        
        (pl.col("SOFA_Coag_Score") + 
         pl.col("SOFA_Liver_Score") + 
         pl.col("SOFA_Renal_Score") + 
         pl.col("SOFA_Cardio_Score")).alias("SOFA_Partial_Score")
    ])

def generate_intensity_features(df: pl.DataFrame) -> pl.DataFrame:
    """
    Captures "Clinical Attention" based on how many labs/measurements are performed.
    """
    # Count of non-null lab values in the current row
    # (Excluding identifier and static cols)
    lab_cols = [c for c in df.columns if c in ["BaseExcess", "HCO3", "FiO2", "pH", "PaCO2", "SaO2", "AST", "BUN", "Alkalinephos", "Calcium", "Chloride", "Creatinine", "Bilirubin_direct", "Glucose", "Lactate", "Magnesium", "Phosphate", "Potassium", "Bilirubin_total", "TroponinI", "Hct", "Hgb", "PTT", "WBC", "Fibrinogen", "Platelets"]]
    
    exprs = [
        pl.sum_horizontal([pl.col(c).is_not_null().cast(pl.Int32) for c in lab_cols]).alias("Current_Lab_Count"),
        pl.sum_horizontal([pl.col(c).is_not_null().cast(pl.Int32) for c in VITALS]).alias("Current_Vital_Count")
    ]
    
    df = df.with_columns(exprs)
    
    # Rolling density: how many labs in past 6h and 12h
    density_exprs = [
        pl.col("Current_Lab_Count").rolling_sum(window_size=6, min_periods=1).over("Patient_ID").alias("Lab_Density_6h"),
        pl.col("Current_Lab_Count").rolling_sum(window_size=12, min_periods=1).over("Patient_ID").alias("Lab_Density_12h")
    ]
    
    return df.with_columns(density_exprs)

def generate_trend_features(df: pl.DataFrame) -> pl.DataFrame:
    """
    Calculates simple trend deltas (Current - Value 4h ago) for key vitals.
    Rapid changes are highly predictive.
    """
    exprs = []
    for vital in ["HR", "SBP", "Resp", "O2Sat"]:
        # Delta = Now - Value 4h ago (using shift)
        delta = (pl.col(vital) - pl.col(vital).shift(4).over("Patient_ID")).alias(f"{vital}_delta_4h")
        exprs.append(delta)
    
    return df.with_columns(exprs)

def run_pipeline(df: pl.DataFrame) -> pl.DataFrame:
    print("Formatting types...")
    # Cast vitals and labs to Float64, invalid parsing will be null
    df = df.with_columns([
        pl.col(c).cast(pl.Float64, strict=False) for c in VITALS + LABS
    ])
    
    print("Generating Vital Sign Rolling Features...")
    df = generate_vital_features(df)
    print("Generating Patient Baseline Z-Scores...")
    df = generate_zscore_features(df)
    print("Generating Laboratory TTL & Tracking Features...")
    df = generate_lab_features(df)
    print("Generating Clinical Interaction Features...")
    df = generate_clinical_interactions(df)
    print("Generating Advanced Clinical Scores (SOFA/NEWS)...")
    df = generate_advanced_clinical_scores(df)
    print("Generating Clinical Intensity Features...")
    df = generate_intensity_features(df)
    print("Generating Trend Delta Features...")
    df = generate_trend_features(df)
    return df
