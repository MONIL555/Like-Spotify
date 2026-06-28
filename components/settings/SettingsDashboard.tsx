'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AccountSettings } from "./AccountSettings";
import { PasswordSettings } from "./PasswordSettings";
import { PlaybackSettings } from "./PlaybackSettings";
import { DataSettings } from "./DataSettings";
import { User, Lock, Sliders, Database } from "lucide-react";

export function SettingsDashboard() {
  return (
    <Tabs defaultValue="account" className="flex flex-col md:flex-row gap-8">
      <TabsList className="flex md:flex-col h-auto w-full md:w-64 bg-transparent justify-start space-y-1 overflow-x-auto md:overflow-visible">
        <TabsTrigger 
          value="account" 
          className="justify-start gap-3 px-4 py-3 data-[state=active]:bg-surface data-[state=active]:text-brand-primary"
        >
          <User className="h-4 w-4" />
          Account
        </TabsTrigger>
        <TabsTrigger 
          value="password" 
          className="justify-start gap-3 px-4 py-3 data-[state=active]:bg-surface data-[state=active]:text-brand-primary"
        >
          <Lock className="h-4 w-4" />
          Password
        </TabsTrigger>
        <TabsTrigger 
          value="playback" 
          className="justify-start gap-3 px-4 py-3 data-[state=active]:bg-surface data-[state=active]:text-brand-primary"
        >
          <Sliders className="h-4 w-4" />
          Playback
        </TabsTrigger>
        <TabsTrigger 
          value="data" 
          className="justify-start gap-3 px-4 py-3 data-[state=active]:bg-surface data-[state=active]:text-brand-primary"
        >
          <Database className="h-4 w-4" />
          Data & Privacy
        </TabsTrigger>
      </TabsList>

      <div className="flex-1 bg-surface/30 border border-border rounded-xl p-6 min-h-[500px]">
        <TabsContent value="account" className="mt-0 outline-none">
          <AccountSettings />
        </TabsContent>
        <TabsContent value="password" className="mt-0 outline-none">
          <PasswordSettings />
        </TabsContent>
        <TabsContent value="playback" className="mt-0 outline-none">
          <PlaybackSettings />
        </TabsContent>
        <TabsContent value="data" className="mt-0 outline-none">
          <DataSettings />
        </TabsContent>
      </div>
    </Tabs>
  );
}
