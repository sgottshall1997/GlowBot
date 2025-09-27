import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { History, FileText, Clock } from "lucide-react";

export default function ContentHistoryPage() {
  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="flex items-center gap-3 mb-8">
        <History className="h-8 w-8 text-blue-600" />
        <div>
          <h1 className="text-3xl font-bold">Content History</h1>
          <p className="text-gray-600">Review and manage your generated scripts</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Recent Scripts
          </CardTitle>
          <CardDescription>Your generated scripts will appear here</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No scripts yet</h3>
            <p className="text-gray-600">Generate your first script to see it here</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}