# sync-mesh deployment phase status

Living checklist aligning [prompts/sync-mesh.md](../prompts/sync-mesh.md) with REQ-MESH_PLATFORM. Status meanings: **done** (~acceptance satisfied in code/tests), **partial** (stub or subset), **pending** (not started).

**Persistence note (Phase 16):** relational DB+migrations deferred; mesh configuration is in `meshes.json` via [`JsonMeshRepository`](../src/lib/mesh/repositories/json-mesh-repository.ts). When `MESH_DATA_DIR` is set, [`SessionService`](../src/lib/mesh/services/session-service.ts) writes `sync-sessions.json` (sessions + approved plans) and [`EventService`](../src/lib/mesh/services/event-service.ts) writes `sync-events.json` (`[IMPL-MESH_PERSISTENCE]`).

| Phase | Name | Status | Primary pointers |
|------:|------|--------|------------------|
| 1 | domain_language_and_core_types | done | [`src/lib/mesh/domain/`](../src/lib/mesh/domain/), validators + serialize tests |
| 2 | mesh_crud_unit_logic | done | [`mesh-service.ts`](../src/lib/mesh/services/mesh-service.ts), [`mesh-service.test.ts`](../src/lib/mesh/services/mesh-service.test.ts) |
| 3 | depot_crud_unit_logic | done | [`depot-service.ts`](../src/lib/mesh/services/depot-service.ts), depot tests |
| 4 | connector_unit_logic | done | Connector contract + Fake + Local + Remote + **VirtualConnector** [`virtual-connector.ts`](../src/lib/mesh/connector/virtual-connector.ts) |
| 5 | mesh_depot_composition | done | [`depot-service.ts`](../src/lib/mesh/services/depot-service.ts), composition tests |
| 6 | sync_link_and_topology_logic | done | [`topology-service.ts`](../src/lib/mesh/services/topology-service.ts), API links routes |
| 7 | policy_and_filter_unit_logic | done | [`policy-service.ts`](../src/lib/mesh/services/policy-service.ts) |
| 8 | credential_reference_logic | done | [`credential-service.ts`](../src/lib/mesh/services/credential-service.ts), credentials API |
| 9 | inventory_scan_logic | done | [`inventory-service.ts`](../src/lib/mesh/services/inventory-service.ts) |
| 10 | change_planning_logic | done | [`planning-service.ts`](../src/lib/mesh/services/planning-service.ts); pagination helper on plan POST |
| 11 | conflict_logic | done | [`conflict-service.ts`](../src/lib/mesh/services/conflict-service.ts), conflicts API + GUI |
| 12 | sync_session_lifecycle_logic | partial | [`session-service.ts`](../src/lib/mesh/services/session-service.ts); persists to `sync-sessions.json` when `MESH_DATA_DIR` set; cross-process session resume still deferred |
| 13 | operation_execution_logic | done | [`executor-service.ts`](../src/lib/mesh/services/executor-service.ts); retries + backoff wired from runtime |
| 14 | event_log_and_audit_logic | partial | [`event-service.ts`](../src/lib/mesh/services/event-service.ts); append-only `sync-events.json` when `MESH_DATA_DIR` set; no rotation/capped retention yet |
| 15 | api_layer_for_mesh_management | partial | [`src/app/api/mesh/`](../src/app/api/mesh/) + Vitest route tests |
| 16 | persistence_layer | partial (JSON)| [`json-mesh-repository.ts`](../src/lib/mesh/repositories/json-mesh-repository.ts), [`json-mesh-repository.test.ts`](../src/lib/mesh/repositories/json-mesh-repository.test.ts) |
| 17 | menu_interface | partial | [`src/app/mesh/layout.tsx`](../src/app/mesh/layout.tsx), nav testIds; E2E nav probes |
| 18 | mesh_list_and_detail_gui | done | Mesh list/detail clients + routes |
| 19 | topology_graph_gui | partial | [`TopologyGraphClient.tsx`](../src/app/mesh/components/TopologyGraphClient.tsx) + tests |
| 20 | dry_run_plan_gui | partial | [`PlanViewClient.tsx`](../src/app/mesh/components/PlanViewClient.tsx) |
| 21 | interactive_sync_gui | partial | [`SyncSessionClient.tsx`](../src/app/mesh/components/SyncSessionClient.tsx) |
| 22 | conflict_resolution_gui | partial | [`ConflictsClient.tsx`](../src/app/mesh/components/ConflictsClient.tsx) |
| 23 | safety_and_guardrails | partial | [`safety-service.ts`](../src/lib/mesh/services/safety-service.ts), plan/sessions API guards |
| 24 | roles_permissions_and_audit | partial | [`authorization-service.ts`](../src/lib/mesh/services/authorization-service.ts), `x-mesh-role`, E2E |
| 25 | scheduling_and_automation | partial | [`schedule-service.ts`](../src/lib/mesh/services/schedule-service.ts), mesh schedule routes |
| 26 | monitoring_history_and_reporting | partial | Monitoring + history/logs clients, [`monitoring/route.ts`](../src/app/api/mesh/monitoring/route.ts) |
| 27 | configuration_import_export | done | Export/import APIs + GUI; [`import-export-service.ts`](../src/lib/mesh/services/import-export-service.ts) |
| 28 | system_integration_with_real_connectors | partial | Local FS + Remote + **VirtualConnector** wired for `kind: "virtual"` in [`mesh-runtime.ts`](../src/lib/mesh/runtime/mesh-runtime.ts) |
| 29 | pre_release_hardening | partial | Concurrency limiter, **executor retry backoff**, **approx-byte bandwidth pacing** hook, **`configurationVersion`** on [`MeshRecord`](../src/lib/mesh/mesh-record.ts) / optimistic PATCH (`expectedConfigurationVersion`) / pagination on [`POST …/plan`](../src/app/api/mesh/[meshId]/plan/route.ts); resumable cross-process sessions deferred |
| 30 | final_e2e_release_validation | partial | [`e2e/mesh-sync.spec.ts`](../e2e/mesh-sync.spec.ts)—major flows covered |

**Release gates:** see `release_gates` in prompts/sync-mesh.md; CI should run Vitest mesh suite + targeted Playwright `mesh-sync` spec.
