"use client";

import React from "react";
import { useGameStore } from "@/store/useGameStore";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Settings2Icon, SunIcon, CloudIcon, LightbulbIcon } from "lucide-react";

export function LightingControlPanel() {
    const lighting = useGameStore((state) => state.lighting);
    const setLighting = useGameStore((state) => state.setLighting);
    const isStarted = useGameStore((state) => state.isStarted);

    if (!isStarted) return null;

    return (
        <Card className="fixed bottom-6 left-6 w-80 bg-zinc-950/60 backdrop-blur-xl border-white/10 text-white shadow-2xl z-20 overflow-hidden pointer-events-auto animate-in fade-in slide-in-from-bottom-4 duration-1000">
            <CardHeader className="py-4 px-6 border-b border-white/5">
                <CardTitle className="text-sm font-bold flex items-center gap-2 tracking-tight">
                    <Settings2Icon className="w-4 h-4 text-teal-400" />
                    VISUAL SETTINGS
                </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
                {/* Ambient Light */}
                <div className="space-y-3">
                    <div className="flex justify-between items-center">
                        <Label className="text-[10px] font-black uppercase text-zinc-500 tracking-widest flex items-center gap-2">
                            <SunIcon className="w-3 h-3" />
                            Ambient Intensity
                        </Label>
                        <span className="text-xs font-mono text-teal-400 font-bold">{lighting.ambientIntensity.toFixed(1)}</span>
                    </div>
                    <Slider
                        value={[lighting.ambientIntensity]}
                        min={0}
                        max={5}
                        step={0.1}
                        onValueChange={([val]: number[]) => setLighting({ ambientIntensity: val })}
                        className="hover:cursor-pointer"
                    />
                </div>

                {/* Sunlight */}
                <div className="space-y-3">
                    <div className="flex justify-between items-center">
                        <Label className="text-[10px] font-black uppercase text-zinc-500 tracking-widest flex items-center gap-2">
                            <SunIcon className="w-3 h-3 fill-current" />
                            Sunlight Intensity
                        </Label>
                        <span className="text-xs font-mono text-teal-400 font-bold">{lighting.directionalIntensity.toFixed(1)}</span>
                    </div>
                    <Slider
                        value={[lighting.directionalIntensity]}
                        min={0}
                        max={8}
                        step={0.1}
                        onValueChange={([val]: number[]) => setLighting({ directionalIntensity: val })}
                    />
                </div>

                {/* Sky Glow */}
                <div className="space-y-3">
                    <div className="flex justify-between items-center">
                        <Label className="text-[10px] font-black uppercase text-zinc-500 tracking-widest flex items-center gap-2">
                            <CloudIcon className="w-3 h-3" />
                            Sky Glow
                        </Label>
                        <span className="text-xs font-mono text-teal-400 font-bold">{lighting.hemisphereIntensity.toFixed(1)}</span>
                    </div>
                    <Slider
                        value={[lighting.hemisphereIntensity]}
                        min={0}
                        max={3}
                        step={0.1}
                        onValueChange={([val]: number[]) => setLighting({ hemisphereIntensity: val })}
                    />
                </div>

                {/* Point Light */}
                <div className="space-y-3">
                    <div className="flex justify-between items-center">
                        <Label className="text-[10px] font-black uppercase text-zinc-500 tracking-widest flex items-center gap-2">
                            <LightbulbIcon className="w-3 h-3" />
                            Point Intensity
                        </Label>
                        <span className="text-xs font-mono text-teal-400 font-bold">{lighting.pointIntensity.toFixed(1)}</span>
                    </div>
                    <Slider
                        value={[lighting.pointIntensity]}
                        min={0}
                        max={5}
                        step={0.1}
                        onValueChange={([val]: number[]) => setLighting({ pointIntensity: val })}
                    />
                </div>

                {/* Sky Toggles */}
                <div className="flex items-center justify-between pt-2 border-t border-white/5">
                    <div className="flex flex-col gap-0.5">
                        <Label htmlFor="sky-toggle" className="text-[10px] font-black uppercase text-zinc-500 tracking-widest">Atmosphere</Label>
                        <span className="text-[8px] text-zinc-400">Toggle procedural skybox</span>
                    </div>
                    <Switch
                        id="sky-toggle"
                        checked={lighting.skyEnabled}
                        onCheckedChange={(val: boolean) => setLighting({ skyEnabled: val })}
                    />
                </div>
            </CardContent>
        </Card>
    );
}
