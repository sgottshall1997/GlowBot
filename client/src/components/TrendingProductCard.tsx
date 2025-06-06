import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { TrendingProduct, SOURCE_COLORS } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { PlusIcon, ExternalLink } from "lucide-react";

interface TrendingProductCardProps {
  product: TrendingProduct;
  rank?: number;
  gradientClass?: string;
  onUseProduct?: (product: TrendingProduct) => void;
}

// Format large numbers with K/M suffix
const formatNumber = (num: number = 0) => {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K';
  }
  return num.toString();
};

export const TrendingProductCard: React.FC<TrendingProductCardProps> = ({ 
  product, 
  rank = 1, 
  gradientClass = "from-blue-500 to-violet-500",
  onUseProduct
}) => {
  const getSourceColorClass = (source: string) => {
    if (source === "suggested") {
      return 'bg-indigo-100 text-indigo-800';
    }
    return SOURCE_COLORS[source as keyof typeof SOURCE_COLORS] || 'bg-gray-100 text-gray-800';
  };

  const handleUseProduct = () => {
    if (onUseProduct) {
      onUseProduct(product);
    }
  };

  // Generate Amazon affiliate link based on product title
  const generateAmazonLink = (title: string) => {
    // Simple keyword extraction for Amazon search
    const searchTerm = title.replace(/[^\w\s]/g, '').replace(/\s+/g, '+');
    return `https://www.amazon.com/s?k=${searchTerm}&tag=sgottshall199-20`;
  };

  const openAmazonLink = () => {
    const amazonUrl = generateAmazonLink(product.title);
    window.open(amazonUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <Card className="overflow-hidden hover:shadow-md transition-shadow">
      <CardContent className="p-0">
        <div className="flex items-center p-4 gap-3">
          <div className={`bg-gradient-to-r ${gradientClass} text-white inline-flex items-center justify-center h-10 w-10 rounded-full flex-shrink-0 shadow-sm`}>
            <span className="text-sm font-bold">{rank}</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-neutral-800 truncate">{product.title}</p>
            <div className="flex items-center mt-1 mb-2">
              <span className={`inline-block text-xs px-2 py-0.5 rounded ${getSourceColorClass(product.source)} mr-2`}>
                {product.isAIGenerated ? 
                  '🤖 AI-' + product.source.charAt(0).toUpperCase() + product.source.slice(1) :
                  '🌐 ' + product.source.charAt(0).toUpperCase() + product.source.slice(1)
                }
              </span>
              <div className="text-xs text-neutral-500 truncate">
                {formatNumber(product.mentions || 0)} {product.isAIGenerated ? 'est. mentions' : 'mentions'}
              </div>
            </div>
            <button 
              onClick={openAmazonLink}
              className="text-xs text-orange-600 hover:text-orange-800 hover:underline flex items-center gap-1"
            >
              <ExternalLink size={12} />
              Find on Amazon
            </button>
          </div>
        </div>
        <div className="p-3 bg-muted flex justify-end">
          <Button 
            size="sm"
            variant="outline"
            className="text-xs font-medium" 
            onClick={handleUseProduct}
          >
            <PlusIcon className="h-3.5 w-3.5 mr-1" />
            Use Product
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};