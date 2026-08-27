# IMPL-COMPARISON_COLORS essence pseudocode

// [IMPL-COMPARISON_COLORS] [ARCH-COMPARISON_COLORING] [REQ-FILE_COMPARISON_VISUAL]: how: buildEnhancedComparisonIndex classifies size/time deltas; FilePane applies mode-specific CSS classes from classifications

## BUILD_ENHANCED_INDEX

// [IMPL-COMPARISON_COLORS] [ARCH-COMPARISON_COLORING] [REQ-FILE_COMPARISON_VISUAL]: how: scan panes for shared filenames; attach sizeComparison and timeComparison arrays per pane entry

```
IMPL-COMPARISON_COLORS_BuildEnhancedIndex(panes):
  INPUT: panes FileStat[][]
  OUTPUT: Map filename -> Map paneIndex -> EnhancedCompareState
  DATA: skips filenames present in fewer than two panes
  PRE: multi-pane file listings available
  POST: enhanced comparison index with size/time classifications per pane
  EFFECTS: pure
  TERMINATION: total
  basicIndex := accumulate CompareState per filename across panes
  FOR EACH filename, state IN basicIndex
    IF state.panes.length < 2 THEN CONTINUE
    sizeComparisons := AnalyzeSizes(state.sizes)
    timeComparisons := AnalyzeTimes(state.mtimes)
    FOR i IN 0..state.panes.length-1
      paneIndex := state.panes[i]
      STORE EnhancedCompareState with sizeComparison[0] and timeComparison[0] for paneIndex
  RETURN result Map
```

## ANALYZE_SIZES

// [IMPL-COMPARISON_COLORS] [ARCH-COMPARISON_COLORING] [REQ-FILE_COMPARISON_VISUAL]: how: equal when min=max; else smallest/largest/null for middle values in 3+ panes

```
IMPL-COMPARISON_COLORS_AnalyzeSizes(sizes):
  INPUT: sizes number[] parallel to shared panes
  OUTPUT: SizeComparison[] values equal | smallest | largest | null
  PRE: sizes array with at least two entries for comparison
  POST: parallel SizeComparison classification array
  EFFECTS: pure
  TERMINATION: total
  IF sizes.length < 2 THEN RETURN array of null
  minSize := MIN(sizes); maxSize := MAX(sizes)
  IF minSize = maxSize THEN RETURN all equal
  FOR EACH size
    IF size = minSize THEN smallest
    ELSE IF size = maxSize THEN largest
    ELSE null
```

## ANALYZE_TIMES

// [IMPL-COMPARISON_COLORS] [ARCH-COMPARISON_COLORING] [REQ-FILE_COMPARISON_VISUAL]: how: parse string or Date mtimes; equal within 1 second; else earliest/latest/null for middle

```
IMPL-COMPARISON_COLORS_AnalyzeTimes(mtimes):
  INPUT: mtimes (Date|string)[]
  OUTPUT: TimeComparison[] values equal | earliest | latest | null
  PRE: mtimes array with at least two entries
  POST: parallel TimeComparison classification array
  EFFECTS: pure
  TERMINATION: total
  IF mtimes.length < 2 THEN RETURN array of null
  timestamps := CONVERT each mtime to epoch ms (parse ISO strings)
  minTime := MIN(timestamps); maxTime := MAX(timestamps)
  IF maxTime - minTime < 1000 THEN RETURN all equal
  FOR EACH timestamp
    IF timestamp = minTime THEN earliest
    ELSE IF timestamp = maxTime THEN latest
    ELSE null
```

## APPLY_CSS_CLASSES

// [IMPL-COMPARISON_COLORS] [ARCH-COMPARISON_COLORING] [REQ-FILE_COMPARISON_VISUAL]: how: FilePane getComparisonClass maps comparisonMode and classifications to row background classes

```
IMPL-COMPARISON_COLORS_ApplyCssClasses(comparisonMode, comparisonIndex, paneIndex, filename):
  INPUT: comparisonMode off|name|size|time, comparisonIndex Map, paneIndex, filename
  OUTPUT: Tailwind class string for file row (empty when not applicable)
  DATA: theme compareColors documented in config/theme.yaml; FilePane uses inline defaults matching those tokens
  PRE: comparisonMode and index available for row
  POST: CSS class string OR empty when not applicable
  EFFECTS: pure
  TERMINATION: total
  IF comparisonMode = off OR comparisonIndex missing THEN RETURN ""
  fileMap := comparisonIndex.get(filename)
  IF fileMap missing THEN RETURN ""
  compareState := fileMap.get(paneIndex)
  IF compareState missing THEN RETURN ""
  CASE comparisonMode
    name -> shared-file highlight bg-zinc-100 dark:bg-zinc-800
    size -> map sizeComparison[0] equal|smallest|largest to green|blue|red border-left classes
    time -> map timeComparison[0] equal|earliest|latest to green|blue|red border-left classes
    default -> ""
```

## CodeLocations

// [IMPL-COMPARISON_COLORS] [ARCH-COMPARISON_COLORING] [REQ-FILE_COMPARISON_VISUAL]: how: map implementing and verifying source files for this IMPL

// FILE: src/lib/files.comparison.ts — buildEnhancedComparisonIndex, AnalyzeSizes, AnalyzeTimes
// FILE: src/lib/files.types.ts — SizeComparison, TimeComparison, EnhancedCompareState types
// FILE: src/app/files/components/FilePane.tsx — getComparisonClass row styling
// FILE: config/theme.yaml — files.compareColors reference tokens
// FILE: src/lib/files.comparison.test.ts — size/time/multi-pane classification tests
