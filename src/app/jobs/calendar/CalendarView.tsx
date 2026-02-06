"use client";

// [IMPL-CALENDAR_GRID] [ARCH-CALENDAR_VIEW] [REQ-JOB_TRACKER_CALENDAR] [REQ-CONFIG_DRIVEN_APPEARANCE]
// Calendar view client component with interactive month grid, detail panel, and navigation.

import { useState } from "react";
import Link from "next/link";
import { twMerge } from "tailwind-merge";
import type { Position, Application, PositionWithStatus } from "../../../lib/jobs.types";

interface CalendarCopy {
  prev: string;
  next: string;
  today: string;
  noItems: string;
  positionLabel: string;
  applicationLabel: string;
  detailClose: string;
  dayNames: string;
}

interface CalendarOverrides {
  grid: string;
  cell: string;
  cellToday: string;
  item: string;
  detailPanel: string;
}

interface CalendarViewProps {
  positions: PositionWithStatus[];
  applications: Application[];
  copy: CalendarCopy;
  overrides: CalendarOverrides;
  statusBadgeClasses: Record<string, string>;
}

type CalendarItem = { type: "position"; data: Position } | { type: "application"; data: Application };

/**
 * Format date as YYYY-MM-DD for comparison.
 * [IMPL-CALENDAR_GRID] [REQ-JOB_TRACKER_CALENDAR]
 */
function formatDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Check if two dates are the same day.
 * [IMPL-CALENDAR_GRID] [REQ-JOB_TRACKER_CALENDAR]
 */
function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

/**
 * Format status for display.
 * [IMPL-CALENDAR_GRID] [REQ-JOB_TRACKER_CALENDAR]
 */
