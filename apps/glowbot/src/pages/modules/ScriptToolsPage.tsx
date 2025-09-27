import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Wrench, 
  Clock, 
  Target, 
  Type, 
  MessageSquare, 
  Layers,
  Brain,
  Zap,
  Coming
} from "lucide-react";

const tools = [
  {
    id: "timing-optimizer",
    name: "Timing & Pacing Optimizer",
    description: "Optimize script timing for maximum engagement and retention",
    icon: Clock,
    status: "coming-soon",
    category: "Optimization",
  },
  {
    id: "hook-generator",
    name: "Viral Hook Generator", 
    description: "Generate attention-grabbing hooks that stop scrollers",
    icon: Target,
    status: "coming-soon",
    category: "Generation",
  },
  {
    id: "dialogue-editor",
    name: "Dialogue Editor",
    description: "Fine-tune dialogue for natural flow and engagement",
    icon: MessageSquare,
    status: "coming-soon", 
    category: "Editing",
  },
  {
    id: "script-formatter",
    name: "Script Formatter",
    description: "Format scripts for different platforms and requirements",
    icon: Type,
    status: "coming-soon",
    category: "Formatting",
  },
  {
    id: "template-library",
    name: "Script Templates",
    description: "Pre-built templates for common video types and formats", 
    icon: Layers,
    status: "coming-soon",
    category: "Templates",
  },
  {
    id: "ai-enhancer",
    name: "AI Script Enhancer",
    description: "Use AI to improve existing scripts for better performance",
    icon: Brain,
    status: "coming-soon",
    category: "Enhancement",
  },
];

const categoryColors = {
  "Optimization": "bg-blue-100 text-blue-800",
  "Generation": "bg-green-100 text-green-800", 
  "Editing": "bg-purple-100 text-purple-800",
  "Formatting": "bg-orange-100 text-orange-800",
  "Templates": "bg-pink-100 text-pink-800",
  "Enhancement": "bg-indigo-100 text-indigo-800",
};

export function ScriptToolsPage() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wrench className="h-5 w-5" />
            Script Tools
          </CardTitle>
          <CardDescription>
            Advanced tools for script creation, editing, and optimization
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center gap-2 text-blue-800 mb-2">
              <Zap className="h-4 w-4" />
              <span className="font-medium">Advanced Tools Coming Soon</span>
            </div>
            <p className="text-blue-700 text-sm">
              These specialized tools are being developed to enhance your script creation workflow. 
              Each tool will provide unique features to optimize your content for maximum viral potential.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {tools.map((tool) => {
              const IconComponent = tool.icon;
              return (
                <Card key={tool.id} className="relative overflow-hidden opacity-75">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <IconComponent className="h-6 w-6 text-gray-600" />
                      <Badge 
                        variant="secondary" 
                        className={categoryColors[tool.category as keyof typeof categoryColors]}
                      >
                        {tool.category}
                      </Badge>
                    </div>
                    <CardTitle className="text-lg">{tool.name}</CardTitle>
                    <CardDescription className="text-sm">
                      {tool.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button 
                      disabled 
                      className="w-full"
                      data-testid={`tool-${tool.id}`}
                    >
                      Coming Soon
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          <div className="mt-8 p-4 bg-gray-50 rounded-lg">
            <h3 className="font-medium mb-2">Planned Tool Features:</h3>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Real-time script analysis and suggestions</li>
              <li>• Platform-specific optimization recommendations</li>
              <li>• A/B testing capabilities for different script versions</li>
              <li>• Integration with trending content and hashtags</li>
              <li>• Performance metrics and improvement tracking</li>
              <li>• Collaborative editing and team features</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}