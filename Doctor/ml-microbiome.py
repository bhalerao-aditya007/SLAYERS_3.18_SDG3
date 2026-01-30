#!/usr/bin/env python3
"""
HIV Microbiome ML Analysis with Explainable AI
Analyzes microbiome data from HIV+ and HIV- patients using multiple ML models
with comprehensive XAI techniques
"""

import pandas as pd
import numpy as np
import pickle
import warnings
warnings.filterwarnings('ignore')

# ML Libraries
from sklearn.model_selection import train_test_split, cross_val_score, StratifiedKFold
from sklearn.preprocessing import StandardScaler, LabelEncoder
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.svm import SVC
from sklearn.metrics import (classification_report, confusion_matrix, 
                            accuracy_score, roc_auc_score, roc_curve,
                            precision_recall_curve, f1_score)

# XAI Libraries
from sklearn.inspection import permutation_importance
from sklearn.tree import DecisionTreeClassifier

# Visualization
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import seaborn as sns

print("="*80)
print("HIV MICROBIOME ML ANALYSIS WITH EXPLAINABLE AI")
print("="*80)

# ============================================================================
# PART 1: DATA LOADING AND PREPROCESSING
# ============================================================================
print("\n[1/7] Loading and preprocessing data...")

def load_dataset(metadata_path, otu_path, dataset_name):
    """Load and merge metadata with OTU table"""
    print(f"\n  Loading {dataset_name} dataset...")
    
    # Load metadata
    metadata = pd.read_csv(metadata_path, sep='\t', low_memory=False)
    print(f"    - Metadata shape: {metadata.shape}")
    
    # Load OTU table
    otu_table = pd.read_csv(otu_path, sep='\t', index_col=0)
    print(f"    - OTU table shape: {otu_table.shape}")
    
    # Transpose OTU table so samples are rows
    otu_table = otu_table.T
    
    # Determine the sample name column
    sample_col_candidates = ['Sample_Name_s', 'new_sample_name', 'sample_name', 'SampleID']
    sample_col = None
    for col in sample_col_candidates:
        if col in metadata.columns:
            sample_col = col
            break
    
    if sample_col is None:
        # Use first column as sample names
        sample_col = metadata.columns[0]
        print(f"    - Using first column as sample names: {sample_col}")
    
    metadata[sample_col] = metadata[sample_col].astype(str)
    otu_table.index = otu_table.index.astype(str)
    
    merged_data = metadata.merge(otu_table, left_on=sample_col, 
                                  right_index=True, how='inner')
    
    print(f"    - Merged data shape: {merged_data.shape}")
    
    # Check for disease state column
    disease_col_candidates = ['DiseaseState', 'hiv_status', 'disease', 'status']
    disease_col = None
    for col in disease_col_candidates:
        if col in merged_data.columns:
            disease_col = col
            break
    
    if disease_col and disease_col != 'DiseaseState':
        merged_data['DiseaseState'] = merged_data[disease_col]
    
    if 'DiseaseState' in merged_data.columns:
        print(f"    - HIV+ samples: {(merged_data['DiseaseState'].isin(['HIV', 'HIV+', 'positive', '1'])).sum()}")
        print(f"    - HIV- samples: {(merged_data['DiseaseState'].isin(['H', 'HIV-', 'negative', '0', 'Control'])).sum()}")
    
    return merged_data

# Load both datasets
dinh_data = load_dataset(
    '/mnt/user-data/uploads/hiv_dinh_metadata.txt',
    '/mnt/user-data/uploads/hiv_dinh_otu_table_100_denovo.rdp_assigned',
    'Dinh'
)

lozupone_data = load_dataset(
    '/mnt/user-data/uploads/hiv_lozupone_metadata.txt',
    '/mnt/user-data/uploads/hiv_lozupone_otu_table_100_denovo.rdp_assigned',
    'Lozupone'
)

# Combine datasets
print("\n  Combining datasets...")
combined_data = pd.concat([dinh_data, lozupone_data], axis=0, ignore_index=True)
print(f"    - Combined data shape: {combined_data.shape}")

# ============================================================================
# PART 2: FEATURE ENGINEERING
# ============================================================================
print("\n[2/7] Feature engineering...")

# Identify OTU columns (those starting with 'k__Bacteria')
otu_columns = [col for col in combined_data.columns if col.startswith('k__Bacteria')]
print(f"    - Number of OTU features: {len(otu_columns)}")

# Identify metadata columns of interest
metadata_numeric_cols = ['BMI_s', 'age_s', 'Current_CD4_count_s', 
                         'FsCD14_s', 'crpro_s', 'total_reads']

