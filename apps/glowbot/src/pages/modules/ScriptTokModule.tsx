import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Bot, Video, History, Wrench, Sparkles } from "lucide-react";
import { ScriptGeneratorPage } from "./ScriptGeneratorPage";
import { ContentHistoryPage } from "./ContentHistoryPage"; 
import { ScriptToolsPage } from "./ScriptToolsPage";

export default function ScriptTokModule() {
  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="flex items-center gap-3 mb-8">
        <Bot className="h-8 w-8 text-blue-600" />
        <div>
          <h1 className="text-3xl font-bold">ScriptTok Module</h1>
          <p className="text-gray-600">Specialized script generation for short-form video content</p>
        </div>
      </div>

      <Tabs defaultValue="generator" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="generator" className="flex items-center gap-2">
            <Video className="h-4 w-4" />
            Script Generator
          </TabsTrigger>
          <TabsTrigger value="history" className="flex items-center gap-2">
            <History className="h-4 w-4" />
            Content History
          </TabsTrigger>
          <TabsTrigger value="tools" className="flex items-center gap-2">
            <Wrench className="h-4 w-4" />
            Script Tools
          </TabsTrigger>
        </TabsList>

        <TabsContent value="generator">
          <ScriptGeneratorPage />
        </TabsContent>

        <TabsContent value="history">
          <ContentHistoryPage />
        </TabsContent>

        <TabsContent value="tools">
          <ScriptToolsPage />
        </TabsContent>
      </Tabs>
    </div>
  );
}