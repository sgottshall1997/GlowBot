import { ModuleConfig, PlaybookTemplate } from '../types';

// GlowBot playbooks (adapted from existing GlowBot prompts)
const glowbotPlaybooks: PlaybookTemplate[] = [
  {
    id: 'viral-hook',
    name: 'Viral Hook Generator',
    description: 'Creates engaging hooks for social media content',
    platforms: ['tiktok', 'shorts', 'reels'],
    template: `Create a viral hook for {{platform}} that:
- Grabs attention in the first 3 seconds
- Uses trending language and phrases
- Includes emotional triggers
- Topic: {{topic}}
- Target audience: {{audience}}
- Tone: {{tone}}

Generate 3 different hook options that would make viewers stop scrolling.`,
  },
  {
    id: 'content-script',
    name: 'Content Script Generator',
    description: 'Generates complete scripts for video content',
    platforms: ['youtube', 'tiktok', 'shorts'],
    template: `Write a {{duration}}-second script for {{platform}} about {{topic}}.

Target audience: {{audience}}
Goal: {{goal}}
Tone: {{tone}}

Structure:
- Hook (0-3s): Grab attention immediately
- Problem/Question (3-10s): Present the core issue or question
- Solution/Answer (10-{{duration-5}}s): Provide value or entertainment
- Call-to-Action (last 5s): Clear next step for viewers

Include visual cues and timing markers.`,
  },
  {
    id: 'trend-adaptation',
    name: 'Trend Adaptation',
    description: 'Adapts trending formats to your content',
    platforms: ['tiktok', 'shorts', 'reels'],
    template: `Adapt the trending format "{{trendFormat}}" for content about {{topic}}.

Original trend: {{trendDescription}}
My topic: {{topic}}
My audience: {{audience}}
Platform: {{platform}}

Create a script that:
1. Uses the trending format structure
2. Incorporates my topic naturally
3. Maintains the trend's viral elements
4. Feels authentic to my brand`,
  }
];

export const glowbotModule: ModuleConfig = {
  name: 'GlowBot',
  playbooks: glowbotPlaybooks,
};