# IMPL-NSYNC_MOVE_PLAN essence pseudocode

// [IMPL-NSYNC_MOVE_PLAN] [ARCH-NSYNC_MOVE_PLAN] [REQ-NSYNC_HYBRID_MOVE] [REQ-MOVE_SEMANTICS]: Pure buildMovePlan classifies volume affinity and returns ordered copy/rename legs with at most one rename per source item

## Summary contract

// [IMPL-NSYNC_MOVE_PLAN] [ARCH-NSYNC_MOVE_PLAN] [REQ-NSYNC_HYBRID_MOVE] [REQ-MOVE_SEMANTICS]: how: classify each destPath vs source by Stats.dev; order cross-volume copies, same-volume copies, single rename last to lexicographically smallest same-volume dest

```
IMPL-NSYNC_MOVE_PLAN_Summary():
  INPUT: source path, destPaths[], optional getDev(path) => device id | undefined
  OUTPUT: MovePlan { legs[], omitDeferredDelete, renameTarget? }
  DATA: MoveLeg { op: copy|rename, from, to, volumeClass: same-volume|cross-volume|unknown }
  PRE: source is non-empty string; destPaths is non-empty array of absolute or relative dest file paths
  POST: count(legs where op=rename) <= 1; IF rename leg exists THEN it is last leg; omitDeferredDelete true IFF final leg is rename
  EFFECTS: none (pure plan builder; no IO unless default getDev uses fs.stat)
  FAILURE_MODES: IF destPaths empty THEN return empty plan with omitDeferredDelete false
  TERMINATION: total
```

## BUILD_MOVE_PLAN

// [IMPL-NSYNC_MOVE_PLAN] [ARCH-NSYNC_MOVE_PLAN] [REQ-NSYNC_HYBRID_MOVE] [REQ-MOVE_SEMANTICS]: how: partition dests by volume class; pick renameTarget as min lex same-volume dest; emit legs in safety order

```
IMPL-NSYNC_MOVE_PLAN_BUILD_MOVE_PLAN(source, destPaths, getDev):
  INPUT: source, destPaths[], getDev
  OUTPUT: MovePlan
  PRE: source and destPaths provided
  POST: legs ordered cross-volume copies, same-volume copies (non-rename targets), optional rename last
  EFFECTS: none when getDev injected; IO when default getDev reads fs.stat
  TERMINATION: total
  IF destPaths.length = 0 THEN RETURN { legs: [], omitDeferredDelete: false }
  FOR EACH destPath IN destPaths
    volumeClass := AWAIT CLASSIFY_VOLUME_AFFINITY(source, destPath, getDev)
    effectiveClass := IF volumeClass = unknown THEN cross-volume ELSE volumeClass
    append { destPath, volumeClass: effectiveClass } to classified[]
  crossVolume := destPaths where effectiveClass = cross-volume (preserve input order among cross)
  sameVolume := destPaths where effectiveClass = same-volume
  renameTarget := IF sameVolume.length > 0 THEN lexicographically smallest path in sameVolume ELSE null
  sameVolumeCopies := sameVolume paths excluding renameTarget (sorted lex for determinism)
  legs := []
  FOR EACH dest IN crossVolume
    APPEND { op: copy, from: source, to: dest, volumeClass: cross-volume }
  FOR EACH dest IN sameVolumeCopies
    APPEND { op: copy, from: source, to: dest, volumeClass: same-volume }
  IF renameTarget != null THEN
    APPEND { op: rename, from: source, to: renameTarget, volumeClass: same-volume }
  omitDeferredDelete := (last leg.op = rename)
  RETURN { legs, omitDeferredDelete, renameTarget }
```

## CLASSIFY_VOLUME_AFFINITY

// [IMPL-NSYNC_MOVE_PLAN] [ARCH-NSYNC_MOVE_PLAN] [REQ-NSYNC_HYBRID_MOVE]: how: compare getDev(source) with getDev(dirname(destPath)); stat failure yields unknown treated as cross-volume upstream

```
IMPL-NSYNC_MOVE_PLAN_CLASSIFY_VOLUME_AFFINITY(source, destPath, getDev):
  INPUT: source, destPath, getDev
  OUTPUT: volumeClass same-volume | cross-volume | unknown
  PRE: paths provided
  POST: same-volume only when both dev ids defined and equal
  EFFECTS: none when getDev injected
  TERMINATION: total
  sourceDev := AWAIT getDev(source)
  destDev := AWAIT getDev(dirname(destPath))
  IF sourceDev IS undefined OR destDev IS undefined THEN RETURN unknown
  IF sourceDev = destDev THEN RETURN same-volume
  RETURN cross-volume
```
