// [IMPL-WORKSPACE_VIEW] [ARCH-MOUSE_SUPPORT] [REQ-DIRECTORY_NAVIGATION] [REQ-MOUSE_INTERACTION]: semantic multi-color SVG icons for Set as Base directory dialog targets

import type { ReactNode } from "react";
import type { SetBaseDirectoryTarget } from "@/lib/set-base-directory";

export const SET_BASE_ICON_SIZE = 36;
export const SET_BASE_ICON_STROKE_WIDTH = 1.5;

/** Pane that opened the dialog (aligned with focused-pane blue in FilePane / PaneOrderDialog) */
const INITIATING_OUTLINE =
  "stroke-blue-500 dark:stroke-blue-400 fill-blue-500/20";
const INITIATING_FILL =
  "stroke-blue-500 dark:stroke-blue-400 fill-blue-500 dark:fill-blue-400";

/** Pane(s) that receive the new base path */
const TARGET_FILL =
  "stroke-emerald-500 dark:stroke-emerald-400 fill-emerald-500 dark:fill-emerald-400";

/** Non-involved pane outline */
const INACTIVE = "stroke-zinc-400 dark:stroke-zinc-500 fill-none";

/** Next/prior direction cue */
const DIRECTION = "stroke-amber-500 dark:stroke-amber-400 fill-none";

/** Pane position swap */
const SWAP = "stroke-violet-500 dark:stroke-violet-400 fill-none";

/** New workspace / external tab */
const NEW_WORKSPACE_PANE =
  "stroke-sky-500 dark:stroke-sky-400 fill-sky-500/25 dark:fill-sky-400/25";
const NEW_WORKSPACE_EXTERNAL = "stroke-sky-500 dark:stroke-sky-400 fill-none";

const SVG_PROPS = {
  width: SET_BASE_ICON_SIZE,
  height: SET_BASE_ICON_SIZE,
  viewBox: "0 0 24 24",
  fill: "none" as const,
  strokeWidth: SET_BASE_ICON_STROKE_WIDTH,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true as const,
};

function TargetIconSvg({ children }: { children: ReactNode }) {
  return <svg {...SVG_PROPS}>{children}</svg>;
}

export interface SetBaseDirectoryTargetIconProps {
  target: SetBaseDirectoryTarget;
}

// SetBaseDirectoryTargetIcon — [IMPL-WORKSPACE_VIEW] [ARCH-MOUSE_SUPPORT] [REQ-DIRECTORY_NAVIGATION] [REQ-MOUSE_INTERACTION]: how — 36px SVG per target with initiating blue, target emerald, direction amber, swap violet, new-workspace sky roles

export function SetBaseDirectoryTargetIcon({
  target,
}: SetBaseDirectoryTargetIconProps) {
  switch (target) {
    case "thisPane":
      return (
        <TargetIconSvg>
          <rect
            width="8"
            height="16"
            x="8"
            y="4"
            rx="1"
            className={INITIATING_FILL}
          />
        </TargetIconSvg>
      );
    case "allPanes":
      return (
        <TargetIconSvg>
          <rect
            width="5"
            height="16"
            x="3"
            y="4"
            rx="0.5"
            className={TARGET_FILL}
          />
          <rect
            width="5"
            height="16"
            x="9.5"
            y="4"
            rx="0.5"
            className={TARGET_FILL}
          />
          <rect
            width="5"
            height="16"
            x="16"
            y="4"
            rx="0.5"
            className={TARGET_FILL}
          />
        </TargetIconSvg>
      );
    case "otherPanes":
      return (
        <TargetIconSvg>
          <rect
            width="5"
            height="16"
            x="3"
            y="4"
            rx="0.5"
            className={TARGET_FILL}
          />
          <rect
            width="5"
            height="16"
            x="9.5"
            y="4"
            rx="0.5"
            className={INITIATING_OUTLINE}
          />
          <rect
            width="5"
            height="16"
            x="16"
            y="4"
            rx="0.5"
            className={TARGET_FILL}
          />
        </TargetIconSvg>
      );
    case "nextPane":
      return (
        <TargetIconSvg>
          <rect
            width="6"
            height="14"
            x="3"
            y="5"
            rx="0.5"
            className={INITIATING_OUTLINE}
          />
          <rect
            width="6"
            height="14"
            x="15"
            y="5"
            rx="0.5"
            className={TARGET_FILL}
          />
          <path d="m10 12 3-3 3 3" className={DIRECTION} />
        </TargetIconSvg>
      );
    case "nextPaneSwap":
      return (
        <TargetIconSvg>
          <rect
            width="6"
            height="14"
            x="3"
            y="5"
            rx="0.5"
            className={INITIATING_OUTLINE}
          />
          <rect
            width="6"
            height="14"
            x="15"
            y="5"
            rx="0.5"
            className={TARGET_FILL}
          />
          <path
            d="M9 12h6M14 9l2 3-2 3M12 9l-2 3 2 3"
            className={SWAP}
          />
        </TargetIconSvg>
      );
    case "priorPane":
      return (
        <TargetIconSvg>
          <rect
            width="6"
            height="14"
            x="3"
            y="5"
            rx="0.5"
            className={TARGET_FILL}
          />
          <rect
            width="6"
            height="14"
            x="15"
            y="5"
            rx="0.5"
            className={INITIATING_OUTLINE}
          />
          <path d="m14 12-3-3-3 3" className={DIRECTION} />
        </TargetIconSvg>
      );
    case "priorPaneSwap":
      return (
        <TargetIconSvg>
          <rect
            width="6"
            height="14"
            x="3"
            y="5"
            rx="0.5"
            className={TARGET_FILL}
          />
          <rect
            width="6"
            height="14"
            x="15"
            y="5"
            rx="0.5"
            className={INITIATING_OUTLINE}
          />
          <path
            d="M9 12h6M14 9l2 3-2 3M12 9l-2 3 2 3"
            className={SWAP}
          />
        </TargetIconSvg>
      );
    case "newPane":
      return (
        <TargetIconSvg>
          <rect
            width="5"
            height="16"
            x="3"
            y="4"
            rx="0.5"
            className={INITIATING_OUTLINE}
          />
          <rect
            width="5"
            height="16"
            x="9.5"
            y="4"
            rx="0.5"
            className={INACTIVE}
          />
          <rect
            width="5"
            height="16"
            x="16"
            y="4"
            rx="0.5"
            className={TARGET_FILL}
          />
          <path d="M18.5 10v4M16.5 12h4" className={DIRECTION} />
        </TargetIconSvg>
      );
    case "newWorkspace":
      return (
        <TargetIconSvg>
          <rect
            width="8"
            height="14"
            x="4"
            y="6"
            rx="1"
            className={NEW_WORKSPACE_PANE}
          />
          <path d="M16 4h4v4M20 4l-5 5" className={NEW_WORKSPACE_EXTERNAL} />
        </TargetIconSvg>
      );
  }
}
