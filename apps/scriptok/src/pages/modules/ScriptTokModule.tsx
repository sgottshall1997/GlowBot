import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Bot, ArrowRight, Video, Clock, Sparkles } from "lucide-react";
import { Link } from "wouter";

export default function ScriptTokModule() {
  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="flex items-center gap-3 mb-8">
        <Bot className="h-8 w-8 text-blue-600" />
        <div>
          <h1 className="text-3xl font-bold">ScriptTok Module</h1>
          <p className="text-gray-600">Specialized script generation for short-form video content</p>
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-8">
        <div className="flex items-center gap-2 text-blue-800 mb-2">
          <Clock className="h-4 w-4" />
          <span className="font-medium">Coming Soon</span>
        </div>
        <p className="text-blue-700 text-sm">
          ScriptTok is currently being integrated into the platform. This module will provide specialized 
          script generation tools optimized for TikTok, Instagram Reels, and YouTube Shorts.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6 mb-8">
        <Card className="opacity-75">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Video className="h-5 w-5" />
              Script Generator
            </CardTitle>
            <CardDescription>
              Create engaging scripts tailored for short-form video platforms
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button disabled className="w-full">
              Coming Soon
            </Button>
          </CardContent>
        </Card>

        <Card className="opacity-75">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5" />
              Viral Optimization
            </CardTitle>
            <CardDescription>
              AI-powered optimization specifically for viral short-form content
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" disabled className="w-full">
              Coming Soon
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Planned Features</CardTitle>
          <CardDescription>What's coming to ScriptTok</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 rounded-full bg-blue-600 mt-2"></div>
              <div>
                <h4 className="font-medium">Platform-Specific Scripts</h4>
                <p className="text-sm text-gray-600">Optimized for TikTok, Reels, and Shorts formats</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 rounded-full bg-blue-600 mt-2"></div>
              <div>
                <h4 className="font-medium">Trend Integration</h4>
                <p className="text-sm text-gray-600">Automatically incorporate trending topics and formats</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 rounded-full bg-blue-600 mt-2"></div>
              <div>
                <h4 className="font-medium">Hook Optimization</h4>
                <p className="text-sm text-gray-600">AI-powered hooks designed to maximize retention</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 rounded-full bg-blue-600 mt-2"></div>
              <div>
                <h4 className="font-medium">Call-to-Action Generator</h4>
                <p className="text-sm text-gray-600">Effective CTAs to boost engagement and follows</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="mt-8 text-center">
        <p className="text-gray-600 mb-4">
          In the meantime, you can use the GlowBot module for your content generation needs.
        </p>
        <Link href="/glowbot">
          <Button variant="outline">
            Try GlowBot Module
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </Link>
      </div>
    </div>
  );
}