# Mesh platform vocabulary (canonical)

## Scope

**Mesh** synchronization **platform** (`/mesh` routes, mesh API, domain model): meshes, depots, sync links, sessions, plans, conflicts, connectors. Separate product surface from the **file manager** workspace and from **NSYNC** pane sync ([nsync-multi-target-vocabulary.md](nsync-multi-target-vocabulary.md)). Excludes connector implementation algorithms.

## Traceability

| Kind | Tokens / artifacts |
| --- | --- |
| REQ | [REQ-MESH_PLATFORM](../tied/requirements/REQ-MESH_PLATFORM.yaml), [REQ-MESH_DOMAIN_MODEL](../tied/requirements/REQ-MESH_DOMAIN_MODEL.yaml), child REQs `REQ-MESH_*` in [requirements.yaml](../tied/requirements.yaml) |
| ARCH | [ARCH-MESH_LAYERED](../tied/architecture-decisions/ARCH-MESH_LAYERED.yaml) and related `ARCH-MESH_*` |
| IMPL | `IMPL-MESH_*` family — e.g. [IMPL-MESH_DOMAIN_TYPES](../tied/implementation-decisions/IMPL-MESH_DOMAIN_TYPES.yaml), [IMPL-MESH_RUNTIME](../tied/implementation-decisions/IMPL-MESH_RUNTIME.yaml), [IMPL-MESH_CRUD](../tied/implementation-decisions/IMPL-MESH_CRUD.yaml) |
| Pseudo-code | `tied/implementation-decisions/IMPL-MESH_*-pseudocode.md` |

## Preferred term vs synonyms

| Preferred | Synonyms / notes |
| --- | --- |
| **Mesh** | “sync mesh”, sponsor label — not “graph” (use **topology** for structure) |
| **Depot** | “store”, “endpoint”, “root path” — a mesh-attached storage location |
| **Sync link** | “edge”, “relationship” — directed link between depots with policy |
| **Mesh record** | Persisted mesh document — not “project” |
| **Sync session** | “run”, “job” — approved plan execution context |
| **Dry-run plan** | “plan preview”, `isDryRun` — no mutating execute |
| **Change set** | Approved list of operations for a session |
| **Conflict** | Registered divergence requiring resolution — not “compare state” (file manager) |
| **Connector** | Adapter implementing list/copy for a depot **kind** (`fake`, `local`, `remote`, …) |
| **Credential reference** | Masked secret handle — never serialized plaintext ([REQ-MESH_PLATFORM](../tied/requirements/REQ-MESH_PLATFORM.yaml)) |
| **Plan approval** | Approve-only on Plan page — creates/approves session, does not start execution |
| **Sync start** | Start approved session on Sync Now page — may require `confirmedDestructive` |
| **Approved session handoff** | `sessionStorage` bridge storing approved `sessionId` from Plan → Sync |
| **Remote depot** | Depot `kind: remote` — uses **Remote connector** stub (no live network I/O) |
| **Remote connector** | Contract-compliant stub; `healthCheck` reports not configured |
| **Session progress** | `{ completed, failed, total }` counters during execution |
| **Archived mesh** | Soft-archived mesh hidden from default list; history retained ([REQ-MESH_CRUD](../tied/requirements/REQ-MESH_CRUD.yaml)) |
| **Per-mesh schedule** | Interval/cron metadata and due detection ([REQ-MESH_SCHEDULE](../tied/requirements/REQ-MESH_SCHEDULE.yaml)) |
| **Mesh hub route** | Global `/mesh/...` page without `:meshId` (informational shells); mesh **detail** routes use **`/mesh/:meshId/**` |
| **Virtual depot** | Depot `kind: virtual` — **VirtualConnector** synthetic inventory ([REQ-MESH_REAL_CONNECTORS](../tied/requirements/REQ-MESH_REAL_CONNECTORS.yaml)) |
| **Default connector fallback** | When `kind` is unknown/unregistered — **VirtualConnector** (synthetic stub), not a live filesystem connector |

## Naming bridge

| Canonical concept | UI (Mesh GUI) | API / code | Pseudo-code prefix |
| --- | --- | --- | --- |
| Mesh hub (Depots/Policies/Sync) | `global-depots-page`, policies copy, Sync landing | `/mesh/depots`, `/mesh/policies`, `/mesh/sync` | `IMPL-MESH_GUI_layout` |
| Credential store | (API only) | `POST /api/mesh/credentials` | `IMPL-MESH_API_credentials` |
| Mesh list | list view | `GET /api/mesh` | `IMPL-MESH_GUI_list` |
| Create mesh | create form | `POST /api/mesh` | `IMPL-MESH_CRUD_createMesh` |
| Topology graph | topology screen | validate + project | `IMPL-MESH_TOPOLOGY_validateTopology` |
| Generate plan | plan view, `generate-plan-btn` | `POST /plan` | `IMPL-MESH_RUNTIME_generatePlan` |
| Plan approval | plan view, `approve-plan-btn`, `plan-approved` | `POST /sessions` create + approve | `IMPL-MESH_GUI_plan` |
| Approved session handoff | (browser) | `sessionStorage` approved session id | `IMPL-MESH_GUI_plan` |
| Sync start | Sync Now, `start-sync-btn` | `POST /sessions` action start | `IMPL-MESH_GUI_sync` |
| Session progress | active session view | `GET /sessions?sessionId=` | `IMPL-MESH_RUNTIME_getSessionProgress` |
| Run session | sync action | `runApprovedSession` | `IMPL-MESH_RUNTIME_runApprovedSession` |
| Depot CRUD | depot editor | depot routes | `IMPL-MESH_DEPOT_*` |
| Export mesh | export page | `GET /export` | `IMPL-MESH_GUI_export` |
| Archive mesh | settings, `archive-mesh-btn` | mesh archive API | `IMPL-MESH_GUI_archive` |
| Schedule | schedule page | schedule routes | `IMPL-MESH_GUI_schedule` |