# Clean and convert metadata columns
for col in metadata_numeric_cols:
    if col in combined_data.columns:
        combined_data[col] = pd.to_numeric(combined_data[col], errors='coerce')

# Create feature matrix
X_otu = combined_data[otu_columns].fillna(0)

# Add metadata features if available
X_metadata = combined_data[metadata_numeric_cols].fillna(combined_data[metadata_numeric_cols].median())
X = pd.concat([X_otu, X_metadata], axis=1)

# Create target variable (HIV+ = 1, HIV- = 0)
# Handle different disease state encodings
if 'DiseaseState' in combined_data.columns:
    y = combined_data['DiseaseState'].isin(['HIV', 'HIV+', 'positive', '1']).astype(int)
else:
    print("    WARNING: No disease state column found. Cannot proceed with classification.")
    raise ValueError("Disease state column not found in merged data")

print(f"    - Final feature matrix shape: {X.shape}")
print(f"    - Target distribution: HIV+=({y.sum()}) HIV-=({len(y)-y.sum()})")

# Feature selection: Remove low-variance features
from sklearn.feature_selection import VarianceThreshold
selector = VarianceThreshold(threshold=0.01)
X_selected = selector.fit_transform(X)
selected_feature_names = X.columns[selector.get_support()].tolist()

print(f"    - Features after variance filtering: {len(selected_feature_names)}")

# ============================================================================
# PART 3: TRAIN-TEST SPLIT
# ============================================================================
print("\n[3/7] Splitting data...")

X_train, X_test, y_train, y_test = train_test_split(
    X_selected, y, test_size=0.2, random_state=42, stratify=y
)

print(f"    - Training set: {X_train.shape[0]} samples")
print(f"    - Test set: {X_test.shape[0]} samples")

# Standardize features
scaler = StandardScaler()
X_train_scaled = scaler.fit_transform(X_train)
X_test_scaled = scaler.transform(X_test)

# ============================================================================
# PART 4: MODEL TRAINING
# ============================================================================
print("\n[4/7] Training multiple ML models...")

models = {
    'Random Forest': RandomForestClassifier(n_estimators=100, random_state=42, 
                                           max_depth=10, n_jobs=-1),
    'Gradient Boosting': GradientBoostingClassifier(n_estimators=100, random_state=42,
                                                    max_depth=5),
    'Logistic Regression': LogisticRegression(random_state=42, max_iter=1000),
    'SVM': SVC(kernel='rbf', probability=True, random_state=42)
}

results = {}

for model_name, model in models.items():
    print(f"\n  Training {model_name}...")
    
    # Train model
    model.fit(X_train_scaled, y_train)
    
    # Predictions
    y_pred = model.predict(X_test_scaled)
    y_pred_proba = model.predict_proba(X_test_scaled)[:, 1] if hasattr(model, 'predict_proba') else None
    
    # Metrics
    accuracy = accuracy_score(y_test, y_pred)
    f1 = f1_score(y_test, y_pred)
    
    # Cross-validation
    cv_scores = cross_val_score(model, X_train_scaled, y_train, cv=5, scoring='accuracy')
    
    results[model_name] = {
        'model': model,
        'accuracy': accuracy,
        'f1_score': f1,
        'cv_mean': cv_scores.mean(),
        'cv_std': cv_scores.std(),
        'y_pred': y_pred,
        'y_pred_proba': y_pred_proba,
        'confusion_matrix': confusion_matrix(y_test, y_pred),
        'classification_report': classification_report(y_test, y_pred)
    }
    
    print(f"    - Test Accuracy: {accuracy:.4f}")
    print(f"    - F1 Score: {f1:.4f}")
    print(f"    - CV Accuracy: {cv_scores.mean():.4f} (+/- {cv_scores.std():.4f})")

# Select best model based on F1 score
best_model_name = max(results, key=lambda x: results[x]['f1_score'])
best_model = results[best_model_name]['model']
print(f"\n  Best Model: {best_model_name}")

# ============================================================================
# PART 5: EXPLAINABLE AI (XAI)
# ============================================================================
print("\n[5/7] Generating Explainable AI insights...")

# 5.1: Feature Importance (for Random Forest and Gradient Boosting)
print("\n  Computing feature importances...")

feature_importance_results = {}

if best_model_name in ['Random Forest', 'Gradient Boosting']:
    importances = best_model.feature_importances_
    feature_importance_df = pd.DataFrame({
        'feature': selected_feature_names,
        'importance': importances
    }).sort_values('importance', ascending=False)
    
    feature_importance_results['top_features'] = feature_importance_df.head(20)
    print(f"    - Top 10 most important features:")
    for idx, row in feature_importance_df.head(10).iterrows():
        print(f"      {row['feature'][:60]}: {row['importance']:.4f}")

