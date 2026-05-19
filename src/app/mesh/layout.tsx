// [IMPL-MESH_GUI] [REQ-MESH_PLATFORM]: Mesh navigation shell — phase 17

import Link from "next/link";

const globalNav = [
  { href: "/mesh", label: "Meshes" },
  { href: "/mesh/monitoring", label: "Monitoring" },
  { href: "/mesh/settings", label: "Settings" },
  { href: "/files", label: "File Manager" },
];

export function MeshDetailNav({ meshId }: { meshId: string }) {
  const items = [
    { href: `/mesh/${meshId}`, label: "Overview" },
    { href: `/mesh/${meshId}/topology`, label: "Topology" },
    { href: `/mesh/${meshId}/plan`, label: "Plan" },
    { href: `/mesh/${meshId}/sync`, label: "Sync Now" },
    { href: `/mesh/${meshId}/conflicts`, label: "Conflicts" },
  ];
  return (
    <nav
      className="mb-4 flex flex-wrap gap-2 border-b border-zinc-800 pb-3 text-sm"
      data-testid="mesh-detail-nav"
    >
      {items.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className="rounded px-2 py-1 text-zinc-400 hover:bg-zinc-800 hover:text-white"
        >
          {item.label}
        </Link>
      ))}
    </nav>
  );
}

export default function MeshLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <header className="border-b border-zinc-800 px-4 py-3">
        <div className="mx-auto flex max-w-6xl items-center gap-6">
          <span className="text-lg font-semibold">Mesh Sync</span>
          <nav className="flex flex-wrap gap-3 text-sm" data-testid="global-mesh-nav">
            {globalNav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="text-zinc-400 hover:text-white"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-6">{children}</main>
    </div>
  );
}
