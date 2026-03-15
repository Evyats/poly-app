import { Link } from "react-router-dom";
import { ArrowRight, BookOpenText, Dumbbell, Sunrise, Weight } from "lucide-react";

import { PageHeader } from "../components/PageHeader";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";

const apps = [
  { path: "/reps", title: "Reps Tracker", desc: "Track exercises by workout tab and quickly adjust reps.", icon: Dumbbell },
  { path: "/wakeup", title: "Wake-up Tracker", desc: "Log wake-up times and inspect trends by month or year.", icon: Sunrise },
  { path: "/weight", title: "Weight Tracker", desc: "Track weight entries with moving average and linear trend.", icon: Weight },
  { path: "/routine", title: "Daily Routine", desc: "Stopwatch plus tasks with countdown completion timers.", icon: BookOpenText },
  { path: "/vocab", title: "Vocabulary Trainer", desc: "Manage English-Hebrew mappings and practice matching rounds.", icon: BookOpenText },
];

export function HomePage() {
  return (
    <section className="space-y-6">
      <PageHeader eyebrow="Workspace" title="Mini-app hub" description="Pick a tracker and work." meta="5 trackers" />

      <Card className="overflow-hidden">
        <CardHeader className="border-b border-border/70 bg-muted/40">
          <CardTitle className="text-2xl">Choose a tracker</CardTitle>
          <CardDescription>Direct entry points into each workflow.</CardDescription>
        </CardHeader>
        <CardContent className="subtle-grid grid gap-4 pt-6 sm:grid-cols-2 xl:grid-cols-3">
          {apps.map((app) => (
            <Card key={app.path} className="glass-panel transition-transform duration-200 hover:-translate-y-1">
              <CardHeader>
                <div className="flex items-center justify-between gap-3">
                  <div className="flex size-11 items-center justify-center rounded-2xl bg-muted text-foreground">
                    <app.icon className="size-5" />
                  </div>
                  <Badge variant="secondary">Ready</Badge>
                </div>
                <CardTitle>{app.title}</CardTitle>
                <CardDescription>{app.desc}</CardDescription>
              </CardHeader>
              <CardContent>
                <Button asChild className="w-full justify-between">
                  <Link to={app.path}>
                    Open tracker
                    <ArrowRight className="size-4" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </CardContent>
      </Card>
    </section>
  );
}
