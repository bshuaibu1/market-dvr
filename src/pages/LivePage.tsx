import { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import AssetCard from '@/components/AssetCard';
import EventItem from '@/components/EventItem';
import RecordingBar from '@/components/RecordingBar';
import { getInitialAssets, tickAsset, mockEvents } from '@/lib/mockData';
import { motion } from 'framer-motion';

export default function LivePage() {
  const [assets, setAssets] = useState(getInitialAssets);

  useEffect(() => {
    const interval = setInterval(() => {
      setAssets(prev => prev.map(tickAsset));
    }, 200);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-background pt-14 pb-16">
      <Navbar />

      <div className="max-w-6xl mx-auto px-6 py-8">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
        >
          {assets.map(asset => (
            <AssetCard key={asset.symbol} asset={asset} />
          ))}
        </motion.div>

        <div className="mt-12">
          <h2 className="label-caps mb-4">Recent Events</h2>
          <div className="surface-1 rounded-2xl p-4">
            {mockEvents.map(event => (
              <EventItem key={event.id} event={event} />
            ))}
          </div>
        </div>
      </div>

      <RecordingBar />
    </div>
  );
}
