import React from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ChevronDown, Home, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Mode {
  name: string;
  value: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
}

const modes: Mode[] = [
  {
    name: 'Main App',
    value: 'main',
    href: '/',
    icon: Home,
    description: 'Content generation and core features'
  },
  {
    name: 'GlowBot',
    value: 'glowbot',
    href: '/glowbot',
    icon: Sparkles,
    description: 'AI-powered viral content generation'
  }
];

const ModeSwitcher: React.FC = () => {
  const [location, navigate] = useLocation();
  
  // Determine current mode based on location
  const getCurrentMode = () => {
    if (location.startsWith('/glowbot')) {
      return modes.find(m => m.value === 'glowbot') || modes[0];
    }
    return modes[0]; // Default to main app
  };

  const currentMode = getCurrentMode();

  const handleModeChange = (mode: Mode) => {
    navigate(mode.href);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "flex items-center space-x-2 min-w-[140px] justify-between",
            currentMode.value === 'glowbot' && "border-purple-500 bg-purple-50 dark:bg-purple-950"
          )}
        >
          <div className="flex items-center space-x-2">
            <currentMode.icon className="h-4 w-4" />
            <span className="font-medium">{currentMode.name}</span>
          </div>
          <ChevronDown className="h-4 w-4 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent align="start" className="w-64">
        {modes.map((mode) => {
          const Icon = mode.icon;
          const isActive = mode.value === currentMode.value;
          
          return (
            <DropdownMenuItem
              key={mode.value}
              onClick={() => handleModeChange(mode)}
              className={cn(
                "flex flex-col items-start space-y-1 p-3 cursor-pointer",
                isActive && mode.value === 'glowbot' && "bg-purple-50 dark:bg-purple-950",
                isActive && mode.value === 'main' && "bg-blue-50 dark:bg-blue-950"
              )}
            >
              <div className="flex items-center space-x-2 w-full">
                <Icon className="h-4 w-4" />
                <span className="font-medium">{mode.name}</span>
                {isActive && (
                  <div className={cn(
                    "ml-auto w-2 h-2 rounded-full",
                    mode.value === 'glowbot' ? "bg-purple-500" : "bg-blue-500"
                  )} />
                )}
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {mode.description}
              </p>
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default ModeSwitcher;