function formatStatus(status: string): string {
  return status
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

// [IMPL-CALENDAR_GRID] [ARCH-CALENDAR_VIEW] [REQ-JOB_TRACKER_CALENDAR]
// Main calendar view component
export default function CalendarView({
  positions,
  applications,
  copy,
  overrides,
  statusBadgeClasses,
}: CalendarViewProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedItem, setSelectedItem] = useState<CalendarItem | null>(null);

  const dayNames = copy.dayNames.split(",");
  const today = new Date();

  // [IMPL-CALENDAR_GRID] Calculate month grid
  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const daysInMonth = lastDay.getDate();
  const startingDayOfWeek = firstDay.getDay(); // 0 = Sunday

  // [IMPL-CALENDAR_GRID] Build items by date map
  const itemsByDate = new Map<string, CalendarItem[]>();
  
  // Add positions
  for (const position of positions) {
    const items = itemsByDate.get(position.postingDate) || [];
    items.push({ type: "position", data: position });
    itemsByDate.set(position.postingDate, items);
  }
  
  // Add applications
  for (const application of applications) {
    const items = itemsByDate.get(application.date) || [];
    items.push({ type: "application", data: application });
    itemsByDate.set(application.date, items);
  }

  // [IMPL-CALENDAR_GRID] Navigation handlers
  function handlePrevMonth() {
    setCurrentMonth(new Date(year, month - 1, 1));
  }

  function handleNextMonth() {
    setCurrentMonth(new Date(year, month + 1, 1));
  }

  function handleToday() {
    setCurrentMonth(new Date());
  }

  // [IMPL-CALENDAR_GRID] Month name
  const monthName = currentMonth.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  // [IMPL-CALENDAR_GRID] Default classes
  const gridClass = twMerge(
    "grid grid-cols-7 gap-px bg-zinc-200 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-800 rounded-lg overflow-hidden",
    overrides.grid,
  );
  const cellClass = "bg-white dark:bg-black min-h-24 sm:min-h-32 p-2 relative";
  const cellTodayClass = "ring-2 ring-blue-500 dark:ring-blue-400";
  const dayNumberClass = "text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-1";
  const itemClass = "text-xs px-2 py-1 rounded mb-1 cursor-pointer hover:opacity-80 truncate";
  const detailPanelClass = twMerge(
    "mb-6 p-6 bg-white dark:bg-black border border-zinc-200 dark:border-zinc-800 rounded-lg",
    overrides.detailPanel,
  );

  return (
    <div>
      {/* [IMPL-CALENDAR_GRID] Detail Panel */}
      {selectedItem && (
        <div className={detailPanelClass}>
          <div className="flex justify-between items-start mb-4">
            <div className="flex-1">
              {selectedItem.type === "position" ? (
                <>
                  <div className="text-xs text-zinc-500 dark:text-zinc-400 mb-1">
                    {copy.positionLabel}
                  </div>
                  <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 mb-2">
                    {selectedItem.data.title}
                  </h2>
                  <div className="text-sm text-zinc-600 dark:text-zinc-400 mb-4">
                    Posted: {new Date(selectedItem.data.postingDate).toLocaleDateString()}
                  </div>
                  {selectedItem.data.description && (
                    <p className="text-zinc-700 dark:text-zinc-300 mb-4 line-clamp-3">
                      {selectedItem.data.description}
                    </p>
                  )}
                  {selectedItem.data.urls.length > 0 && (
                    <div className="mb-4">
                      <div className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-2">
                        URLs:
                      </div>
                      <div className="space-y-1">
                        {selectedItem.data.urls.map((url, idx) => (
                          <a
                            key={idx}
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block text-sm text-blue-600 dark:text-blue-400 hover:underline truncate"
                          >
                            {url}
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                  {selectedItem.data.notes && (
                    <div className="mb-4">
                      <div className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-2">
                        Notes:
                      </div>
                      <p className="text-sm text-zinc-700 dark:text-zinc-300">{selectedItem.data.notes}</p>
                    </div>
                  )}
                  <Link
                    href={`/jobs/${selectedItem.data.id}/edit`}
                    className="inline-block text-sm text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    Edit Position →
                  </Link>
                </>
              ) : (
                <>
                  <div className="text-xs text-zinc-500 dark:text-zinc-400 mb-1">
                    {copy.applicationLabel}
                  </div>
                  <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 mb-2">
                    {positions.find((p) => p.id === selectedItem.data.positionId)?.title || "Unknown Position"}
                  </h2>
                  <div className="flex items-center gap-4 mb-4">
                    <span
                      className={twMerge(
                        "inline-flex px-3 py-1 text-sm font-semibold rounded-full",
                        statusBadgeClasses[selectedItem.data.status] || statusBadgeClasses["none"],
                      )}
                    >
                      {formatStatus(selectedItem.data.status)}
                    </span>
                    <div className="text-sm text-zinc-600 dark:text-zinc-400">
                      {new Date(selectedItem.data.date).toLocaleDateString()}
                    </div>
                  </div>
                  {selectedItem.data.notes && (
                    <div className="mb-4">
                      <div className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-2">
                        Notes:
                      </div>
                      <p className="text-sm text-zinc-700 dark:text-zinc-300">{selectedItem.data.notes}</p>
                    </div>
                  )}
                  <Link
                    href={`/jobs/${selectedItem.data.positionId}/edit`}
                    className="inline-block text-sm text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    Edit Position →
                  </Link>
                </>
              )}
            </div>
            <button
              onClick={() => setSelectedItem(null)}
              className="text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 text-sm font-medium"
            >
              {copy.detailClose}
            </button>
          </div>
        </div>
      )}

      {/* [IMPL-CALENDAR_GRID] Month Navigation */}
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">{monthName}</h2>
        <div className="flex gap-2">
          <button
            onClick={handleToday}
            className="px-4 py-2 text-sm font-medium text-zinc-700 dark:text-zinc-300 bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded hover:bg-zinc-50 dark:hover:bg-zinc-800"
          >
            {copy.today}
          </button>
          <button
            onClick={handlePrevMonth}
            className="px-4 py-2 text-sm font-medium text-zinc-700 dark:text-zinc-300 bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded hover:bg-zinc-50 dark:hover:bg-zinc-800"
          >
            {copy.prev}
          </button>
          <button
            onClick={handleNextMonth}
            className="px-4 py-2 text-sm font-medium text-zinc-700 dark:text-zinc-300 bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded hover:bg-zinc-50 dark:hover:bg-zinc-800"
          >
            {copy.next}
          </button>
        </div>
      </div>

      {/* [IMPL-CALENDAR_GRID] Calendar Grid */}
      <div className={gridClass}>
        {/* Day name headers */}
        {dayNames.map((dayName) => (
          <div
            key={dayName}
            className="bg-zinc-50 dark:bg-zinc-900 p-2 text-center text-xs font-semibold text-zinc-600 dark:text-zinc-400"
          >
            {dayName}
          </div>
        ))}

        {/* Empty cells for days before month starts */}
        {Array.from({ length: startingDayOfWeek }).map((_, idx) => (
          <div key={`empty-start-${idx}`} className={cellClass} />
        ))}

        {/* Day cells for current month */}
        {Array.from({ length: daysInMonth }).map((_, idx) => {
          const day = idx + 1;
          const date = new Date(year, month, day);
          const dateKey = formatDateKey(date);
          const items = itemsByDate.get(dateKey) || [];
          const isCurrentDay = isSameDay(date, today);

          return (
            <div
              key={day}
              className={twMerge(
                cellClass,
                overrides.cell,
                isCurrentDay && twMerge(cellTodayClass, overrides.cellToday),
              )}
            >
              <div className={dayNumberClass}>{day}</div>
              <div className="space-y-1">
                {items.map((item, itemIdx) => {
                  if (item.type === "position") {
                    return (
                      <div
                        key={`pos-${item.data.id}-${itemIdx}`}
                        onClick={() => setSelectedItem(item)}
                        className={twMerge(
                          itemClass,
                          "bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200",
                          overrides.item,
                        )}
                        title={item.data.title}
                      >
                        <span className="hidden sm:inline">{item.data.title}</span>
                        <span className="inline sm:hidden w-2 h-2 rounded-full bg-zinc-500 block"></span>
                      </div>
                    );
                  } else {
                    const badgeClass = statusBadgeClasses[item.data.status] || statusBadgeClasses["none"];
                    return (
                      <div
                        key={`app-${item.data.id}-${itemIdx}`}
                        onClick={() => setSelectedItem(item)}
                        className={twMerge(itemClass, badgeClass, overrides.item)}
                        title={`${formatStatus(item.data.status)} - ${positions.find((p) => p.id === item.data.positionId)?.title || ""}`}
                      >
                        <span className="hidden sm:inline">{formatStatus(item.data.status)}</span>
                        <span className="inline sm:hidden w-2 h-2 rounded-full block"></span>
                      </div>
                    );
                  }
                })}
              </div>
            </div>
          );
        })}

        {/* Empty cells for days after month ends */}
        {Array.from({ length: 42 - daysInMonth - startingDayOfWeek }).map((_, idx) => (
          <div key={`empty-end-${idx}`} className={cellClass} />
        ))}
      </div>
    </div>
  );
}
