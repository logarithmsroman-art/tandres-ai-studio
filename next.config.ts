import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ['@ffmpeg-installer/ffmpeg', '@ffprobe-installer/ffprobe', 'fluent-ffmpeg', 'youtube-dl-exec'],
};

export default nextConfig;
