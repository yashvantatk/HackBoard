import confetti from 'canvas-confetti';

export function triggerCompletionConfetti() {
  if (typeof window === 'undefined') return;

  try {
    confetti({
      particleCount: 50,
      spread: 60,
      origin: { y: 0.8 },
      colors: ['#06b6d4', '#10b981', '#3b82f6', '#a855f7'],
    });
  } catch {
    // Graceful fallback
  }
}

export function triggerMegaConfetti() {
  if (typeof window === 'undefined') return;

  try {
    const end = Date.now() + 1000;
    const interval: ReturnType<typeof setInterval> = setInterval(() => {
      if (Date.now() > end) {
        return clearInterval(interval);
      }
      confetti({
        startVelocity: 30,
        spread: 360,
        ticks: 60,
        origin: { x: Math.random(), y: Math.random() - 0.2 },
        colors: ['#06b6d4', '#10b981', '#f59e0b', '#ec4899'],
      });
    }, 200);
  } catch {
    // Graceful fallback
  }
}
