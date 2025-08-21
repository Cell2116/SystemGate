import { useEffect } from 'react';

interface ScaleConfig {
  width: number;
  height?: number;
  scale: number;
}

const scaleConfigs: ScaleConfig[] = [
  { width: 1366, height: 768, scale: 0.75 }, 
  { width: 1366, height: 626, scale: 0.1 },  
  { width: 1366, scale: 0.8 },                
  { width: 1821, height: 834 ,scale: 0.8 },   
  { width: 1440, scale: 0.85 },               
  { width: 1600, scale: 0.9 },               
];

export const useResponsiveScale = (): void => {
  useEffect(() => {
    const applyScale = (): void => {
      const screenWidth = window.innerWidth;
      const screenHeight = window.innerHeight;
      
      let scale = 1;
      
      for (const config of scaleConfigs) {
        if (screenWidth <= config.width) {
          if (config.height) {
            if (screenHeight <= config.height) {
              scale = config.scale;
              break;
            }
          } else {
            scale = config.scale;
            break;
          }
        }
      }
      
      if (scale < 1) {
        document.body.style.zoom = scale.toString();
        document.body.style.overflow = 'hidden';
        document.documentElement.style.overflow = 'hidden';
      } else {
        document.body.style.zoom = '';
        document.body.style.overflow = '';
        document.documentElement.style.overflow = '';
      }
      
      console.log(`Screen: ${screenWidth}x${screenHeight}, Scale: ${scale}`);
    };

    applyScale();
    window.addEventListener('resize', applyScale);
    
    return () => {
      window.removeEventListener('resize', applyScale);
      document.body.style.zoom = '';
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
    };
  }, []);
};