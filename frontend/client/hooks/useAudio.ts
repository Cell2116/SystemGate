import { useCallback } from 'react';
export const useAudio = () => {
  const playDing = useCallback(() => {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      
      const fundamental = audioContext.createOscillator();
      const harmonic = audioContext.createOscillator();
      const fundamentalGain = audioContext.createGain();
      const harmonicGain = audioContext.createGain();
      
      fundamental.connect(fundamentalGain);
      harmonic.connect(harmonicGain);
      fundamentalGain.connect(audioContext.destination);
      harmonicGain.connect(audioContext.destination);
      
      
      fundamental.frequency.value = 1400; 
      fundamental.type = 'sine';
      fundamentalGain.gain.setValueAtTime(0.4, audioContext.currentTime);
      fundamentalGain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
      
      
      harmonic.frequency.value = 2800; 
      harmonic.type = 'sine';
      harmonicGain.gain.setValueAtTime(0.2, audioContext.currentTime);
      harmonicGain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.15);
      
      fundamental.start(audioContext.currentTime);
      harmonic.start(audioContext.currentTime);
      fundamental.stop(audioContext.currentTime + 1);
      harmonic.stop(audioContext.currentTime + 0.15);
    } catch (error) {
      console.warn('Audio playback failed:', error);
    }
  }, []);
  const playDingDongBell = useCallback(() => {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      
      const ding = audioContext.createOscillator();
      const dingGain = audioContext.createGain();
      ding.connect(dingGain);
      dingGain.connect(audioContext.destination);
      
      ding.frequency.value = 800; 
      ding.type = 'sine';
      dingGain.gain.setValueAtTime(0.4, audioContext.currentTime);
      dingGain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
      
      ding.start(audioContext.currentTime);
      ding.stop(audioContext.currentTime + 0.5);
      
      
      const dong = audioContext.createOscillator();
      const dongGain = audioContext.createGain();
      dong.connect(dongGain);
      dongGain.connect(audioContext.destination);
      
      dong.frequency.value = 600; 
      dong.type = 'sine';
      dongGain.gain.setValueAtTime(0.4, audioContext.currentTime + 0.6);
      dongGain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 1.2);
      
      dong.start(audioContext.currentTime + 0.6);
      dong.stop(audioContext.currentTime + 1.2);
    } catch (error) {
      console.warn('Audio playback failed:', error);
    }
  }, []);
  const playNotificationSound = useCallback((type: 'success' | 'warning' | 'error' = 'success') => {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      
      const frequencies = {
        success: 800,
        warning: 600,
        error: 400
      };
      
      oscillator.frequency.value = frequencies[type];
      oscillator.type = 'sine';
      gainNode.gain.setValueAtTime(0.5, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime);
    } catch (error) {
      console.warn('Notification sound failed:', error);
    }
  }, []);
  return {
    playDing,
    playDingDongBell,
    playNotificationSound
  };
};
