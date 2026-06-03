import { ChangeEvent, useEffect, useMemo, useRef, useState } from "react";
import {
  Camera,
  Clock3,
  Flame,
  FlaskConical,
  Leaf,
  Pause,
  Play,
  RotateCcw,
  Sparkles,
  Trophy,
  Waves,
} from "lucide-react";
import {
  Entity,
  EntityKind,
  TerrainTemplate,
  World,
  addCustomEntity,
  advanceWorld,
  deadEntities,
  getSpecies,
  jumpToYear,
  kindLabels,
  livingEntities,
  templateLabels,
  createWorld,
} from "./simulation";
import { PixelImportResult, fallbackPixel, pixelateFile } from "./pixelImage";

const terrainOptions: Array<{ id: TerrainTemplate; icon: string; hint: string }> = [
  { id: "island", icon: "◒", hint: "水域环绕，资源较均衡" },
  { id: "ocean", icon: "≈", hint: "水分充足，陆地稀少" },
  { id: "land", icon: "▰", hint: "肥力高，竞争激烈" },
  { id: "mountain", icon: "▲", hint: "寒冷，生命更脆弱" },
];

const kindOptions: EntityKind[] = ["animal", "plant", "resource", "oddity", "human"];

export function App() {
  const [template, setTemplate] = useState<TerrainTemplate>("island");
  const [world, setWorld] = useState<World>(() => createWorld("island"));
  const [running, setRunning] = useState(true);
  const [selectedId, setSelectedId] = useState<string | undefined>();
  const [imported, setImported] = useState<PixelImportResult>(() => fallbackPixel());
  const [importKind, setImportKind] = useState<EntityKind>("oddity");
  const [importName, setImportName] = useState("现实投放物");
  const [isImporting, setIsImporting] = useState(false);

  const selected = world.entities.find((entity) => entity.id === selectedId) || livingEntities(world)[0];
  const living = livingEntities(world);
  const dead = deadEntities(world);
  const newestReport = world.reports[0];
  const dominantSpecies = useMemo(
    () => [...world.species].sort((a, b) => b.alive - a.alive)[0],
    [world.species],
  );

  useEffect(() => {
    if (!running) return;
    if (world.year >= 100) {
      setRunning(false);
      return;
    }
    const timer = window.setInterval(() => {
      setWorld((current) => {
        if (current.year >= 100) {
          setRunning(false);
          return current;
        }
        const nextWorld = advanceWorld(current, 1);
        if (nextWorld.year >= 100) setRunning(false);
        return nextWorld;
      });
    }, 950);
    return () => window.clearInterval(timer);
  }, [running, world.year]);

  function resetWorld(nextTemplate = template) {
    setTemplate(nextTemplate);
    const nextWorld = createWorld(nextTemplate);
    setWorld(nextWorld);
    setSelectedId(nextWorld.entities[0]?.id);
    setRunning(true);
  }

  async function onFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setIsImporting(true);
    const timeout = new Promise<PixelImportResult>((resolve) => {
      window.setTimeout(() => resolve(fallbackPixel()), 4000);
    });
    const result = await Promise.race([pixelateFile(file), timeout]);
    setImported(result);
    setImportName(result.label);
    setIsImporting(false);
    event.target.value = "";
  }

  function dropImport() {
    setWorld((current) =>
      addCustomEntity(current, {
        name: importName.trim() || imported.label,
        speciesName: importName.trim() || imported.label,
        kind: importKind,
        icon: imported.dataUrl,
      }),
    );
  }

  return (
    <main className="app-shell">
      <section className="stage">
        <header className="topbar">
          <div>
            <p className="eyebrow">PIXEL TERRARIUM / HACKATHON BUILD</p>
            <h1>像素生态箱</h1>
          </div>
          <div className="year-badge">
            <Clock3 size={18} />
            <span>第 {world.year} 年</span>
          </div>
        </header>

        <div className="terrarium-frame">
          <TerrariumCanvas world={world} selectedId={selected?.id} onSelect={setSelectedId} />
          <div className="glass-label">
            <span>{templateLabels[world.template]}</span>
            <span>{living.length} 个存活个体</span>
          </div>
        </div>

        <div className="controls-row">
          <button className="icon-button primary" onClick={() => setRunning((value) => !value)}>
            {running ? <Pause size={18} /> : <Play size={18} />}
            {running ? "暂停" : "运行"}
          </button>
          <button
            className="icon-button"
            disabled={world.year >= 100}
            onClick={() => {
              setWorld((current) => {
                const nextWorld = advanceWorld(current, 1);
                if (nextWorld.year >= 100) setRunning(false);
                return nextWorld;
              });
            }}
          >
            <Sparkles size={18} />
            推进1年
          </button>
          {[10, 50, 100].map((year) => (
            <button
              className="icon-button"
              key={year}
              disabled={world.year >= year}
              onClick={() => {
                setWorld((current) => jumpToYear(current, year as 10 | 50 | 100));
                if (year === 100) setRunning(false);
              }}
            >
              <Flame size={18} />
              到{year}年
            </button>
          ))}
          <button className="icon-button danger" onClick={() => resetWorld()}>
            <RotateCcw size={18} />
            重置
          </button>
        </div>

        <section className="terrain-strip">
          {terrainOptions.map((option) => (
            <button
              key={option.id}
              className={`terrain-card ${template === option.id ? "active" : ""}`}
              onClick={() => resetWorld(option.id)}
            >
              <span className="terrain-icon">{option.icon}</span>
              <span>{templateLabels[option.id]}</span>
              <small>{option.hint}</small>
            </button>
          ))}
        </section>
      </section>

      <aside className="control-panel">
        <section className="panel-section import-panel">
          <div className="section-title">
            <Camera size={18} />
            <h2>拍照投放</h2>
          </div>
          <div className="import-preview">
            {imported.dataUrl ? <img src={imported.dataUrl} alt={imported.label} /> : <div />}
            <span>{imported.status === "ai" ? "AI像素重绘" : imported.status === "local" ? "本地像素化" : "预置样例兜底"}</span>
          </div>
          <label className="file-pick">
            <Camera size={17} />
            {isImporting ? "生成中..." : "上传照片"}
            <input type="file" accept="image/*" capture="environment" onChange={onFileChange} />
          </label>
          <input className="name-input" value={importName} onChange={(event) => setImportName(event.target.value)} />
          <div className="segmented">
            {kindOptions.map((kind) => (
              <button key={kind} className={importKind === kind ? "active" : ""} onClick={() => setImportKind(kind)}>
                {kindLabels[kind]}
              </button>
            ))}
          </div>
          <button className="drop-button" onClick={dropImport}>
            <FlaskConical size={18} />
            投放进生态箱
          </button>
        </section>

        <section className="panel-section metrics">
          <Metric icon={<Leaf size={18} />} label="存活" value={living.length} />
          <Metric icon={<Waves size={18} />} label="灭亡" value={dead.length} />
          <Metric icon={<Sparkles size={18} />} label="物种" value={world.species.length} />
          <Metric icon={<Trophy size={18} />} label="成就" value={world.achievements.length} />
        </section>

        <section className="panel-section">
          <div className="section-title">
            <Trophy size={18} />
            <h2>关键节点</h2>
          </div>
          {newestReport ? (
            <div className="report-card">
              <strong>{newestReport.year} 年生态报告</strong>
              <p>{newestReport.summary}</p>
              <div className="tag-cloud">
                {newestReport.achievements.map((item) => (
                  <span key={item}>{item}</span>
                ))}
                {newestReport.newSpecies.slice(0, 4).map((item) => (
                  <span key={item}>{item}</span>
                ))}
              </div>
            </div>
          ) : (
            <p className="empty-copy">推进到 10 年后会生成第一份生态报告。</p>
          )}
        </section>

        <section className="panel-section">
          <div className="section-title">
            <Leaf size={18} />
            <h2>个体传记</h2>
          </div>
          {selected ? <Biography world={world} entity={selected} /> : <p className="empty-copy">点击生态箱里的个体查看一生。</p>}
        </section>

        <section className="panel-section">
          <div className="section-title">
            <Sparkles size={18} />
            <h2>事件流</h2>
          </div>
          <div className="event-list">
            {world.events.slice(0, 9).map((event) => (
              <button key={event.id} onClick={() => event.entityId && setSelectedId(event.entityId)}>
                <span>{event.year}年</span>
                <p>{event.text}</p>
              </button>
            ))}
          </div>
        </section>

        <section className="panel-section">
          <div className="section-title">
            <Flame size={18} />
            <h2>生态状态</h2>
          </div>
          <div className="climate-bars">
            <Bar label="温度" value={world.climate.temperature} />
            <Bar label="水分" value={world.climate.water} />
            <Bar label="肥力" value={world.climate.fertility} />
          </div>
          <p className="dominant">优势物种：{dominantSpecies?.name || "无"}</p>
        </section>
      </aside>
    </main>
  );
}

