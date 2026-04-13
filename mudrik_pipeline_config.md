# Mudrik Multi-Agent Pipeline Configuration

## Architecture Overview
Mudrik proposal generation now follows a strict multi-agent pipeline and no longer uses single-prompt end-to-end drafting.

## Agent Sequence
1. **Agent 1 — The Extractor**
   - Input: Raw tender document (Kraasa)
   - Output: Strict JSON only
   - JSON scope: technical specs, timelines, mandatory SBC/SASO standards
   - Constraint: zero narrative prose

2. **Agent 2 — The Architect**
   - Input: Extractor JSON
   - Output: rigid granular outline
   - Structure: `Volume > Section > Sub-section`

3. **Agent 3 — The Micro-Drafter**
   - Input: one specific outline node (single sub-section at a time, e.g. `1.1.1`)
   - Output: drafted Arabic technical text for that node only
   - Constraint: must use Few-Shot golden examples to preserve consultancy-grade technical tone

4. **Agent 4 — The Red-Team Auditor**
   - Input: Micro-drafted sub-section
   - Output: audited and finalized sub-section text
   - Responsibilities: remove AI-fluff patterns, enforce compliance language, ensure technical rigor

## Generation Hyperparameters (for API integration)
- Temperature: `0.1 - 0.2`
- Presence penalty: `0.5`
- Frequency penalty: `0.5`

## Operating Rule
- Do not execute the next agent until the previous agent output is accepted.
- Current status: waiting for user input to start **Agent 1 (The Extractor)**.
