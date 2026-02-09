import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Settings } from "lucide-react";

export default function SettingsPage() {
  return (
    <div className="p-6 space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Settings className="h-5 w-5" /> Einstellungen
        </h1>
        <p className="text-muted-foreground">Konfiguriere dein Dashboard</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Allgemein</CardTitle>
          <CardDescription>Grundlegende Einstellungen</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Einstellungen werden in einer zukünftigen Version verfügbar sein.</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Über</CardTitle>
        </CardHeader>
        <CardContent className="space-y-1 text-sm text-muted-foreground">
          <p><strong className="text-foreground">Cody Dashboard</strong> v0.2.0</p>
          <p>Next.js 15 · TypeScript · Tailwind CSS · Drizzle ORM · PostgreSQL</p>
        </CardContent>
      </Card>
    </div>
  );
}
