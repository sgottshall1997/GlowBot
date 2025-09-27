import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sparkles, ArrowRight, Zap, TrendingUp } from "lucide-react";
import { Link } from "wouter";

export default function GlowBotModule() {
  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="flex items-center gap-3 mb-8">
        <Sparkles className="h-8 w-8 text-purple-600" />
        <div>
          <h1 className="text-3xl font-bold">GlowBot Module</h1>
          <p className="text-gray-600">AI-powered viral content generation platform</p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6 mb-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Viral Content Generator
            </CardTitle>
            <CardDescription>
              Create engaging content that's designed to go viral across all platforms
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/unified-generator">
              <Button className="w-full">
                Start Creating
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5" />
              Advanced Tools
            </CardTitle>
            <CardDescription>
              Access powerful AI models and advanced content generation features
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/ai-model-test">
              <Button variant="outline" className="w-full">
                Explore Tools
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Features</CardTitle>
          <CardDescription>Everything you need for viral content creation</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 rounded-full bg-purple-600 mt-2"></div>
              <div>
                <h4 className="font-medium">Multi-Platform Support</h4>
                <p className="text-sm text-gray-600">TikTok, Instagram Reels, YouTube Shorts, and more</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 rounded-full bg-purple-600 mt-2"></div>
              <div>
                <h4 className="font-medium">AI-Powered Optimization</h4>
                <p className="text-sm text-gray-600">Advanced algorithms to maximize engagement</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 rounded-full bg-purple-600 mt-2"></div>
              <div>
                <h4 className="font-medium">Analytics & Insights</h4>
                <p className="text-sm text-gray-600">Track performance and optimize content strategy</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 rounded-full bg-purple-600 mt-2"></div>
              <div>
                <h4 className="font-medium">Template Library</h4>
                <p className="text-sm text-gray-600">Hundreds of proven viral content templates</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}