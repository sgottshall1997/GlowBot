import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Video, Wand2, Copy, Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export function ScriptGeneratorPage() {
  const [topic, setTopic] = useState("");
  const [platform, setPlatform] = useState("");
  const [audience, setAudience] = useState("");
  const [tone, setTone] = useState("");
  const [generatedScript, setGeneratedScript] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();

  const handleGenerate = async () => {
    if (!topic || !platform) {
      toast({
        title: "Missing Information",
        description: "Please fill in the topic and platform fields.",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    
    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          module: "scriptok",
          platform: platform.toLowerCase(),
          playbook: "tiktok-script",
          inputs: {
            topic,
            audience: audience || "general",
            tone: tone || "engaging",
          },
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to generate script");
      }

      const data = await response.json();
      setGeneratedScript(data.text);
      
      toast({
        title: "Script Generated!",
        description: "Your script has been generated successfully.",
      });
    } catch (error) {
      toast({
        title: "Generation Failed",
        description: "Failed to generate script. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedScript);
    toast({
      title: "Copied!",
      description: "Script copied to clipboard.",
    });
  };

  return (
    <div className="grid lg:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Video className="h-5 w-5" />
            Script Generator
          </CardTitle>
          <CardDescription>
            Create engaging scripts for short-form video content
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="topic">Content Topic *</Label>
            <Input
              id="topic"
              placeholder="e.g., Morning routine, Productivity tips..."
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              data-testid="input-topic"
            />
          </div>

          <div>
            <Label htmlFor="platform">Platform *</Label>
            <Select value={platform} onValueChange={setPlatform}>
              <SelectTrigger data-testid="select-platform">
                <SelectValue placeholder="Select platform" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="tiktok">TikTok</SelectItem>
                <SelectItem value="shorts">YouTube Shorts</SelectItem>
                <SelectItem value="reels">Instagram Reels</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="audience">Target Audience</Label>
            <Input
              id="audience"
              placeholder="e.g., Gen Z, Business professionals..."
              value={audience}
              onChange={(e) => setAudience(e.target.value)}
              data-testid="input-audience"
            />
          </div>

          <div>
            <Label htmlFor="tone">Tone</Label>
            <Select value={tone} onValueChange={setTone}>
              <SelectTrigger data-testid="select-tone">
                <SelectValue placeholder="Select tone" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="engaging">Engaging</SelectItem>
                <SelectItem value="professional">Professional</SelectItem>
                <SelectItem value="humorous">Humorous</SelectItem>
                <SelectItem value="inspirational">Inspirational</SelectItem>
                <SelectItem value="educational">Educational</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button 
            onClick={handleGenerate} 
            disabled={isGenerating} 
            className="w-full"
            data-testid="button-generate"
          >
            <Wand2 className="mr-2 h-4 w-4" />
            {isGenerating ? "Generating..." : "Generate Script"}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Generated Script</CardTitle>
          <CardDescription>
            Your AI-generated script will appear here
          </CardDescription>
        </CardHeader>
        <CardContent>
          {generatedScript ? (
            <div className="space-y-4">
              <Textarea
                value={generatedScript}
                readOnly
                className="min-h-[300px] font-mono text-sm"
                data-testid="text-generated-script"
              />
              <div className="flex gap-2">
                <Button onClick={copyToClipboard} variant="outline" size="sm" data-testid="button-copy">
                  <Copy className="mr-2 h-4 w-4" />
                  Copy
                </Button>
                <Button variant="outline" size="sm" data-testid="button-download">
                  <Download className="mr-2 h-4 w-4" />
                  Download
                </Button>
              </div>
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">
              <Video className="mx-auto h-12 w-12 mb-4 opacity-50" />
              <p>Generate a script to see it here</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}