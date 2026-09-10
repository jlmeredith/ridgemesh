import { createFileRoute } from "@tanstack/react-router";
import { ValleyMap } from "@/components/valley-map";
import { SidePanel } from "@/components/side-panel";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
  return (
    <main className="flex min-h-dvh flex-col bg-bg md:h-dvh md:flex-row md:overflow-hidden">
      <div className="relative min-h-[58vh] flex-1 md:min-h-0">
        <ValleyMap />
      </div>
      <div className="h-auto w-full md:h-full md:w-[360px] md:shrink-0">
        <SidePanel />
      </div>
    </main>
  );
}