# 5.2: Permutation Importance (works for all models)
print("\n  Computing permutation importance...")

perm_importance = permutation_importance(
    best_model, X_test_scaled, y_test, 
    n_repeats=10, random_state=42, n_jobs=-1
)

perm_importance_df = pd.DataFrame({
    'feature': selected_feature_names,
    'importance_mean': perm_importance.importances_mean,
    'importance_std': perm_importance.importances_std
}).sort_values('importance_mean', ascending=False)

feature_importance_results['permutation_importance'] = perm_importance_df.head(20)

# 5.3: Decision Path Analysis (Alternative XAI for tree-based models)
print("\n  Computing decision path analysis...")

if best_model_name in ['Random Forest', 'Gradient Boosting']:
    try:
        # Get feature interactions from first few trees
        if best_model_name == 'Random Forest':
            # Analyze feature splits in random forest
            n_nodes = np.zeros(len(selected_feature_names))
            for tree in best_model.estimators_[:10]:  # First 10 trees
                for node_id in range(tree.tree_.node_count):
                    if tree.tree_.feature[node_id] != -2:  # Not a leaf
                        n_nodes[tree.tree_.feature[node_id]] += 1
        else:
            # For gradient boosting
            n_nodes = np.zeros(len(selected_feature_names))
            for stage in best_model.estimators_[:10]:
                tree = stage[0]
                for node_id in range(tree.tree_.node_count):
                    if tree.tree_.feature[node_id] != -2:
                        n_nodes[tree.tree_.feature[node_id]] += 1
        
        decision_importance_df = pd.DataFrame({
            'feature': selected_feature_names,
            'decision_nodes': n_nodes
        }).sort_values('decision_nodes', ascending=False)
        
        feature_importance_results['decision_importance'] = decision_importance_df.head(20)
        
        print(f"    - Top 10 features by decision node frequency:")
        for idx, row in decision_importance_df.head(10).iterrows():
            print(f"      {row['feature'][:60]}: {int(row['decision_nodes'])} nodes")
            
    except Exception as e:
        print(f"    - Decision path analysis warning: {str(e)[:100]}")
        feature_importance_results['decision_importance'] = None
else:
    # For non-tree models, analyze coefficient magnitudes
    if hasattr(best_model, 'coef_'):
        coef_importance = np.abs(best_model.coef_[0])
        coef_importance_df = pd.DataFrame({
            'feature': selected_feature_names,
            'coefficient': coef_importance
        }).sort_values('coefficient', ascending=False)
        
        feature_importance_results['coefficient_importance'] = coef_importance_df.head(20)
        
        print(f"    - Top 10 features by coefficient magnitude:")
        for idx, row in coef_importance_df.head(10).iterrows():
            print(f"      {row['feature'][:60]}: {row['coefficient']:.4f}")
    else:
        feature_importance_results['coefficient_importance'] = None

# ============================================================================
# PART 6: VISUALIZATION
# ============================================================================
print("\n[6/7] Creating visualizations...")

fig = plt.figure(figsize=(20, 12))

# 6.1: Model Comparison
ax1 = plt.subplot(2, 3, 1)
model_names = list(results.keys())
accuracies = [results[m]['accuracy'] for m in model_names]
f1_scores = [results[m]['f1_score'] for m in model_names]

x_pos = np.arange(len(model_names))
width = 0.35

ax1.bar(x_pos - width/2, accuracies, width, label='Accuracy', alpha=0.8)
ax1.bar(x_pos + width/2, f1_scores, width, label='F1 Score', alpha=0.8)
ax1.set_xlabel('Model')
ax1.set_ylabel('Score')
ax1.set_title('Model Performance Comparison')
ax1.set_xticks(x_pos)
ax1.set_xticklabels(model_names, rotation=45, ha='right')
ax1.legend()
ax1.grid(True, alpha=0.3)

# 6.2: Confusion Matrix
ax2 = plt.subplot(2, 3, 2)
cm = results[best_model_name]['confusion_matrix']
sns.heatmap(cm, annot=True, fmt='d', cmap='Blues', ax=ax2)
ax2.set_title(f'Confusion Matrix - {best_model_name}')
ax2.set_ylabel('True Label')
ax2.set_xlabel('Predicted Label')
ax2.set_xticklabels(['HIV-', 'HIV+'])
ax2.set_yticklabels(['HIV-', 'HIV+'])

