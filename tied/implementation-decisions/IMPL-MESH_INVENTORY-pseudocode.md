# IMPL-MESH_INVENTORY essence pseudocode

// [IMPL-MESH_INVENTORY] [ARCH-MESH_LAYERED] [REQ-MESH_PLATFORM]: Scan depot via connector into inventory listing

## scanDepot

// how: Connector.list recursive from depot root; apply policy path filters.

PROCEDURE IMPL-MESH_INVENTORY_scanDepot(depot, connector)
  DATA listing = CALL connector.list(depot.root, "")
  FILTER paths via policy pathMatchesFilter when configured
  RETURN inventory { depotId, entries[] } or error when connector fails
