import React, { useState } from 'react';
import { Link, useLocation } from 'wouter';
import { 
  Home, 
  BarChart3, 
  FileText, 
  Bot, 
  TrendingUp, 
  Calendar, 
  Eye, 
  Hash, 
  Target, 
  MousePointer, 
  Download, 
  Webhook, 
  Zap, 
  Activity, 
  Info, 
  HelpCircle, 
  MessageCircle, 
  Shield, 
  FileCheck,
  Menu,
  X,
  Settings,
  History,
  TestTube,
  Layers,
  Package,
  Clock,
  DollarSign,
  Mail,
  Users,
  Users2,
  UserCheck,
  FlaskConical,
  Workflow,
  PersonStanding,
  FormInput,
  FileSpreadsheet,
  ShoppingCart,
  BarChart2,
  CreditCard,
  GitBranch,
  Monitor,
  Send,
  Wrench,
  BookOpen,
  Building,
  Lightbulb,
  Video,
  Scissors,
  Type,
  Mic,
  Play,
  Edit3,
  Wand2,
  Brain,
  MessageSquare,
  Film,
  Clock3,
  Sparkles
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface SidebarItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

interface SidebarCategory {
  name: string;
  items: SidebarItem[];
}

const scriptTokSidebarData: SidebarCategory[] = [
  {
    name: "Overview",
    items: [
      { name: "About ScriptTok", href: "/scriptok/about", icon: Info },
    ]
  },
  {
    name: "Modules",
    items: [
      { name: "GlowBot", href: "/", icon: Sparkles },
      { name: "ScriptTok", href: "/scriptok", icon: Bot },
    ]
  },
  {
    name: "Script Generation",
    items: [
      { name: "Dashboard", href: "/scriptok", icon: Home },
      { name: "Quick Script Generator", href: "/scriptok/generator", icon: Wand2 },
      { name: "Advanced Script Builder", href: "/scriptok/advanced-builder", icon: Brain },
      { name: "Hook Generator", href: "/scriptok/hooks", icon: Target },
    ]
  },
  {
    name: "Content Types",
    items: [
      { name: "TikTok Scripts", href: "/scriptok/tiktok", icon: Video },
      { name: "YouTube Shorts", href: "/scriptok/youtube-shorts", icon: Play },
      { name: "Instagram Reels", href: "/scriptok/instagram-reels", icon: Film },
      { name: "Viral Hooks", href: "/scriptok/viral-hooks", icon: Zap },
    ]
  },
  {
    name: "Script Tools",
    items: [
      { name: "Script Templates", href: "/scriptok/templates", icon: Layers },
      { name: "Dialogue Editor", href: "/scriptok/dialogue-editor", icon: MessageSquare },
      { name: "Timing & Pacing", href: "/scriptok/timing", icon: Clock3 },
      { name: "Script Formatter", href: "/scriptok/formatter", icon: Type },
    ]
  },
  {
    name: "Content Management",
    items: [
      { name: "Script History", href: "/scriptok/history", icon: History },
      { name: "Script Analytics", href: "/scriptok/analytics", icon: BarChart3 },
      { name: "Content Calendar", href: "/scriptok/calendar", icon: Calendar },
      { name: "Saved Scripts", href: "/scriptok/saved", icon: BookOpen },
    ]
  },
  {
    name: "AI Enhancement",
    items: [
      { name: "AI Script Optimizer", href: "/scriptok/optimizer", icon: Brain },
      { name: "Trend Analysis", href: "/scriptok/trends", icon: TrendingUp },
      { name: "Voice & Tone", href: "/scriptok/voice-tone", icon: Mic },
      { name: "Script Testing", href: "/scriptok/testing", icon: TestTube },
    ]
  },
  {
    name: "Export & Sharing",
    items: [
      { name: "Export Scripts", href: "/scriptok/export", icon: Download },
      { name: "Collaboration", href: "/scriptok/collaboration", icon: Users },
      { name: "Version Control", href: "/scriptok/versions", icon: GitBranch },
    ]
  },
  {
    name: "Integration",
    items: [
      { name: "Platform Integration", href: "/scriptok/integrations", icon: Webhook },
      { name: "API Settings", href: "/scriptok/api", icon: Settings },
      { name: "Automation", href: "/scriptok/automation", icon: Workflow },
    ]
  },
  {
    name: "Support",
    items: [
      { name: "Script Writing Guide", href: "/scriptok/guide", icon: HelpCircle },
      { name: "Best Practices", href: "/scriptok/best-practices", icon: Lightbulb },
      { name: "FAQ", href: "/scriptok/faq", icon: MessageCircle },
      { name: "Contact Support", href: "/scriptok/contact", icon: Mail },
    ]
  }
];

interface ScriptTokSidebarProps {
  className?: string;
}

export const ScriptTokSidebar: React.FC<ScriptTokSidebarProps> = ({ className }) => {
  const [location] = useLocation();
  const [isCollapsed, setIsCollapsed] = useState(true); // Start collapsed on mobile

  const isActive = (href: string) => {
    if (href === '/scriptok') {
      return location === '/scriptok' || location === '/scriptok/';
    }
    return location === href || location.startsWith(href + '/');
  };

  return (
    <>
      {/* Mobile overlay */}
      {!isCollapsed && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setIsCollapsed(true)}
        />
      )}

      {/* Sidebar */}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 transform transition-transform duration-200 ease-in-out flex flex-col",
        "lg:relative lg:translate-x-0 lg:h-screen lg:flex-shrink-0",
        isCollapsed ? "-translate-x-full lg:translate-x-0" : "translate-x-0",
        className
      )}>
        {/* Header */}
        <div className="flex items-center justify-between h-16 px-6 border-b border-gray-200 flex-shrink-0">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
              <Bot className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900">ScriptTok</span>
          </div>
          <button
            onClick={() => setIsCollapsed(true)}
            className="lg:hidden p-2 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation - Scrollable */}
        <nav className="flex-1 px-4 py-6 space-y-8 overflow-y-auto">
          {scriptTokSidebarData.map((category) => (
            <div key={category.name}>
              <h3 className="px-2 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                {category.name}
              </h3>
              <div className="space-y-1">
                {category.items.map((item) => {
                  const Icon = item.icon;
                  const active = isActive(item.href);

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        "group flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors duration-150",
                        active
                          ? "bg-blue-50 text-blue-700 border-r-2 border-blue-700"
                          : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                      )}
                      onClick={() => setIsCollapsed(true)}
                    >
                      <Icon
                        className={cn(
                          "mr-3 h-5 w-5 flex-shrink-0",
                          active ? "text-blue-700" : "text-gray-400 group-hover:text-gray-600"
                        )}
                      />
                      {item.name}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 flex-shrink-0">
          <div className="text-xs text-gray-500 text-center">
            AI-Powered Script Generation
          </div>
        </div>
      </aside>

      {/* Mobile menu button */}
      <button
        onClick={() => setIsCollapsed(false)}
        className="fixed top-4 left-4 z-40 lg:hidden p-2 rounded-md bg-white shadow-lg border border-gray-200 text-gray-600 hover:text-gray-900"
      >
        <Menu className="h-6 w-6" />
      </button>
    </>
  );
};

export default ScriptTokSidebar;