# 6.3: ROC Curve
ax3 = plt.subplot(2, 3, 3)
for model_name in results:
    if results[model_name]['y_pred_proba'] is not None:
        fpr, tpr, _ = roc_curve(y_test, results[model_name]['y_pred_proba'])
        auc = roc_auc_score(y_test, results[model_name]['y_pred_proba'])
        ax3.plot(fpr, tpr, label=f'{model_name} (AUC={auc:.3f})')

ax3.plot([0, 1], [0, 1], 'k--', label='Random')
ax3.set_xlabel('False Positive Rate')
ax3.set_ylabel('True Positive Rate')
ax3.set_title('ROC Curves')
ax3.legend(fontsize=8)
ax3.grid(True, alpha=0.3)

# 6.4: Feature Importance (if available)
ax4 = plt.subplot(2, 3, 4)
if 'top_features' in feature_importance_results:
    top_features = feature_importance_results['top_features'].head(15)
    # Shorten feature names for display
    feature_labels = [f[:40] + '...' if len(f) > 40 else f 
                     for f in top_features['feature']]
    ax4.barh(range(len(top_features)), top_features['importance'])
    ax4.set_yticks(range(len(top_features)))
    ax4.set_yticklabels(feature_labels, fontsize=8)
    ax4.set_xlabel('Importance')
    ax4.set_title(f'Top 15 Features - {best_model_name}')
    ax4.invert_yaxis()
    ax4.grid(True, alpha=0.3, axis='x')

# 6.5: Permutation Importance
ax5 = plt.subplot(2, 3, 5)
top_perm = perm_importance_df.head(15)
feature_labels = [f[:40] + '...' if len(f) > 40 else f 
                 for f in top_perm['feature']]
ax5.barh(range(len(top_perm)), top_perm['importance_mean'], 
         xerr=top_perm['importance_std'])
ax5.set_yticks(range(len(top_perm)))
ax5.set_yticklabels(feature_labels, fontsize=8)
ax5.set_xlabel('Permutation Importance')
ax5.set_title('Top 15 Features - Permutation Importance')
ax5.invert_yaxis()
ax5.grid(True, alpha=0.3, axis='x')

# 6.6: Decision/Coefficient Importance (XAI alternative)
ax6 = plt.subplot(2, 3, 6)
if 'decision_importance' in feature_importance_results and feature_importance_results['decision_importance'] is not None:
    top_decision = feature_importance_results['decision_importance'].head(15)
    feature_labels = [f[:40] + '...' if len(f) > 40 else f 
                     for f in top_decision['feature']]
    ax6.barh(range(len(top_decision)), top_decision['decision_nodes'])
    ax6.set_yticks(range(len(top_decision)))
    ax6.set_yticklabels(feature_labels, fontsize=8)
    ax6.set_xlabel('Decision Node Frequency')
    ax6.set_title('Top 15 Features - Decision Path Analysis')
    ax6.invert_yaxis()
    ax6.grid(True, alpha=0.3, axis='x')
elif 'coefficient_importance' in feature_importance_results and feature_importance_results['coefficient_importance'] is not None:
    top_coef = feature_importance_results['coefficient_importance'].head(15)
    feature_labels = [f[:40] + '...' if len(f) > 40 else f 
                     for f in top_coef['feature']]
    ax6.barh(range(len(top_coef)), top_coef['coefficient'])
    ax6.set_yticks(range(len(top_coef)))
    ax6.set_yticklabels(feature_labels, fontsize=8)
    ax6.set_xlabel('|Coefficient|')
    ax6.set_title('Top 15 Features - Coefficient Magnitude')
    ax6.invert_yaxis()
    ax6.grid(True, alpha=0.3, axis='x')

plt.tight_layout()
plt.savefig('/home/claude/model_analysis_results.png', dpi=300, bbox_inches='tight')
print("    - Saved: model_analysis_results.png")

# ============================================================================
# PART 7: SAVE RESULTS
# ============================================================================
print("\n[7/7] Saving results...")

# Prepare comprehensive results package
results_package = {
    'models': results,
    'best_model_name': best_model_name,
    'best_model': best_model,
    'scaler': scaler,
    'feature_names': selected_feature_names,
    'feature_selector': selector,
    'X_train': X_train_scaled,
    'X_test': X_test_scaled,
    'y_train': y_train,
    'y_test': y_test,
    'feature_importance': feature_importance_results,
    'dataset_info': {
        'total_samples': len(X),
        'n_features': len(selected_feature_names),
        'n_otu_features': len(otu_columns),
        'hiv_positive': y.sum(),
        'hiv_negative': len(y) - y.sum(),
        'dinh_samples': len(dinh_data),
        'lozupone_samples': len(lozupone_data)
    }
}

