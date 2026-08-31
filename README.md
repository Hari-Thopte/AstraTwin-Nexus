# AstraTwin Nexus

AstraTwin Nexus is a decision-support simulation for the **Lunar South Pole Expedition**. The active mission is limited to the Moon, the Lunar South Pole, and three simulated assets: the **Astra-1** rover, **Nova** reconnaissance drone, and **Selene** base station.

> This prototype uses simulated telemetry and does not control spacecraft.

## Problem statement

Lunar surface missions must manage scarce energy, difficult terrain, thermal limits, scientific objectives, and delayed or unavailable communication with Earth. A developing rover problem can appear across several sensors rather than as one clear alarm. Operators need to understand which values were observed, which relationships were inferred, what method produced each result, and which actions still require human approval.

The project addresses that review problem without presenting authored demo values as measured facts or calibrated probabilities.

## Selected challenge theme

**AI for Resilient Space Exploration and Scientific Discovery**

The prototype demonstrates how transparent anomaly detection, multi-asset coordination, scenario comparison, and human-gated decisions can support a lunar mission while preserving its science record.

## Solution description

The application provides nine task-specific views:

- Mission Control for the mission state, assets, map, communication, and phase timeline.
- Digital Twin Inspection for component health and supporting telemetry.
- Telemetry Analysis for fixed, seeded sensor samples, ranges, gaps, outliers, and raw data.
- Incident Intelligence for observations, detection, evidence, inference, prediction, recommendation, limitations, and relationship metadata.
- Mission Council Review for role-specific rule outputs, evidence, trade-offs, limitations, and human approval.
- Future Comparison for three deterministic sensitivity branches.
- Science Opportunity Review for candidate scoring and evidence.
- Mission Memory for the scenario evidence graph, filters, rewind, and session events.
- Reports & Audit for export, method status, and the in-memory audit trail.

The built-in **Lunar Nightfall Rescue** loads a fixed contingency snapshot. It does not run continuously. Telemetry changes only when the user loads another seed or selects a scenario control.

## AI approach and architecture

```text
Seeded simulated telemetry
          |
          v
Threshold and cross-sensor rules ---- Backend Isolation Forest
          |                                      |
          +------------------+-------------------+
                             v
                  Incident relationship record
                             |
              +--------------+--------------+
              v                             v
     Deterministic risk rules      Failure stress formula
              |                             |
              +--------------+--------------+
                             v
                 Rule-based Mission Council
                             |
              +--------------+--------------+
              v                             v
       A* route service             Future sensitivity formulas
              |                             |
              +--------------+--------------+
                             v
                  Human approval and audit
```

The implementation deliberately separates the following categories:

- **Simulated data:** reproducible telemetry generated from a numeric seed.
- **Rules:** threshold checks, cross-sensor checks, component-health penalties, mission-risk weights, agent templates, and science scoring.
- **Models:** a backend Scikit-learn Isolation Forest supplements the anomaly rules.
- **Search:** the backend route service uses A* on a 12 by 8 cost grid.
- **Explanations:** optional watsonx.ai can reword supplied evidence, but it does not calculate risk, select a route, or approve an action.
- **Unsupported values:** confidence or probability values without a documented calculation are shown as `Not calculated` or `[NEEDS METHOD]`.

The **System Methods** table in Reports & Audit lists each capability, method, inputs, output origin, status, source file, and limitation. The shared mission configuration is stored in `frontend/src/config/mission.json`; both the React application and FastAPI backend read it.

## How IBM Bob was used

IBM Bob served as the primary AI-assisted engineering workspace throughout the development and refinement of AstraTwin Nexus. Rather than being used only for isolated code suggestions, Bob supported the project as an end-to-end development partner: helping inspect the existing React and FastAPI architecture, reason across frontend and backend behavior, identify inconsistencies, implement targeted improvements, and verify that the resulting application remained coherent as a complete mission-support prototype.

Bob contributed across several major areas of the project:

