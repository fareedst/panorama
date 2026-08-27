# IMPL-MESH_INVENTORY essence pseudocode

// [IMPL-MESH_INVENTORY] [ARCH-MESH_LAYERED] [REQ-MESH_PLATFORM]: Read-only depot inventory scan via connector health check, listing, and per-file stat metadata.

## Summary contract

// [IMPL-MESH_INVENTORY] [ARCH-MESH_LAYERED] [REQ-MESH_PLATFORM]: bound scan inputs, snapshot shape, and read-only control

```
IMPL-MESH_INVENTORY_Summary():
  INPUT: depot Depot; connector Connector
  OUTPUT: InventorySnapshot OR ConnectorError
  DATA: InventorySnapshot { depotId, scannedAt ISO-8601, entries[] }
  CONTROL: scan is read-only — must not mutate depot contents
  PRE: depot and connector available
  POST: snapshot with directory rows and file size/mtime entries or connector error
  EFFECTS: IO
  FAILURE_MODES: DEPOT_UNREACHABLE; LIST_FAILED
  TERMINATION: total
```

## ScanDepot

// [IMPL-MESH_INVENTORY] [ARCH-MESH_LAYERED] [REQ-MESH_PLATFORM]: how — verify connector health; list entries from depot root; collect directory rows and file size/mtime from stat (skip stat failures).

```
IMPL-MESH_INVENTORY_scanDepot(depot, connector):
  INPUT: depot Depot, connector Connector
  OUTPUT: InventorySnapshot OR ConnectorError
  PRE: depot and connector available
  POST: read-only snapshot with entries collected from list and stat; no depot mutation
  EFFECTS: IO
  FAILURE_MODES: DEPOT_UNREACHABLE; LIST_FAILED
  TERMINATION: total
  DATA health = CALL connector.healthCheck()
  IF NOT health.ok THEN RETURN { code: "depot_unreachable", message: health.message }
  DATA listRoot = IF depot.kind = "local" THEN "/" ELSE depot.root
  DATA listed = CALL connector.listEntries(listRoot)
  IF connector error THEN RETURN listed error
  DATA entries = empty list
  FOR EACH entry IN listed
    IF entry.isDirectory THEN
      APPEND { path: entry.path, isDirectory: true } to entries
      CONTINUE
    DATA stat = CALL connector.statEntry(entry.path)
    IF connector error THEN CONTINUE (skip entry)
    APPEND { path, isDirectory: false, size: stat.size, mtimeMs: stat.mtimeMs } to entries
  RETURN { depotId: depot.id, scannedAt: now ISO-8601, entries }
```
