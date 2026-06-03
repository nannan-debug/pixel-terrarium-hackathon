export type PixelImportResult = {
  status: "ai" | "local" | "fallback";
  label: string;
  dataUrl: string;
};

const fallbackTiles = [
  {
    label: "红色罐装饮料",
    colors: ["#2b1b1b", "#e94f37", "#ffb13b", "#fff0c2"],
  },
  {
    label: "蓝色玩具",
    colors: ["#171f3d", "#3467eb", "#86c5ff", "#f7fbff"],
  },
  {
    label: "奇异种子",
    colors: ["#152014", "#547d3e", "#d8e06f", "#fff3a3"],
  },
];

export async function pixelateFile(file: File): Promise<PixelImportResult> {
  const aiResult = await requestAiPixel(file);
  if (aiResult) return aiResult;

  try {
    const dataUrl = await readFile(file);
    const image = await loadImage(dataUrl);
    const pixelated = drawPixelated(image);
    return { status: "local", label: file.name.replace(/\.[^.]+$/, "") || "现实投放物", dataUrl: pixelated };
  } catch {
    return fallbackPixel();
  }
}

export function fallbackPixel(): PixelImportResult {
  const tile = fallbackTiles[Math.floor(Math.random() * fallbackTiles.length)];
  const canvas = document.createElement("canvas");
  canvas.width = 96;
  canvas.height = 96;
  const ctx = canvas.getContext("2d");
  if (!ctx) return { status: "fallback", label: tile.label, dataUrl: "" };
  ctx.imageSmoothingEnabled = false;
  ctx.fillStyle = tile.colors[0];
  ctx.fillRect(0, 0, 96, 96);
  for (let y = 0; y < 12; y += 1) {
    for (let x = 0; x < 12; x += 1) {
      const distance = Math.hypot(x - 5.5, y - 5.5);
      if (distance < 4.8 && Math.random() > 0.15) {
        ctx.fillStyle = tile.colors[Math.min(tile.colors.length - 1, Math.floor(distance / 1.5) + 1)];
        ctx.fillRect(x * 8, y * 8, 8, 8);
      }
    }
  }
  return { status: "fallback", label: tile.label, dataUrl: canvas.toDataURL("image/png") };
}

function readFile(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

async function requestAiPixel(file: File): Promise<PixelImportResult | undefined> {
  const endpoint = import.meta.env.VITE_PIXEL_AI_ENDPOINT;
  if (!endpoint) return undefined;

  const formData = new FormData();
  formData.append("image", file);
  try {
    const response = await fetch(endpoint, {
      method: "POST",
      body: formData,
    });
    if (!response.ok) return undefined;
    const json = (await response.json()) as Partial<PixelImportResult>;
    if (json.dataUrl) {
      return {
        status: "ai",
        label: json.label || file.name.replace(/\.[^.]+$/, "") || "现实投放物",
        dataUrl: json.dataUrl,
      };
    }
  } catch {
    return undefined;
  }
  return undefined;
}

function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = src;
  });
}

function drawPixelated(image: HTMLImageElement) {
  const tiny = document.createElement("canvas");
  tiny.width = 24;
  tiny.height = 24;
  const tinyCtx = tiny.getContext("2d");
  if (!tinyCtx) throw new Error("Canvas unavailable");
  tinyCtx.drawImage(image, 0, 0, 24, 24);

  const canvas = document.createElement("canvas");
  canvas.width = 96;
  canvas.height = 96;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas unavailable");
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(tiny, 0, 0, 96, 96);
  ctx.globalCompositeOperation = "source-atop";
  ctx.fillStyle = "rgba(255, 232, 168, 0.1)";
  ctx.fillRect(0, 0, 96, 96);
  return canvas.toDataURL("image/png");
}
