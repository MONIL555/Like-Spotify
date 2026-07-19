'use client';

import { motion } from 'framer-motion';
import { HelpCircle, DownloadCloud, Play, Smartphone, Music2, Search, Heart, LayoutList, FastForward } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

export default function HelpPage() {
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 pb-32 animate-fade-in">
      <div className="flex items-start md:items-center gap-4 mb-8">
        <div className="shrink-0 h-12 w-12 md:h-14 md:w-14 rounded-2xl bg-brand-primary flex items-center justify-center text-white shadow-[0_0_20px_rgba(29,185,84,0.3)] mt-1 md:mt-0">
          <HelpCircle className="h-6 w-6 md:h-7 md:w-7" />
        </div>
        <div>
          <h1 className="text-3xl font-black text-foreground tracking-tight">Help & Features</h1>
          <p className="text-muted-foreground font-medium">Everything you need to know about MoniStream</p>
        </div>
      </div>

      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="space-y-6"
      >
        {/* Cached & Lockscreen Playback */}
        <motion.section variants={itemVariants}>
          <Card className="bg-gradient-to-br from-brand-primary/10 to-transparent border-brand-primary/20 overflow-hidden relative">
            <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
              <DownloadCloud className="h-32 w-32 text-brand-primary" />
            </div>
            <CardContent className="p-6 md:p-8 relative z-10">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-primary text-white text-xs font-bold uppercase tracking-widest mb-4">
                <span>Core Feature</span>
              </div>
              <h2 className="text-2xl font-black text-foreground mb-3">Fully Cached & Background Play</h2>
              <p className="text-muted-foreground leading-relaxed mb-4 font-medium text-sm md:text-base">
                MoniStream uses a highly intelligent audio routing system to give you the ultimate premium experience for free. 
                When you play a song, our engine automatically streams it from high-quality sources like JioSaavn or caches it in the background.
              </p>
              
              <div className="grid sm:grid-cols-2 gap-4 mt-6">
                <div className="bg-black/20 rounded-xl p-4 border border-white/5">
                  <div className="flex items-center gap-3 mb-2">
                    <Smartphone className="h-5 w-5 text-brand-primary" />
                    <h3 className="font-bold text-foreground">Lockscreen Controls</h3>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed font-medium">
                    Once a track is fetched or cached natively, you get full support for system lockscreen controls and media keys—just like a native app.
                  </p>
                </div>
                <div className="bg-black/20 rounded-xl p-4 border border-white/5">
                  <div className="flex items-center gap-3 mb-2">
                    <DownloadCloud className="h-5 w-5 text-brand-primary" />
                    <h3 className="font-bold text-foreground">Seamless Caching</h3>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed font-medium">
                    If a song only exists on YouTube, listening to it for 30 seconds triggers our backend to cache the audio file permanently, instantly upgrading it to support background play. 
                    <br/><br/>
                    <span className="text-brand-primary/80">If automatic caching fails for any reason, an admin will manually cache it for you within 24 hours.</span>
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.section>

        {/* Other Features Grid */}
        <motion.div variants={itemVariants} className="grid md:grid-cols-2 gap-6">
          
          <Card className="bg-white/5 border-white/5 hover:bg-white/10 transition-colors">
            <CardContent className="p-6">
              <div className="h-10 w-10 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-500 mb-4">
                <FastForward className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-bold text-foreground mb-2">Endless Autoplay Mix</h3>
              <p className="text-sm text-muted-foreground font-medium leading-relaxed">
                When you play a single track, MoniStream automatically generates an endless radio mix of similar vibes. We pull these directly from native sources so the music never stops when your screen turns off.
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white/5 border-white/5 hover:bg-white/10 transition-colors">
            <CardContent className="p-6">
              <div className="h-10 w-10 rounded-full bg-purple-500/20 flex items-center justify-center text-purple-500 mb-4">
                <Search className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-bold text-foreground mb-2">Universal Search</h3>
              <p className="text-sm text-muted-foreground font-medium leading-relaxed">
                Search for any song, artist, album, or playlist. Our engine aggregates data globally to find exactly what you want, regardless of the platform it originated from.
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white/5 border-white/5 hover:bg-white/10 transition-colors">
            <CardContent className="p-6">
              <div className="h-10 w-10 rounded-full bg-pink-500/20 flex items-center justify-center text-pink-500 mb-4">
                <Heart className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-bold text-foreground mb-2">Liked Songs & History</h3>
              <p className="text-sm text-muted-foreground font-medium leading-relaxed">
                Click the heart icon on any track to save it to your "Liked Songs". You can also instantly jump back into your most recently played native tracks right from the Home dashboard.
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white/5 border-white/5 hover:bg-white/10 transition-colors">
            <CardContent className="p-6">
              <div className="h-10 w-10 rounded-full bg-orange-500/20 flex items-center justify-center text-orange-500 mb-4">
                <LayoutList className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-bold text-foreground mb-2">Playlists & Queue</h3>
              <p className="text-sm text-muted-foreground font-medium leading-relaxed">
                Create custom playlists, add collaborative tracks, or simply swipe right on any track to quickly add it to your current play queue.
                <br/><br/>
                <strong className="text-foreground/80">How to create a Playlist:</strong><br/>
                Go to your <strong>Profile {'>'} Collections</strong> to create a new one. You can also easily add songs from your <strong>Recently Played</strong> history by tapping the options menu next to any track.
              </p>
            </CardContent>
          </Card>

        </motion.div>

        {/* Pro Tip */}
        <motion.section variants={itemVariants}>
          <div className="rounded-2xl bg-black/40 border border-white/5 p-6 flex flex-col sm:flex-row items-center gap-6">
            <div className="h-16 w-16 shrink-0 rounded-full bg-brand-primary/20 flex items-center justify-center">
              <Music2 className="h-8 w-8 text-brand-primary" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-foreground mb-1">Pro Tip for Mobile Users</h3>
              <p className="text-sm text-muted-foreground font-medium leading-relaxed">
                If a song initially says it has "limited lockscreen controls" (usually rare YouTube tracks), just listen to it for 30 seconds. A toast notification will appear letting you know the track has been successfully cached. The next time it plays, it will fully support background audio!
              </p>
            </div>
          </div>
        </motion.section>

      </motion.div>
    </div>
  );
}
