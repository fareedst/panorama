// [IMPL-FILE_MANAGER_PAGE] [ARCH-FILE_MANAGER_HIERARCHY] [REQ-FILE_MANAGER_PAGE]: Top-level File Manager Page Implementation: Server component loads directory data and config, renders WorkspaceView
// Root page redirects to file manager - the sole purpose of this application

import { redirect } from "next/navigation";

export default function Home() {
  redirect("/files");
}
