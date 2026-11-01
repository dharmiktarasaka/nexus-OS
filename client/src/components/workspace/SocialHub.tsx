import React, { useState, useEffect } from 'react';
import {
  Share2,
  Calendar,
  Sparkles,
  Plus,
  Clock,
  CheckCircle2,
  Image as ImageIcon,
  Send,
  Camera,
  Globe,
  TrendingUp,
  MessageSquare
} from 'lucide-react';
import { api } from '../../services/api';

export const SocialHub: React.FC = () => {
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [captionPrompt, setCaptionPrompt] = useState('');
  const [generatedCaption, setGeneratedCaption] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    const loadPosts = async () => {
      try {
        const res = await api.getSocialPosts();
        setPosts(res.posts || []);
      } catch (err) {
        // Quiet fallback
      } finally {
        setLoading(false);
      }
    };
    loadPosts();
  }, []);

  const handleGenerateCaption = () => {
    if (!captionPrompt.trim()) return;
    setIsGenerating(true);
    setTimeout(() => {
      setGeneratedCaption(
        `🚀 "${captionPrompt.trim()}" is changing the game for modern founders in 2026! Here is why seamless workflows drive 3x revenue retention 👇\n\n1️⃣ Eliminate siloed tools\n2️⃣ Automate repetitive outreach\n3️⃣ Turn data into actionable intelligence\n\nDouble tap if you agree! 💡\n\n#SaaS #BusinessGrowth #Productivity #AIInnovation`
      );
      setIsGenerating(false);
    }, 600);
  };

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Overview Metric Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-2xs">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Posts</p>
          <p className="text-2xl font-extrabold text-slate-900 dark:text-white mt-1">38</p>
          <p className="text-[10px] text-indigo-600 font-semibold mt-1">Published & Scheduled</p>
        </div>
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-2xs">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">In Publishing Queue</p>
          <p className="text-2xl font-extrabold text-indigo-600 mt-1">7</p>
          <p className="text-[10px] text-slate-400 font-semibold mt-1">Auto-release active</p>
        </div>
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-2xs">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Connected Accounts</p>
          <p className="text-2xl font-extrabold text-slate-900 dark:text-white mt-1">3</p>
          <p className="text-[10px] text-emerald-600 font-semibold mt-1">Instagram, FB, Threads</p>
        </div>
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-2xs">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Avg Engagement</p>
          <p className="text-2xl font-extrabold text-purple-600 mt-1">4.8%</p>
          <p className="text-[10px] text-slate-400 font-semibold mt-1">+1.2% this month</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Scheduled & Published Posts */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Scheduled Content Pipeline
            </h3>
            <span className="text-xs text-slate-400">Auto-Scheduler Active</span>
          </div>

          <div className="space-y-3">
            {posts.map((post) => (
              <div
                key={post._id}
                className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="flex items-start gap-3.5 flex-1 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                    {post.platform === 'instagram' ? <Camera className="w-5 h-5" /> : <Share2 className="w-5 h-5" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-900 dark:text-white">
                        {post.accountName || '@tarasaka.official'}
                      </span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                        {post.platform}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 line-clamp-2">
                      {post.content}
                    </p>
                    <div className="flex items-center gap-2 mt-2 text-[11px] text-slate-400">
                      <Clock className="w-3.5 h-3.5" />
                      <span>Scheduled for: {new Date(post.scheduledAt).toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                    {post.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Col: AI Caption & Hashtag Generator */}
        <div className="space-y-4">
          <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-2xs space-y-4">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                AI Social Caption Generator
              </h3>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              Generate viral, high-engagement captions and hashtags for your scheduled campaigns.
            </p>

            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Post Topic or Idea
              </label>
              <textarea
                rows={3}
                value={captionPrompt}
                onChange={(e) => setCaptionPrompt(e.target.value)}
                placeholder="e.g. 5 SaaS scaling tips for 2026 founders..."
                className="w-full mt-1.5 p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-hidden focus:border-indigo-500"
              />
            </div>

            <button
              onClick={handleGenerateCaption}
              disabled={isGenerating || !captionPrompt.trim()}
              className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{isGenerating ? 'Generating with AI...' : 'Generate Caption & Hashtags'}</span>
            </button>

            {generatedCaption && (
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 space-y-2">
                <p className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                  Generated Caption:
                </p>
                <p className="text-xs text-slate-700 dark:text-slate-300 whitespace-pre-line">
                  {generatedCaption}
                </p>
                <button
                  onClick={() => navigator.clipboard.writeText(generatedCaption)}
                  className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
                >
                  Copy to Clipboard
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
