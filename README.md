# Halo Portfolio

A Halo-themed interactive portfolio site with a playable FPS arena mini-game, built with SvelteKit and Babylon.js.

## Arena

The site includes a fully playable browser-based FPS arena inspired by Halo CE. Features include:

- First-person movement with Halo-style air control and momentum
- Assault rifle with 900 RPM fire rate, recoil, and reload mechanics
- Shield/health system with recharging shields
- AI enemies
- Halo-style HUD (shield arc, health segments, ammo counter, kill tracker)
- 3D environment with textured walls, floors, cargo crates, and barricades

## 3D Asset Generation (huragok)

Arena assets can be generated using [huragok](https://github.com/jorgoose/huragok), a CLI tool that turns text descriptions into game-ready 3D models.

```bash
huragok create "sci-fi cargo crate, metal panels, glowing blue indicators" --output static/cargo_crate.glb
```

The pipeline: text prompt → concept image (OpenAI DALL-E 3) → 3D model (Tencent Hunyuan3D) → .glb file ready to load in the arena.

## Development

```bash
npm install
npm run dev
```

Assets are loaded from local `static/` in dev and from a Cloudflare R2 bucket in production (see `src/lib/arena/assetUrl.ts`).

## Tech stack

- **Frontend:** SvelteKit, TypeScript
- **3D Engine:** Babylon.js
- **Asset Generation:** [huragok](https://github.com/jorgoose/huragok) (Go CLI — OpenAI + Hunyuan3D)
- **Hosting:** Vercel
- **Assets:** Cloudflare R2
