# huragok — 3D Asset Generation for Halo Portfolio

Generate 3D models (.glb) from text descriptions using the huragok CLI, then load them into the arena game.

## When to use

Use this skill when the user asks to:
- Create, generate, or make a 3D model or game asset for the arena
- Replace or regenerate an existing arena asset (crates, barriers, props)
- Generate a new model and wire it into the game

## Prerequisites

The following environment variables must be set:
- `HURAGOK_OPENAI_KEY` — OpenAI API key
- `HURAGOK_HUNYUAN_SECRET_ID` — Tencent Cloud SecretId
- `HURAGOK_HUNYUAN_SECRET_KEY` — Tencent Cloud SecretKey

The huragok binary must be built at `D:/Projects/huragok/huragok.exe`. If it doesn't exist, build it:
```bash
cd D:/Projects/huragok && go build ./cmd/huragok/
```

## Usage

```bash
D:/Projects/huragok/huragok.exe create "<prompt>" --output <path>
```

The pipeline runs automatically: text prompt → concept image (DALL-E 3) → 3D model (Hunyuan3D) → .glb file. Takes ~1-3 minutes total.

## Writing prompts

The prompt is sent to OpenAI DALL-E 3. The tool auto-appends "single object, centered, isolated on plain white background, product photography style, no text" — do NOT add this yourself.

**Content filter:** OpenAI blocks certain terms. You MUST avoid these words:
- BLOCKED: pistol, gun, rifle, weapon, shoot, bullet, ammunition
- USE INSTEAD: sidearm, handgun prop, blaster prop, energy device, handheld prop, game asset

## Asset placement in this project

Generated assets go in `static/` and are served differently based on environment:
- **Dev:** loaded from local `static/` directory
- **Prod:** loaded from Cloudflare R2 bucket (upload separately)

The asset URL helper is at `src/lib/arena/assetUrl.ts`. Use `assetUrl('filename.glb')` for textures and `assetBaseUrl()` for SceneLoader mesh imports.

After generating an asset:
1. Place the .glb in `static/`
2. Add it to `.gitignore` if it's large (like other arena assets)
3. Reference it in the game code using the assetUrl helpers
4. For production, upload to R2 bucket

## Example: generate and wire up a new prop

```bash
# Generate the asset
D:/Projects/huragok/huragok.exe create "futuristic sci-fi cargo crate, metal panels with glowing blue indicators, game prop" --output static/new_crate.glb

# Verify it's valid
xxd static/new_crate.glb | head -1
```

Then in the game code, load it:
```typescript
import { assetBaseUrl } from './assetUrl';
const result = await SceneLoader.ImportMeshAsync('', assetBaseUrl(), 'new_crate.glb', scene);
```

## Error handling

- **Content filter error** → rephrase the prompt using safe terms above
- **Billing/credit error** → tell the user to check OpenAI or Tencent Cloud billing
- **Timeout** → run the command again
