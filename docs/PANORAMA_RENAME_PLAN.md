# Panorama — Naming Decision and Rename Plan

**Date**: 2026-02-09  
**Status**: Plan  
**Purpose**: Preserve the naming suggestion and plan to rename the project to Panorama.

---

## 1. Naming Decision

### Chosen name: **Panorama**

- **Product**: The multi-pane file manager (current working name: "File Manager" / nx1 file manager).
- **Rationale**: Suggests "full view" of many targets at once; distinct from two-panel file managers; memorable and repo-friendly.

### Primary use case (for positioning)

The primary use of this app is to **sync multiple targets visually** with **verified results** (hash verification).

- **Visual**: Multi-pane layout shows all destination directories at once; Copy/Move to All Panes syncs to every visible pane.
- **Verified**: Hash verification (and configurable comparison methods) ensure correct sync and skip unchanged files.

---

## 2. Taglines and positioning (suggested)

- **Short**: *Panorama — Multi-target sync, verified.*
- **One-liner**: *Panorama is a multi-pane file manager built for visual multi-destination sync with hash verification — see all targets at once and confirm every copy.*
- **Alternatives**: "See every target. Verify every byte." / "Sync to many. Verify with hashes."

---

## 3. Rename plan (scope)

Rename the product and (optionally) repo to Panorama. Suggested scope:

| Item | Current | Target | Notes |
|------|---------|--------|--------|
| **Product / app title** | "File Manager" (e.g. in `config/files.yaml` copy.title) | "Panorama" | User-facing name in UI. |
| **README / docs** | "Multi-Pane File Manager", "nx1" | "Panorama" | Headings, feature list, tagline. |
| **Repository name** | `nx1` (or current repo name) | `panorama` (or `panorama-fm`) | Optional; affects clone URL, badges, links. |
| **Package name** | (if applicable) | e.g. `panorama` or keep `nx1` | Only if publishing; optional. |
| **Config / site branding** | As in `config/site.yaml`, `config/files.yaml` | Set title/description to Panorama | Subtitle can include tagline. |

### Implementation order (suggested)

1. **Documentation**: Update README, GOFUL_TRANSFER_SUMMARY (or equivalent) to use "Panorama" and the chosen tagline.
2. **Config**: Set `config/files.yaml` `copy.title` (and subtitle if desired) to "Panorama" and tagline.
3. **Site config**: If the file manager is the main app, set `config/site.yaml` metadata/branding to Panorama.
4. **Repo rename**: If desired, rename repository to `panorama` (or `panorama-fm`) in host (e.g. GitHub) and update clone URLs in README.
5. **CHANGELOG**: Add an entry for the rename (e.g. "Product renamed to Panorama").

---

## 4. Methodology note

This project was implemented using STDD (Semantic Token-Driven Development), which may be renamed to **TIED** (Token-Integrated Engineering & Development). The Panorama file manager logic was extracted from the Goful project (Go, human-coded 5+ years ago) into STDD/TIED docs and then implemented in Node/React/TypeScript with no human coding.

---

## 5. References

- Naming discussion: Panorama chosen; alternatives considered included Tileful, Polypane, Tessera, Mosaic.
- Primary value: multi-target visual sync + hash verification.
- Existing implementation: multi-pane layout, Copy/Move to All Panes, nsync-style engine, hash verification and comparison methods (see REQ-NSYNC_MULTI_TARGET, REQ-HASH_COMPUTATION, REQ-VERIFY_DEST, etc.).

---

*Document version*: 1.0  
*Created*: 2026-02-09
