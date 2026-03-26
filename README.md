# 🌊 Ocean Invaders

A modern HTML5 Canvas reskin of the classic **Space Invaders**—pilot a submarine defending coral reefs from descending sea monsters! Built with OpenCode Desktop AI as my first web game. Fully responsive, mobile-friendly, and live on GitHub Pages.

[image:1] <!-- Add a game screenshot here later -->

## ✨ Features
- **60FPS smooth gameplay** with `requestAnimationFrame`
- Player sub moves left/right (arrows/WASD), shoots torpedoes (spacebar/tap)
- 5 rows of sea invaders: jellyfish (slow), octopuses, sharks (fast/aggressive)
- Bubble projectiles from enemies, 3 lives, score + high score (localStorage)
- Win by clearing all invaders; particle explosions, Web Audio beeps
- Pause (P), restart (R), touch controls for mobile

## 🛠️ Tech Stack
- Vanilla HTML5 Canvas + JavaScript (no frameworks)
- CSS for retro neon ocean styling
- Modular classes: `Player`, `InvaderGrid`, `BulletPool`, `Game`

## 🎮 How to Play
1. Open `index.html` in any browser
2. Use **← →** or **A/D** to move, **Space** to fire
3. Avoid bubbles, destroy all sea creatures before they reach bottom
4. **P** pause, **R** restart

**Live Demo**: (https://rcream.github.io/invader/)
