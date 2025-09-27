import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Bot, Video, Clock, Target } from "lucide-react";

export default function ScriptGeneratorPage() {
  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="flex items-center gap-3 mb-8">
        <Bot className="h-8 w-8 text-blue-600" />
        <div>
          <h1 className="text-3xl font-bold">Script Generator</h1>
          <p className="text-gray-600">Create engaging scripts for short-form video content</p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6 mb-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Video className="h-5 w-5" />
              TikTok Scripts
            </CardTitle>
            <CardDescription>
              Generate viral TikTok scripts with hooks and engagement elements
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full" disabled>
              Coming Soon
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              YouTube Shorts
            </CardTitle>
            <CardDescription>
              Create optimized scripts for YouTube Shorts format
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" className="w-full" disabled>
              Coming Soon
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Script Features
          </CardTitle>
          <CardDescription>What makes our scripts effective</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 rounded-full bg-blue-600 mt-2"></div>
              <div>
                <h4 className="font-medium">Attention-Grabbing Hooks</h4>
                <p className="text-sm text-gray-600">First 3 seconds designed to stop scrolling</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 rounded-full bg-blue-600 mt-2"></div>
              <div>
                <h4 className="font-medium">Platform Optimization</h4>
                <p className="text-sm text-gray-600">Tailored for each platform's unique format</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 rounded-full bg-blue-600 mt-2"></div>
              <div>
                <h4 className="font-medium">Engagement Triggers</h4>
                <p className="text-sm text-gray-600">Built-in elements to maximize viewer interaction</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 rounded-full bg-blue-600 mt-2"></div>
              <div>
                <h4 className="font-medium">Call-to-Action</h4>
                <p className="text-sm text-gray-600">Effective CTAs to boost follows and engagement</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}