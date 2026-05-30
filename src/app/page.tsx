// [IMPL-HOME_PAGE] [ARCH-SERVER_COMPONENTS] [REQ-HOME_PAGE]: Root home route — server component at src/app/page.tsx redirects visitors to the file manager (/files); sole-purpose app entry
// Root page redirects to file manager - the sole purpose of this application

import { redirect } from "next/navigation";

// [IMPL-HOME_PAGE] [ARCH-SERVER_COMPONENTS] [REQ-HOME_PAGE]: how: Home() calls redirect("/files") so App Router never paints legacy home UI
export default function Home() {
  redirect("/files");
}
