"use client";

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
    <div className="space-y-6">
      <div className="glass-form rounded-xl border border-border/90 bg-white/32 p-5 backdrop-blur-xl space-y-5">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="fullName">Full Name *</Label>
            <Input
              id="fullName"
              placeholder="Enter your full name"
              value={fullName}
              onChange={(e) => updateField("fullName", e.target.value)}
            />
            {fieldErrors["fullName"] && (
              <p className="text-xs text-destructive">{fieldErrors["fullName"]}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="emailAddress">Email Address *</Label>
            <Input
              id="emailAddress"
              type="email"
              placeholder="your.email@company.com"
              value={emailAddress}
              onChange={(e) => updateField("emailAddress", e.target.value)}
            />
            {fieldErrors["emailAddress"] && (
              <p className="text-xs text-destructive">
                {fieldErrors["emailAddress"]}
              </p>
            )}
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-[160px_1fr]">
          <div className="space-y-2">
            <Label>Country Prefix *</Label>
            <Select
              value={phoneCountryCode}
              onValueChange={(value) => {
                if (value) updateField("phoneCountryCode", value);
              }}
            >
              <SelectTrigger>
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
          </div>

          <div className="space-y-2">
            <Label htmlFor="phoneNumber">Phone Number *</Label>
            <Input
              id="phoneNumber"
              inputMode="tel"
              placeholder="+91 xxxxx xxxxx"
              value={phoneNumber}
              onChange={(e) => updateField("phoneNumber", e.target.value)}
            />
            {fieldErrors["phoneNumber"] && (
              <p className="text-xs text-destructive">{fieldErrors["phoneNumber"]}</p>
            )}
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="hatcheryName">Company Name *</Label>
            <Input
              id="hatcheryName"
              placeholder="Your company name"
              value={hatcheryName}
              onChange={(e) => updateField("hatcheryName", e.target.value)}
            />
            {fieldErrors["hatcheryName"] && (
              <p className="text-xs text-destructive">
                {fieldErrors["hatcheryName"]}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="location">Location *</Label>
            <Input
              id="location"
              placeholder="City, State, Country"
              value={location}
              onChange={(e) => updateField("location", e.target.value)}
            />
            {fieldErrors["location"] && (
              <p className="text-xs text-destructive">{fieldErrors["location"]}</p>
            )}
          </div>
        </div>
      </div>

      {/* Mode Toggle */}
      <div className="space-y-2">
        <Label>Mode</Label>
        <div className="flex gap-2">
          <Button
            variant={mode === "aggregate" ? "default" : "outline"}
            size="sm"
            onClick={() => setMode("aggregate")}
          >
            Single System
          </Button>
          <Button
            variant={mode === "multi_system" ? "default" : "outline"}
            size="sm"
            onClick={() => setMode("multi_system")}
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
