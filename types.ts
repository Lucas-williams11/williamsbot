// FIX: Removed self-import which was causing declaration conflicts.
export interface VideoIdea {
  title: string;
  description: string;
  tags: string[];
}

export interface ChannelAnalysis {
  strengths: string[];
  weaknesses:string[];
  opportunities: string[];
  videoIdeas: { title: string; description: string }[];
}

export interface ChatMessage {
  role: 'user' | 'model';
  parts: { text: string }[];
}

// Types for YouTube Data API integration
export interface YouTubeChannelStats {
  viewCount: string;
  subscriberCount: string;
  videoCount: string;
}

export interface YouTubeVideoInfo {
  id: string;
  title: string;
}

export interface YouTubeChannel {
  id: string;
  title: string;
  description: string;
  thumbnailUrl: string;
  stats: YouTubeChannelStats;
  videos: YouTubeVideoInfo[];
}

export interface YouTubeVideoStats {
  viewCount: string;
  likeCount: string;
  commentCount: string;
}

export interface YouTubeVideoDetails {
  id: string;
  title: string;
  description: string;
  tags: string[];
  thumbnailUrl: string;
  channelTitle: string;
  stats: YouTubeVideoStats;
}

export interface VideoProposal {
    titles: string[];
    description: string;
    tags: string[];
    script: {
        hook: string;
        introduction: string;
        mainPoints: string[];
        callToAction: string;
        outro: string;
    };
    thumbnailConcepts: string[];
}

export interface ComparativeAnalysis {
    userVideo: {
        strength: string;
        weakness: string;
    };
    benchmarkVideo: {
        strength: string;
        tacticToAdopt: string;
    };
    improvementAreas: {
        title: string;
        thumbnail: string;
        content: string;
    };
}

export interface OneMillionAnalysis {
    benchmarkVideoAnalysis: {
        titleHook: string;
        contentStrategy: string;
        targetAudience: string;
        monetizationPotential: string;
    };
    consultingResult: VideoProposal | ComparativeAnalysis;
}

export interface StoryboardScene {
    scene: string;
    prompt: string;
}

export interface GeneratedStoryboardScene extends StoryboardScene {
    imageUrl: string;
}