## Named concepts

- **Mesh** — Top-level aggregate: depots, sync links, policy, metadata; validated by `VALIDATE_MESH`.
- **Depot** — Named storage endpoint on a mesh; has `kind` and connection attributes.
- **Sync link** — Connects two depots with direction and filters; validated against mesh depot set.
- **Policy** — Path filters, safety flags, defaults (`DEFAULT_POLICY`, `VALIDATE_POLICY`).
- **Mesh hub route** — Global mesh shell page (no `:meshId`); contrasts with **mesh detail** routes.
- **Mesh runtime** — Facade for authorize → plan → session → execute (`MeshRuntime`).
- **Mesh repository** — Persistence (`JsonMeshRepository`, `createMeshRepository`).
- **Role / permission** — `IMPL-MESH_AUTH_can`, `require`; header `parseMeshRole`.

## Pseudo-code block names

| Preferred term / concept | UPPER_SNAKE block | Owning IMPL |
| --- | --- | --- |
| Validate mesh aggregate | `VALIDATE_MESH` → `IMPL-MESH_DOMAIN_TYPES_VALIDATE_MESH` | IMPL-MESH_DOMAIN_TYPES |
| Validate depot | `VALIDATE_DEPOT` → `IMPL-MESH_DOMAIN_TYPES_VALIDATE_DEPOT` | IMPL-MESH_DOMAIN_TYPES |
| Validate sync link | `VALIDATE_SYNC_LINK` → `IMPL-MESH_DOMAIN_TYPES_VALIDATE_SYNC_LINK` | IMPL-MESH_DOMAIN_TYPES |
| Topology validation | `validateTopology` → `IMPL-MESH_TOPOLOGY_validateTopology` | IMPL-MESH_TOPOLOGY |
| Create mesh | `createMesh` → `IMPL-MESH_CRUD_createMesh` | IMPL-MESH_CRUD |
| Generate plan | `generatePlan` → `IMPL-MESH_RUNTIME_generatePlan` | IMPL-MESH_RUNTIME |
| Plan approval (GUI) | `IMPL-MESH_GUI_plan` | IMPL-MESH_GUI |
| Sync start (GUI) | `IMPL-MESH_GUI_sync` | IMPL-MESH_GUI |
| Session progress | `getSessionProgress` → `IMPL-MESH_RUNTIME_getSessionProgress` | IMPL-MESH_RUNTIME |
| Cancel execution flag | `cancelSessionExecution` | IMPL-MESH_RUNTIME |
| Remote connector | `IMPL-MESH_CONNECTOR_remote` | IMPL-MESH_CONNECTOR |
| Execute approved session | `runApprovedSession` → `IMPL-MESH_RUNTIME_runApprovedSession` | IMPL-MESH_RUNTIME |
| Register conflict | `registerConflict` → `IMPL-MESH_CONFLICT_registerConflict` | IMPL-MESH_CONFLICT |
| Execute operations | `executeOperations` → `IMPL-MESH_EXECUTOR_executeOperations` | IMPL-MESH_EXECUTOR |

## Alphabetical index

- **Approved session handoff** — Plan → Sync via `sessionStorage`
- **Archived mesh** — soft-archived; excluded from default list
- **Mesh hub route** — global `/mesh/...` placeholder without `:meshId`
- **Credential store API** — `POST /api/mesh/credentials` (masked **credential references** only)
- **Change set** — approved operations batch
- **Conflict** — mesh-level resolution item
- **Connector** — depot access adapter
- **Credential reference** — masked secret pointer
- **Depot** — mesh storage endpoint
- **Dry-run plan** — non-mutating plan
- **Per-mesh schedule** — automated sync interval metadata
- **Plan approval** — approve session without starting sync
- **Remote connector** — stub adapter for `remote` depots
- **Remote depot** — depot kind using remote connector stub
- **Mesh** — top-level sync configuration
- **Mesh runtime** — orchestration facade
- **Sync link** — depot-to-depot link
- **Session progress** — completed/failed/total counters during run
- **Sync session** — plan execution instance
- **Sync start** — begin approved session on Sync Now page
- **Topology** — graph validation/projection

## See also

- [panorama-domain-references.md](panorama-domain-references.md)
- [nsync-multi-target-vocabulary.md](nsync-multi-target-vocabulary.md) — file-manager multi-pane sync (different subsystem)
