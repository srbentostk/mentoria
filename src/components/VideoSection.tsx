
import { useState, useEffect } from 'react';

const VideoSection = () => {
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // Simulate loading delay
    const timer = setTimeout(() => {
      setIsLoaded(true);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="relative w-full h-full min-h-[300px] bg-black/30 rounded-lg overflow-hidden anime-card">
      {!isLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-anime-purple/10 animate-pulse">
          <div className="w-16 h-16 border-4 border-t-anime-purple border-opacity-50 rounded-full animate-spin"></div>
        </div>
      )}
      
      <div className={`w-full h-full ${isLoaded ? 'opacity-100' : 'opacity-0'} transition-opacity duration-700`}>
        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-anime-blue/30 to-anime-purple/30">
          <div className="w-20 h-20 rounded-full bg-white/10 flex items-center justify-center cursor-pointer group">
            <div className="w-0 h-0 border-t-[10px] border-t-transparent border-l-[20px] border-l-white border-b-[10px] border-b-transparent ml-1 group-hover:scale-110 transition-transform"></div>
          </div>
        </div>
        
        {/* This would be replaced with an actual video player in production */}
        <div className="w-full h-full min-h-[300px] bg-black/20 flex items-center justify-center">
          <span className="text-white/50 text-sm">Vídeo de apresentação</span>
        </div>
      </div>
    </div>
  );
};

export default VideoSection;
