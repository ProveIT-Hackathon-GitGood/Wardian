import numpy as np

def compute_physionet_utility(df_predictions, dt_early=-12, dt_optimal=-6, dt_late=3.0, max_u_tp=1.0, min_u_fn=-2.0, u_fp=-0.05, u_tn=0.0):
    """
    Computes the PhysioNet Clinical Utility Score (Unormalized) for a set of predictions.
    
    df_predictions must be a pandas DataFrame containing:
    - 'Patient_ID': Unique identifier
    - 'Hour': The time step (hourly)
    - 'SepsisLabel': Ground truth label (1 = sepsis, 0 = no sepsis)
    - 'Prediction': Model's binary prediction (1 = predicted sepsis, 0 = predicted no sepsis)
    
    The utility score rewards predictions close to dt_optimal (exactly 6 hours prior to onset).
    It penalizes false positives and late predictions.
    """
    
    # Calculate U for each patient
    utility_total = 0.0
    max_utility_total = 0.0
    
    grouped = df_predictions.groupby('Patient_ID')
    
    for patient, group in grouped:
        labels = group['SepsisLabel'].values
        preds = group['Prediction'].values
        hours = group['Hour'].values
        
        is_sepsis = np.any(labels == 1)
        
        u = np.zeros(len(labels))
        max_u = np.zeros(len(labels))
        
        if is_sepsis:
            # Find t_sepsis
            # In the challenge dataset, SepsisLabel = 1 starts exactly at t_sepsis - 6.
            # So the onset t_sepsis is where SepsisLabel becomes 1 + 6 hours.
            t_sepsis_minus_6 = hours[np.where(labels == 1)[0][0]]
            t_sepsis = t_sepsis_minus_6 + 6
            
            for i, t in enumerate(hours):
                dt = t - t_sepsis
                
                # Max Utility (Perfect Classifier: 1 between -12 and 3, mostly at -6)
                if dt >= dt_early and dt <= dt_late:
                    if dt <= dt_optimal:
                        max_u[i] = max_u_tp * (dt - dt_early) / (dt_optimal - dt_early)
                    else:
                        max_u[i] = max_u_tp * (dt_late - dt) / (dt_late - dt_optimal)
                
                # Actual Prediction Utility
                if preds[i] == 1: # Positive Prediction
                    if dt >= dt_early and dt <= dt_late:
                        # True Positive equivalent
                        if dt <= dt_optimal:
                            u[i] = max_u_tp * (dt - dt_early) / (dt_optimal - dt_early)
                        else:
                            u[i] = max_u_tp * (dt_late - dt) / (dt_late - dt_optimal)
                    else:
                        # False Positive equivalent (predicting too late, or too early)
                        u[i] = u_fp
                else: # Negative Prediction
                    if dt >= dt_early and dt <= dt_late:
                        # False Negative equivalent (missed sepsis window)
                        u[i] = 0.0 # Standard challenge doesn't strictly penalize FN per hour, but utility is 0
                    else:
                        u[i] = u_tn
        else:
            # Non-Sepsis Patient
            for i in range(len(labels)):
                if preds[i] == 1:
                    u[i] = u_fp # False Positive
                else:
                    u[i] = u_tn # True Negative
                    
            # A perfect classifier has no false positives
            # Max utility for non-sepsis is 0
            # Min utility is sum(u_fp) (though bounded by challenge metrics conceptually)
            max_u[:] = u_tn
            
        utility_total += np.sum(u)
        max_utility_total += np.sum(max_u)
        
    return utility_total / max_utility_total if max_utility_total > 0 else 0.0
