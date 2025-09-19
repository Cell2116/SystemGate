/**
 * Audio utilities for playing notification sounds
 */

export function playDingDongBell(): void {
  try {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    
    // DING (nada tinggi pertama)
    const ding = audioContext.createOscillator();
    const dingGain = audioContext.createGain();
    ding.connect(dingGain);
    dingGain.connect(audioContext.destination);
    
    ding.frequency.value = 800; // Nada tinggi untuk "ding"
    ding.type = 'sine';
    dingGain.gain.setValueAtTime(0.4, audioContext.currentTime);
    dingGain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
    
    ding.start(audioContext.currentTime);
    ding.stop(audioContext.currentTime + 0.5);
    
    // DONG (nada rendah kedua, setelah jeda)
    const dong = audioContext.createOscillator();
    const dongGain = audioContext.createGain();
    dong.connect(dongGain);
    dongGain.connect(audioContext.destination);
    
    dong.frequency.value = 600; // Nada lebih rendah untuk "dong"
    dong.type = 'sine';
    dongGain.gain.setValueAtTime(0.4, audioContext.currentTime + 0.6);
    dongGain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 1.2);
    
    dong.start(audioContext.currentTime + 0.6);
    dong.stop(audioContext.currentTime + 1.2);
  } catch (error) {
    console.warn('Audio playback failed:', error);
  }
}

export function playNotificationSound(type: 'success' | 'warning' | 'error' = 'success'): void {
  try {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    // Different frequencies for different notification types
    const frequencies = {
      success: 800,
      warning: 600,
      error: 400
    };
    
    oscillator.frequency.value = frequencies[type];
    oscillator.type = 'sine';
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.3);
  } catch (error) {
    console.warn('Notification sound failed:', error);
  }
}
