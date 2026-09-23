#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Generator for PNet v8 SAD & FSD Documentation Suite
Produces Level 2 (02-features), Level 3 (03-diagrams), module-dependency.md, and INDEX.md
"""

import os
import sys

DOCS_DIR = "/docs"
FEATURES_DIR = os.path.join(DOCS_DIR, "02-features")
DIAGRAMS_DIR = os.path.join(DOCS_DIR, "03-diagrams")

# Ensure all subdirectories exist
groups = [
    "node-lifecycle",
    "network-topology",
    "console-access",
    "lab-management",
    "cluster-satellite",
    "netem-telemetry",
    "protocol-overlay",
    "lab-validation",
    "templates-images",
    "automation-ai",
    "user-security",
    "system-platform"
]

for g in groups:
    os.makedirs(os.path.join(FEATURES_DIR, g), exist_ok=True)
os.makedirs(DIAGRAMS_DIR, exist_ok=True)

print("Starting generation of Level 2 and Level 3 documentation...")
