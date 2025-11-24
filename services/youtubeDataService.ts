import { YouTubeChannel, YouTubeVideoDetails } from "../types";

const BASE_URL = 'https://www.googleapis.com/youtube/v3';

export const getVideoIdFromUrl = (url: string): string | null => {
    if (!url) return null;
    let videoId: string | null = null;
    try {
        if (url.includes('youtu.be/')) {
            videoId = url.split('youtu.be/')[1].split('?')[0].split('&')[0];
        } else if (url.includes('youtube.com/')) {
            const urlParams = new URLSearchParams(new URL(url).search);
            videoId = urlParams.get('v');
        }
    } catch (e) {
        // Not a valid URL, could be just an ID
    }

    if (!videoId) {
        const regex = /^[a-zA-Z0-9_-]{11}$/;
        if (regex.test(url)) {
            return url;
        }
    }
    return videoId;
};


export const fetchVideoDetails = async (videoId: string, apiKey: string): Promise<YouTubeVideoDetails> => {
    const url = `${BASE_URL}/videos?part=snippet,statistics&id=${videoId}&key=${apiKey}`;
    const response = await fetch(url);
    if (!response.ok) {
        const error = await response.json();
        throw new Error(`Failed to fetch video details: ${error.error.message}`);
    }
    const result = await response.json();
    if (!result.items || result.items.length === 0) {
        throw new Error(`Video with ID "${videoId}" not found.`);
    }
    const video = result.items[0];
    return {
        id: video.id,
        title: video.snippet.title,
        description: video.snippet.description,
        tags: video.snippet.tags || [],
        thumbnailUrl: video.snippet.thumbnails.high?.url || video.snippet.thumbnails.default.url,
        channelTitle: video.snippet.channelTitle,
        stats: {
            viewCount: video.statistics.viewCount,
            likeCount: video.statistics.likeCount,
            commentCount: video.statistics.commentCount,
        }
    };
};

export const findBenchmarkVideo = async (keyword: string, apiKey: string): Promise<YouTubeVideoDetails> => {
    // Search for a popular video by keyword
    const searchUrl = `${BASE_URL}/search?part=snippet&q=${encodeURIComponent(keyword)}&type=video&order=viewCount&maxResults=1&key=${apiKey}`;
    const searchResponse = await fetch(searchUrl);
    if (!searchResponse.ok) {
        const error = await searchResponse.json();
        throw new Error(`Failed to search for benchmark video: ${error.error.message}`);
    }
    const searchResult = await searchResponse.json();
    if (!searchResult.items || searchResult.items.length === 0) {
        throw new Error(`No videos found for keyword "${keyword}".`);
    }
    const videoId = searchResult.items[0].id.videoId;
    // Fetch details for that video
    return await fetchVideoDetails(videoId, apiKey);
};

export const fetchChannelData = async (identifier: string, apiKey: string): Promise<YouTubeChannel> => {
    // 1. Search for the channel to get its ID
    const searchUrl = `${BASE_URL}/search?part=snippet&q=${encodeURIComponent(identifier)}&type=channel&key=${apiKey}`;
    const searchResponse = await fetch(searchUrl);
    if (!searchResponse.ok) {
        const error = await searchResponse.json();
        throw new Error(`Failed to search for YouTube channel: ${error.error.message}`);
    }
    const searchResult = await searchResponse.json();
    
    if (!searchResult.items || searchResult.items.length === 0) {
        throw new Error(`Channel "${identifier}" not found.`);
    }
    const channelSnippet = searchResult.items[0].snippet;
    const channelId = channelSnippet.channelId;

    // 2. Get detailed channel statistics
    const statsUrl = `${BASE_URL}/channels?part=snippet,statistics&id=${channelId}&key=${apiKey}`;
    const statsResponse = await fetch(statsUrl);
    if (!statsResponse.ok) {
        const error = await statsResponse.json();
        throw new Error(`Failed to fetch channel statistics: ${error.error.message}`);
    }
    const statsResult = await statsResponse.json();

    if (!statsResult.items || statsResult.items.length === 0) {
        throw new Error('Could not retrieve channel statistics.');
    }
    const channelDetails = statsResult.items[0];

    // 3. Get the latest 5 videos from the channel
    const videosUrl = `${BASE_URL}/search?part=snippet&channelId=${channelId}&order=date&type=video&maxResults=5&key=${apiKey}`;
    const videosResponse = await fetch(videosUrl);
    if (!videosResponse.ok) {
        const error = await videosResponse.json();
        throw new Error(`Failed to fetch channel videos: ${error.error.message}`);
    }
    const videosResult = await videosResponse.json();

    return {
        id: channelId,
        title: channelDetails.snippet.title,
        description: channelDetails.snippet.description,
        thumbnailUrl: channelDetails.snippet.thumbnails.default.url,
        stats: channelDetails.statistics,
        videos: videosResult.items.map((item: any) => ({
            id: item.id.videoId,
            title: item.snippet.title,
        })),
    };
};