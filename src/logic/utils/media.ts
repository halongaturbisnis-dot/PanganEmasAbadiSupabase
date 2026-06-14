/**
 * UTILS/MEDIA.TS
 * Specialized utilities for handling media URLs, like extracting IDs and formatting links.
 */

// Extract YouTube Video ID from any standard YouTube URL
export const extractYoutubeId = (url: string): string | null => {
  if (!url) return null;
  const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([^&?]+)/);
  return match ? match[1] : null;
};

// Get the thumbnail URL for a given YouTube Video ID
export const getYoutubeThumbnail = (videoId: string, quality: 'default' | 'hq' | 'mq' | 'sd' | 'maxres' = 'hq'): string => {
  const qualities = {
    default: 'default.jpg',
    hq: 'hqdefault.jpg',
    mq: 'mqdefault.jpg',
    sd: 'sddefault.jpg',
    maxres: 'maxresdefault.jpg'
  };
  return `https://img.youtube.com/vi/${videoId}/${qualities[quality]}`;
};