# Save to pickle
with open('/home/claude/hiv_microbiome_ml_model.pkl', 'wb') as f:
    pickle.dump(results_package, f)

print("    - Saved: hiv_microbiome_ml_model.pkl")

# Create detailed text report
report_lines = [
    "="*80,
    "HIV MICROBIOME ML ANALYSIS - COMPREHENSIVE REPORT",
    "="*80,
    "",
    "DATASET INFORMATION:",
    f"  - Total samples: {len(X)}",
    f"  - HIV+ samples: {y.sum()} ({y.sum()/len(y)*100:.1f}%)",
    f"  - HIV- samples: {len(y) - y.sum()} ({(len(y)-y.sum())/len(y)*100:.1f}%)",
    f"  - Total features: {len(selected_feature_names)}",
    f"  - OTU features: {len(otu_columns)}",
    f"  - Metadata features: {len(metadata_numeric_cols)}",
    "",
    "MODEL PERFORMANCE:",
    ""
]

for model_name in results:
    report_lines.extend([
        f"{model_name}:",
        f"  - Test Accuracy: {results[model_name]['accuracy']:.4f}",
        f"  - F1 Score: {results[model_name]['f1_score']:.4f}",
        f"  - CV Accuracy: {results[model_name]['cv_mean']:.4f} (+/- {results[model_name]['cv_std']:.4f})",
        ""
    ])

report_lines.extend([
    f"BEST MODEL: {best_model_name}",
    "",
    "TOP 20 FEATURES BY IMPORTANCE:",
    ""
])

if 'top_features' in feature_importance_results:
    for idx, row in feature_importance_results['top_features'].head(20).iterrows():
        report_lines.append(f"  {idx+1}. {row['feature']}: {row['importance']:.6f}")

report_lines.extend([
    "",
    "TOP 20 FEATURES BY PERMUTATION IMPORTANCE:",
    ""
])

for idx, row in perm_importance_df.head(20).iterrows():
    report_lines.append(f"  {idx+1}. {row['feature']}: {row['importance_mean']:.6f} (+/- {row['importance_std']:.6f})")

if 'decision_importance' in feature_importance_results and feature_importance_results['decision_importance'] is not None:
    report_lines.extend([
        "",
        "TOP 20 FEATURES BY DECISION PATH ANALYSIS:",
        ""
    ])
    for idx, row in feature_importance_results['decision_importance'].head(20).iterrows():
        report_lines.append(f"  {idx+1}. {row['feature']}: {int(row['decision_nodes'])} nodes")
elif 'coefficient_importance' in feature_importance_results and feature_importance_results['coefficient_importance'] is not None:
    report_lines.extend([
        "",
        "TOP 20 FEATURES BY COEFFICIENT MAGNITUDE:",
        ""
    ])
    for idx, row in feature_importance_results['coefficient_importance'].head(20).iterrows():
        report_lines.append(f"  {idx+1}. {row['feature']}: {row['coefficient']:.6f}")

report_lines.extend([
    "",
    "="*80,
    "CLASSIFICATION REPORT (BEST MODEL):",
    "="*80,
    "",
    results[best_model_name]['classification_report'],
    "",
    "="*80,
    "KEY INSIGHTS:",
    "="*80,
    "",
    "1. The analysis identifies microbiome features that distinguish HIV+ from HIV- patients",
    "2. Multiple ML models were trained and evaluated for robustness",
    "3. Explainable AI techniques (permutation importance, decision paths) reveal feature importance",
    "4. The model can help identify bacterial taxa associated with HIV status",
    "5. Results saved in .pkl file for future use and deployment",
    "6. Feature importance analysis provides interpretable insights into model decisions",
    "",
    "="*80
])

report_text = "\n".join(report_lines)

with open('/home/claude/analysis_report.txt', 'w') as f:
    f.write(report_text)

print("    - Saved: analysis_report.txt")

print("\n" + "="*80)
print("ANALYSIS COMPLETE!")
print("="*80)
print(f"\nBest Model: {best_model_name}")
print(f"Test Accuracy: {results[best_model_name]['accuracy']:.4f}")
print(f"F1 Score: {results[best_model_name]['f1_score']:.4f}")
print("\nFiles saved:")
print("  - hiv_microbiome_ml_model.pkl (complete model package)")
print("  - analysis_report.txt (detailed text report)")
print("  - model_analysis_results.png (visualization)")
print("\n" + "="*80)
