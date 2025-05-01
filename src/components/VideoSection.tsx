
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
        <iframe 
          src="https://www.youtube.com/embed/XNxu7HmiSWM" 
          className="w-full h-full min-h-[300px]" 
          title="The Dip by Seth Godin" 
          frameBorder="0" 
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
          allowFullScreen
        ></iframe>
      </div>
    </div>
  );
};

export default VideoSection;
