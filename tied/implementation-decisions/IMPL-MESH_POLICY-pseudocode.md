# IMPL-MESH_POLICY essence pseudocode

// [IMPL-MESH_POLICY] [ARCH-MESH_LAYERED] [REQ-MESH_PLATFORM]: Path filters and include/exclude glob matching

## pathMatchesFilter

// how: Evaluate mesh policy filters against relative path; default allow when no filters.

PROCEDURE IMPL-MESH_POLICY_pathMatchesFilter(relativePath, filters)
  IF filters empty THEN RETURN true
  FOR each filter
    IF glob matches relativePath per filter.mode include|exclude
      APPLY exclude wins rules
  RETURN computed allow flag
