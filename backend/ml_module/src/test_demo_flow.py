from predictor_service import predict_sepsis
import json
import os

def test_demo():
    print("=== WARDIAN ML DEMO FLOW TEST ===")
    
    # 1. Test the "SAFE" Patient (Real Baseline from Patient 005159)
    # This patient was historically healthy/stable.
    safe_payload = {
        "HR": 72.0,
        "Temp": 36.6,
        "SBP": 120.0,
        "Resp": 16.0
    }
    
    print("\n[SCENARIO 1] Updating 'Safe' Patient 005159...")
    try:
        result_safe = predict_sepsis("safe", safe_payload)
        print(f"Outcome: Probability {result_safe['sepsis_probability'] * 100:.1f}% | Sepsis Flag: {result_safe['is_sepsis']}")
        # Top driver for a safe patient often includes stable vitals or low clinical intensity
        print(f"Primary Driver: {result_safe['top_drivers'][0]['feature']} ({result_safe['top_drivers'][0]['shap_impact']:.4f})")
    except Exception as e:
        print(f"Error testing safe patient: {e}")

    print("-" * 50)

    # 2. Test the "SEPSIS" Patient (Real Baseline from Patient 100232)
    # We are simulating the 'Hour 25' crash for a patient who actually developed sepsis.
    crash_payload = {'': 25, 'HR': 87.0, 'O2Sat': 96.0, 'MAP': 88.0, 'Resp': 25.0, 'FiO2': 0.4, 'Age': 32.99, 'Gender': 1, 'ICULOS': 26}
    
    print("\n[SCENARIO 2] CRASH DETECTED for Sepsis Patient 100232...")
    try:
        result_sepsis = predict_sepsis("sepsis", crash_payload)
        print(f"Outcome: Probability {result_sepsis['sepsis_probability'] * 100:.1f}% | Sepsis Flag: {result_sepsis['is_sepsis']}")
        print("Top 3 Drivers for this Alert:")
        for i, driver in enumerate(result_sepsis['top_drivers'][:3], 1):
            print(f"  {i}. {driver['feature']}: Impact {driver['shap_impact']:.4f}")
            
        if result_sepsis['is_sepsis']:
            print("\n>>> ALERT: SEPSIS PREDICTION TRIGGERED (Threshold 0.75 exceeded)")
    except Exception as e:
        print(f"Error testing sepsis patient: {e}")

if __name__ == "__main__":
    test_demo()