function Metric({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) {
  return (
    <div className="metric">
      {icon}
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function Bar({ label, value }: { label: string; value: number }) {
  return (
    <div className="bar-row">
      <span>{label}</span>
      <div>
        <i style={{ width: `${Math.round(value * 100)}%` }} />
      </div>
    </div>
  );
}

function Biography({ world, entity }: { world: World; entity: Entity }) {
  const species = getSpecies(world, entity.speciesId);
  return (
    <div className="bio-card">
      <div className="bio-head">
        <span className={`life-dot ${entity.alive ? "alive" : ""}`} />
        <div>
          <strong>{entity.name}</strong>
          <p>
            {species?.name} / {entity.alive ? `${entity.age}岁` : "已死亡"}
          </p>
        </div>
      </div>
      <div className="bio-events">
        {entity.biography.slice(-7).map((item, index) => (
          <div key={`${item.year}-${index}`}>
            <span>{item.year}年</span>
            <p>{item.text}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function TerrariumCanvas({
  world,
  selectedId,
  onSelect,
}: {
  world: World;
  selectedId?: string;
  onSelect: (id: string) => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const iconCache = useRef<Map<string, HTMLImageElement>>(new Map());

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    drawTerrarium(ctx, canvas.width, canvas.height, world, selectedId, iconCache.current);
  }, [world, selectedId]);

  function handleClick(event: React.MouseEvent<HTMLCanvasElement>) {
    const canvas = event.currentTarget;
    const rect = canvas.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * 100;
    const y = ((event.clientY - rect.top) / rect.height) * 44;
    const hit = livingEntities(world)
      .slice()
      .reverse()
      .find((entity) => Math.hypot(entity.x - x, entity.y - y) < 3.4);
    if (hit) onSelect(hit.id);
  }

  return <canvas ref={canvasRef} width={1180} height={520} onClick={handleClick} />;
}

function drawTerrarium(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  world: World,
  selectedId: string | undefined,
  iconCache: Map<string, HTMLImageElement>,
) {
  ctx.imageSmoothingEnabled = false;
  ctx.clearRect(0, 0, width, height);
  const scaleX = width / 100;
  const scaleY = height / 44;

  const sky = ctx.createLinearGradient(0, 0, 0, height * 0.55);
  sky.addColorStop(0, "#98d5e7");
  sky.addColorStop(1, "#e7dfaa");
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, width, height);

  drawSun(ctx, width, height, world.year);
  drawTerrain(ctx, width, height, world.template);
  drawWeatherTint(ctx, width, height, world);

  world.entities
    .filter((entity) => entity.alive)
    .forEach((entity) => {
      const species = getSpecies(world, entity.speciesId);
      if (!species) return;
      const x = entity.x * scaleX;
      const y = entity.y * scaleY;
      const size = Math.max(8, species.traits.size * 22);

      if (entity.icon) {
        let image = iconCache.get(entity.icon);
        if (!image) {
          image = new Image();
          image.src = entity.icon;
          image.onload = () => drawTerrarium(ctx, width, height, world, selectedId, iconCache);
          iconCache.set(entity.icon, image);
        }
        if (image.complete) ctx.drawImage(image, x - size, y - size, size * 2, size * 2);
      } else {
        drawEntity(ctx, x, y, size, species.color, entity.kind);
      }

      if (entity.id === selectedId) {
        ctx.strokeStyle = "#fff2a6";
        ctx.lineWidth = 4;
        ctx.strokeRect(x - size - 5, y - size - 5, size * 2 + 10, size * 2 + 10);
      }
    });

  ctx.fillStyle = "rgba(255,255,255,0.16)";
  for (let x = 0; x < width; x += 18) ctx.fillRect(x, 0, 1, height);
  for (let y = 0; y < height; y += 18) ctx.fillRect(0, y, width, 1);
}

function drawSun(ctx: CanvasRenderingContext2D, width: number, height: number, year: number) {
  const x = width * (0.12 + ((year % 20) / 20) * 0.72);
  const y = height * 0.16;
  ctx.fillStyle = "#fff1a8";
  ctx.fillRect(x - 20, y - 20, 40, 40);
  ctx.fillStyle = "rgba(255, 241, 168, 0.28)";
  ctx.fillRect(x - 36, y - 6, 72, 12);
  ctx.fillRect(x - 6, y - 36, 12, 72);
}

function drawTerrain(ctx: CanvasRenderingContext2D, width: number, height: number, template: TerrainTemplate) {
  const waterLine = template === "ocean" ? 0.5 : template === "island" ? 0.74 : 0.88;
  ctx.fillStyle = template === "ocean" ? "#397ca6" : "#5aa1bf";
  ctx.fillRect(0, height * waterLine, width, height * (1 - waterLine));

  ctx.fillStyle = "#855f3d";
  ctx.fillRect(0, height * 0.81, width, height * 0.19);
  ctx.fillStyle = "#4f8f4b";

  if (template === "island") {
    pixelHill(ctx, width * 0.18, height * 0.72, width * 0.64, height * 0.14, "#6fa34d");
  } else if (template === "mountain") {
    pixelMountain(ctx, width * 0.06, height * 0.82, width * 0.32, height * 0.5);
    pixelMountain(ctx, width * 0.34, height * 0.82, width * 0.4, height * 0.62);
    pixelMountain(ctx, width * 0.68, height * 0.82, width * 0.28, height * 0.44);
  } else if (template === "ocean") {
    pixelHill(ctx, width * 0.52, height * 0.58, width * 0.18, height * 0.08, "#71a05a");
    pixelHill(ctx, width * 0.12, height * 0.62, width * 0.16, height * 0.06, "#8ebf65");
  } else {
    pixelHill(ctx, 0, height * 0.7, width, height * 0.16, "#79a957");
  }

  ctx.fillStyle = "rgba(255,255,255,0.35)";
  for (let x = 0; x < width; x += 56) {
    ctx.fillRect(x, height * waterLine + ((x / 56) % 2) * 8, 28, 4);
  }
}

function pixelHill(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, color: string) {
  ctx.fillStyle = color;
  for (let step = 0; step < 12; step += 1) {
    const inset = (step / 12) * w * 0.22;
    ctx.fillRect(x + inset, y + step * (h / 12), w - inset * 2, h / 7);
  }
}

function pixelMountain(ctx: CanvasRenderingContext2D, x: number, baseY: number, w: number, h: number) {
  ctx.fillStyle = "#6f7770";
  for (let step = 0; step < 14; step += 1) {
    const rowW = w * (1 - step / 15);
    ctx.fillRect(x + (w - rowW) / 2, baseY - step * (h / 14), rowW, h / 12);
  }
  ctx.fillStyle = "#e4ece8";
  ctx.fillRect(x + w * 0.42, baseY - h * 0.92, w * 0.16, h * 0.18);
}

function drawWeatherTint(ctx: CanvasRenderingContext2D, width: number, height: number, world: World) {
  if (world.climate.temperature < 0.3) {
    ctx.fillStyle = "rgba(208, 238, 255, 0.22)";
    ctx.fillRect(0, 0, width, height);
  }
  if (world.climate.fertility < 0.25) {
    ctx.fillStyle = "rgba(150, 112, 72, 0.16)";
    ctx.fillRect(0, 0, width, height);
  }
}

function drawEntity(ctx: CanvasRenderingContext2D, x: number, y: number, size: number, color: string, kind: EntityKind) {
  ctx.fillStyle = color;
  if (kind === "plant") {
    ctx.fillRect(x - size * 0.25, y - size, size * 0.5, size);
    ctx.fillRect(x - size * 0.75, y - size * 0.75, size * 1.5, size * 0.35);
    return;
  }
  if (kind === "resource") {
    ctx.fillRect(x - size * 0.8, y - size * 0.35, size * 1.6, size * 0.7);
    ctx.fillStyle = "rgba(255,255,255,0.45)";
    ctx.fillRect(x - size * 0.45, y - size * 0.15, size * 0.9, size * 0.2);
    return;
  }
  ctx.fillRect(x - size * 0.5, y - size * 0.65, size, size * 0.9);
  ctx.fillRect(x - size * 0.35, y - size * 1.1, size * 0.7, size * 0.45);
  ctx.fillStyle = "#1b1b1b";
  ctx.fillRect(x - size * 0.22, y - size * 0.95, size * 0.12, size * 0.1);
  ctx.fillRect(x + size * 0.12, y - size * 0.95, size * 0.12, size * 0.1);
}
