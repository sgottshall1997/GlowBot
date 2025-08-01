import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { getIconByName } from '@/lib/iconMapper';

// Interface for template metadata from the API
interface TemplateMetadata {
  id: string;
  name: string;
  description: string;
  icon: string;
  example: string;
  category: string;
  platforms: string[];
  estimatedLength: string;
  useCase: string;
}

interface TemplatePreviewProps {
  niche: string;
  templateType: string;
  onSelect?: () => void;
  selected?: boolean;
}

export const TemplatePreview: React.FC<TemplatePreviewProps> = ({ 
  niche, 
  templateType,
  onSelect,
  selected = false
}) => {
  const { toast } = useToast();
  
  // Fetch template metadata from the API
  const { data, isLoading, error } = useQuery({
    queryKey: ['/api/templates', templateType],
    queryFn: async () => {
      const response = await fetch(`/api/templates/${templateType}`);
      if (!response.ok) {
        throw new Error('Failed to fetch template metadata');
      }
      const result = await response.json();
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch template metadata');
      }
      return result.template as TemplateMetadata;
    },
    // Don't refetch on window focus since template metadata rarely changes
    refetchOnWindowFocus: false, 
  });
  
  // Get the icon component based on the icon name from template metadata
  const IconComponent = React.useMemo(() => {
    return getIconByName(data?.icon);
  }, [data?.icon]);
  
  // Show loading state
  if (isLoading) {
    return (
      <Card className="w-full h-full">
        <CardHeader>
          <Skeleton className="h-4 w-32 mb-2" />
          <Skeleton className="h-3 w-full" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-20 w-full" />
        </CardContent>
        <CardFooter>
          <Skeleton className="h-9 w-20" />
        </CardFooter>
      </Card>
    );
  }
  
  // Show error state
  if (error || !data) {
    return (
      <Card className="w-full h-full border-red-200">
        <CardHeader>
          <CardTitle className="text-red-500">Template not found</CardTitle>
          <CardDescription>
            Could not load template information for {templateType}
          </CardDescription>
        </CardHeader>
        <CardFooter>
          <Button 
            variant="outline" 
            onClick={() => toast({
              title: "Error",
              description: error?.message || "Failed to load template metadata",
            })}
          >
            Show Error
          </Button>
        </CardFooter>
      </Card>
    );
  }
  
  // Truncate example output to a reasonable length for preview
  const truncatedExample = data.example && data.example.length > 150 
    ? `${data.example.substring(0, 150)}...`
    : data.example || 'No example available';
  
  return (
    <Card className={`w-full h-full transition-all hover:shadow-md ${selected ? 'border-2 border-primary' : ''}`}>
      <CardHeader>
        <div className="flex items-center gap-2">
          <IconComponent className="h-5 w-5 text-primary" />
          <CardTitle>{data.name}</CardTitle>
        </div>
        <CardDescription>{data.description}</CardDescription>
      </CardHeader>
      <CardContent className="text-sm text-gray-600 italic">
        "{truncatedExample}"
      </CardContent>
      <CardFooter>
        <Button 
          onClick={onSelect} 
          variant={selected ? "default" : "outline"}
          className="w-full"
        >
          {selected ? "Selected" : "Select Template"}
        </Button>
      </CardFooter>
    </Card>
  );
};

// Grid view component to show multiple templates
interface TemplateGridProps {
  niche: string;
  templates: string[];
  selectedTemplate?: string;
  onSelectTemplate: (templateType: string) => void;
}

export const TemplateGrid: React.FC<TemplateGridProps> = ({
  niche,
  templates,
  selectedTemplate,
  onSelectTemplate
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {templates.map(templateType => (
        <TemplatePreview
          key={templateType}
          niche={niche}
          templateType={templateType}
          selected={templateType === selectedTemplate}
          onSelect={() => onSelectTemplate(templateType)}
        />
      ))}
    </div>
  );
};