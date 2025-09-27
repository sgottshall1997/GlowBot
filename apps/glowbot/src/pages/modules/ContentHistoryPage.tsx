import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { History, Copy, Eye, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ContentItem {
  id: string;
  module: string;
  platform: string;
  playbook: string;
  text: string;
  meta: any;
  createdAt: string;
}

export function ContentHistoryPage() {
  const [contentHistory, setContentHistory] = useState<ContentItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchContentHistory();
  }, []);

  const fetchContentHistory = async () => {
    try {
      const response = await fetch("/api/content?module=scriptok");
      if (response.ok) {
        const data = await response.json();
        setContentHistory(data);
      }
    } catch (error) {
      console.error("Failed to fetch content history:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: "Script copied to clipboard.",
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const truncateText = (text: string, maxLength: number = 150) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + "...";
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Content History
          </CardTitle>
          <CardDescription>Loading your generated scripts...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <History className="h-5 w-5" />
          Content History
        </CardTitle>
        <CardDescription>
          Your generated scripts from ScriptTok
        </CardDescription>
      </CardHeader>
      <CardContent>
        {contentHistory.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <History className="mx-auto h-12 w-12 mb-4 opacity-50" />
            <p className="text-lg font-medium mb-2">No scripts generated yet</p>
            <p>Generated scripts will appear here for easy access and management.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {contentHistory.map((item) => (
              <div
                key={item.id}
                className="border rounded-lg p-4 space-y-3"
                data-testid={`content-item-${item.id}`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="secondary">{item.platform}</Badge>
                      <Badge variant="outline">{item.playbook}</Badge>
                      <span className="text-sm text-gray-500">
                        {formatDate(item.createdAt)}
                      </span>
                    </div>
                    <p className="text-sm text-gray-700 leading-relaxed">
                      {truncateText(item.text)}
                    </p>
                  </div>
                  <div className="flex gap-2 ml-4">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(item.text)}
                      data-testid="button-copy-content"
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      data-testid="button-view-content"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-red-600 hover:text-red-700"
                      data-testid="button-delete-content"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}