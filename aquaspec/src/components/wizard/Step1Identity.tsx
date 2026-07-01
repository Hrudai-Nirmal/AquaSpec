"use client";

/**
 * Step one collects the commercial contact details before technical sizing inputs.
 */

import { useStore } from "@/lib/store";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Trash2Icon, PlusIcon } from "lucide-react";

const COUNTRY_PREFIXES = [
  "+91",
  "+1",
  "+44",
  "+61",
  "+65",
  "+81",
  "+971",
];

/** Captures the top-level hatchery identity and operating mode. */
export function Step1Identity() {
  const hatcheryName = useStore((s) => s.hatcheryName);
  const fullName = useStore((s) => s.fullName);
  const emailAddress = useStore((s) => s.emailAddress);
  const phoneCountryCode = useStore((s) => s.phoneCountryCode);
  const phoneNumber = useStore((s) => s.phoneNumber);
  const location = useStore((s) => s.location);
  const mode = useStore((s) => s.mode);
  const systems = useStore((s) => s.systems);
  const fieldErrors = useStore((s) => s.fieldErrors);
  const updateField = useStore((s) => s.updateField);
  const setMode = useStore((s) => s.setMode);
  const addSystem = useStore((s) => s.addSystem);
  const removeSystem = useStore((s) => s.removeSystem);
  const renameSystem = useStore((s) => s.renameSystem);

  return (
    <div className="space-y-8">
      <div className="glass-form space-y-7 rounded-[28px] border border-border/90 bg-white/72 p-6 shadow-[0_28px_70px_-42px_rgba(15,23,42,0.22)] backdrop-blur-xl md:p-7">
        <div className="grid gap-6 md:grid-cols-2">
          <div className="space-y-3">
            <Label htmlFor="fullName" className="text-base text-foreground/90">
              Full Name *
            </Label>
            <Input
              id="fullName"
              placeholder="Enter your full name"
              value={fullName}
              onChange={(e) => updateField("fullName", e.target.value)}
              aria-invalid={Boolean(fieldErrors["fullName"])}
              className="bg-white/90"
            />
          </div>

          <div className="space-y-3">
            <Label
              htmlFor="emailAddress"
              className="text-base text-foreground/90"
            >
              Email Address *
            </Label>
            <Input
              id="emailAddress"
              type="email"
              placeholder="your.email@company.com"
              value={emailAddress}
              onChange={(e) => updateField("emailAddress", e.target.value)}
              aria-invalid={Boolean(fieldErrors["emailAddress"])}
              className="bg-white/90"
            />
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <div className="space-y-3">
            <Label htmlFor="phoneNumber" className="text-base text-foreground/90">
              Phone Number *
            </Label>
            <div className="flex overflow-hidden rounded-xl border border-primary/55 bg-white/90 shadow-[inset_0_1px_0_rgb(255_255_255_/_0.55)]">
              <Select
                value={phoneCountryCode}
                onValueChange={(value) => {
                  if (value) updateField("phoneCountryCode", value);
                }}
              >
                <SelectTrigger
                  aria-invalid={Boolean(fieldErrors["phoneCountryCode"])}
                  className="w-[110px] rounded-none border-0 border-r border-primary/20 bg-transparent pr-2 pl-3 shadow-none focus-visible:ring-0"
                >
                  <SelectValue placeholder="+91" />
                </SelectTrigger>
                <SelectContent>
                  {COUNTRY_PREFIXES.map((prefix) => (
                    <SelectItem key={prefix} value={prefix}>
                      {prefix}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                id="phoneNumber"
                inputMode="tel"
                placeholder={`${phoneCountryCode} xxxxx xxxxx`}
                value={phoneNumber}
                onChange={(e) => updateField("phoneNumber", e.target.value)}
                aria-invalid={Boolean(fieldErrors["phoneNumber"])}
                className="rounded-none border-0 bg-transparent shadow-none focus-visible:ring-0"
              />
            </div>
          </div>

          <div className="space-y-3">
            <Label htmlFor="hatcheryName" className="text-base text-foreground/90">
              Company Name *
            </Label>
            <Input
              id="hatcheryName"
              placeholder="Your company name"
              value={hatcheryName}
              onChange={(e) => updateField("hatcheryName", e.target.value)}
              aria-invalid={Boolean(fieldErrors["hatcheryName"])}
              className="bg-white/90"
            />
          </div>

        </div>

        <div className="space-y-3">
          <Label htmlFor="location" className="text-base text-foreground/90">
            Location *
          </Label>
          <Input
            id="location"
            placeholder="City, State, Country"
            value={location}
            onChange={(e) => updateField("location", e.target.value)}
            aria-invalid={Boolean(fieldErrors["location"])}
            className="bg-white/90"
          />
        </div>
      </div>

      {/* Mode Toggle */}
      <div className="space-y-3">
        <Label className="text-base text-foreground/90">Mode</Label>
        <div className="flex gap-2">
          <Button
            variant={mode === "aggregate" ? "default" : "outline"}
            size="default"
            onClick={() => setMode("aggregate")}
            className="min-w-36 rounded-full"
          >
            Single System
          </Button>
          <Button
            variant={mode === "multi_system" ? "default" : "outline"}
            size="default"
            onClick={() => setMode("multi_system")}
            className="min-w-36 rounded-full"
          >
            Multi-System
          </Button>
        </div>
      </div>

      {/* Multi-System Management */}
      {mode === "multi_system" && (
        <div className="space-y-3">
          <Label>Systems</Label>
          <div className="space-y-2">
            {systems.map((sys, i) => (
              <Card key={i} size="sm" className="card-accent">
                <CardContent className="flex items-center gap-2 p-3">
                  <Input
                    className="flex-1"
                    placeholder={`System ${i + 1}`}
                    value={sys.name}
                    onChange={(e) => renameSystem(i, e.target.value)}
                  />
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    disabled={systems.length <= 1}
                    onClick={() => removeSystem(i)}
                  >
                    <Trash2Icon className="size-4 text-destructive" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={addSystem}
            className="w-full"
          >
            <PlusIcon className="size-4 mr-1" />
            Add System
          </Button>
        </div>
      )}
    </div>
  );
}