- **Architecture and codebase analysis:** Bob examined the existing application structure, traced data flow between the React interface and FastAPI services, and helped preserve the established architecture while substantial functionality and presentation improvements were introduced.
- **Mission consistency auditing:** Bob reviewed pages, components, configuration files, API services, and displayed terminology to ensure the product consistently represented the Lunar South Pole Expedition, its mission phases, and its three simulated assets: Astra-1, Nova, and Selene.
- **Evidence and claim traceability:** Bob helped connect interface claims to their underlying rules, formulas, telemetry inputs, backend services, and known limitations. This made it possible to distinguish clearly between simulated observations, deterministic calculations, model-assisted outputs, recommendations, and decisions requiring human approval.
- **Cross-stack implementation:** Bob assisted with coordinated changes across TypeScript, React, Zustand, FastAPI, Pydantic, SQLAlchemy, and Python service modules. This included following a feature from its visual presentation through state management and API behavior instead of treating each file as an isolated task.
- **Telemetry and method transparency:** Bob supported the implementation and documentation of seeded telemetry, reproducible scenarios, calculation metadata, method disclosures, source references, and explicit labels for values that were not calculated or scientifically validated.
- **Decision-support workflow refinement:** Bob helped strengthen the relationship between anomaly detection, incident intelligence, risk scoring, failure forecasting, route planning, Mission Council recommendations, future comparisons, science scoring, human approval, and audit history.
- **Interface and experience improvements:** Bob assisted in reorganizing dense mission information, improving visual hierarchy, refining responsive layouts, reducing ambiguity in operator controls, and checking complex views such as Mission Council at narrow screen widths.
- **Safety and human oversight:** Bob helped reinforce the prototype's human-in-the-loop design by separating automated analysis from operator authorization and by ensuring that recommendations, confidence limitations, approval requirements, and simulated actions were communicated clearly.
- **Verification and quality assurance:** Bob was used to run and interpret TypeScript checks, frontend production builds, Python tests, API checks, and mission consistency checks. It also helped trace failures back to their source and validate corrections across the affected parts of the application.
- **Documentation and final review:** Bob supported the preparation of project documentation, the explanation of technical methods and limitations, and the final review of the prototype against its stated mission, evidence, transparency, and usability goals.

This made IBM Bob more than a code-generation utility for the project. It functioned as a collaborative engineering environment for understanding the system, planning changes, implementing them in context, reviewing their impact, and repeatedly validating the application as an integrated whole. Bob accelerated work that would otherwise have required extensive manual navigation between UI components, shared configuration, backend services, tests, and documentation, while still keeping technical decisions and final approval under human control.

All changes were made within the existing project rather than by replacing it with a newly generated application. AstraTwin Nexus remains a decision-support prototype built on simulated mission data; it does not control spacecraft, and every operator action affects only the simulated environment.

## Implemented methods and limits

| Capability | Current method | Status | Main limitation |
|---|---|---|---|
| Telemetry | Seeded sine variation and bounded stage offsets | Simulated | Not live spacecraft data |
| Component health | Deterministic penalty and clamp rules | Rule-based | Not a validated degradation model |
| Mission risk | Explicit weighted deterministic formula | Rule-based | Prototype policy weights |
| Anomaly detection | Thresholds, cross-sensor rule, Isolation Forest | Implemented in backend | Frontend incident is a fixed fixture |
| Failure prediction | Deterministic stress formula and recent trends | Rule-based in backend | Not trained on lunar failure outcomes |
| Route planning | A* on a 12 by 8 cost grid | Implemented in backend | Frontend fallback route is static |
| Mission Council | Role-specific templates | Rule-based | Confidence is not calibrated |
| Future comparison | Deterministic weighted formulas | Simulated calculation | Not a calibrated forecast |
| Science score | Published weighted formula | Rule-based | Inputs are scenario fixtures |

## Technology

- Frontend: React 18, Vite, TypeScript, React Router, Zustand, Recharts, Three.js, Tailwind CSS
- Backend: FastAPI, Pydantic, SQLAlchemy, Scikit-learn, SQLite
- Optional explanation provider: IBM watsonx.ai

## Run locally

Prerequisites: Node.js 18+, npm 9+, and Python 3.11+.

Backend:

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
python -m uvicorn app.main:app --reload --port 8000
```

Frontend, in another terminal:

```powershell
cd frontend
npm install
npm run dev
```

- Application: `http://localhost:3000`
- API documentation: `http://localhost:8000/api/docs`

## Verification

```powershell
cd frontend
npm run lint
npm run test:consistency
npm run build

cd ..\backend
python -m pytest -q
```

The consistency check rejects active mission references that conflict with the shared Moon mission, repeated full-page disclaimers, missing method metadata, and unsupported active destination controls.

## Optional watsonx.ai configuration

Copy `.env.example` to `.env` and provide your own credentials:

```text
WATSONX_API_KEY=
WATSONX_PROJECT_ID=
WATSONX_URL=https://us-south.ml.cloud.ibm.com
WATSONX_MODEL_ID=ibm/granite-3-8b-instruct
```

Without credentials, the project uses its deterministic local explanation provider.
