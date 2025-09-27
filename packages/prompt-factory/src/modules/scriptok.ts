import { ModuleConfig, PlaybookTemplate } from '../types';

// ScriptTok playbooks (placeholder - will be adapted from actual ScriptTok code)
const scriptokPlaybooks: PlaybookTemplate[] = [
  {
    id: 'tiktok-script',
    name: 'TikTok Script Generator',
    description: 'Creates engaging TikTok scripts with hooks and viral elements',
    platforms: ['tiktok'],
    template: `Create a TikTok script about {{topic}}:

HOOK (0-3 seconds):
{{hookType}} hook that immediately grabs attention
Topic: {{topic}}
Angle: {{angle}}

BODY (3-{{duration-3}} seconds):
- Build on the hook with {{contentStyle}}
- Include {{engagement}} elements
- Use {{tone}} tone
- Target audience: {{audience}}

CALL TO ACTION (last 3 seconds):
{{ctaType}} that encourages {{desiredAction}}

Format: Include timing, visual cues, and trending elements.`,
  },
  {
    id: 'shorts-script',
    name: 'YouTube Shorts Generator',
    description: 'Optimized scripts for YouTube Shorts format',
    platforms: ['shorts'],
    template: `Generate a YouTube Shorts script:

Topic: {{topic}}
Duration: {{duration}} seconds
Style: {{style}}
Target: {{audience}}

STRUCTURE:
1. HOOK (0-2s): {{hookStrategy}}
2. SETUP (2-8s): Context and problem
3. PAYOFF (8-{{duration-5}}s): Solution/reveal/entertainment
4. ENGAGEMENT (last 5s): Subscribe, like, comment prompt

Include:
- Trending keywords: {{keywords}}
- Visual suggestions
- Pacing notes
- Engagement hooks`,
  },
  {
    id: 'reels-script',
    name: 'Instagram Reels Creator',
    description: 'Instagram Reels scripts with visual storytelling',
    platforms: ['reels'],
    template: `Instagram Reels script for {{topic}}:

FORMAT: {{format}}
LENGTH: {{duration}}s
AUDIENCE: {{audience}}
GOAL: {{goal}}

VISUAL STORY ARC:
Hook (0-2s): {{visualHook}}
Build (2-10s): {{storyProgression}}
Climax (10-{{duration-5}}s): {{payoff}}
CTA (last 5s): {{callToAction}}

AUDIO STRATEGY:
- Music: {{musicStyle}}
- Voiceover: {{voiceStyle}}
- Text overlays: {{textStrategy}}

HASHTAG STRATEGY:
Mix of trending and niche hashtags for {{niche}}`,
  }
];

export const scriptokModule: ModuleConfig = {
  name: 'ScriptTok',
  playbooks: scriptokPlaybooks,
};