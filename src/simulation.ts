export type TerrainTemplate = "island" | "ocean" | "land" | "mountain";
export type EntityKind = "human" | "animal" | "plant" | "resource" | "oddity";
export type Diet = "sun" | "plant" | "meat" | "mixed" | "none";
export type EventType =
  | "birth"
  | "move"
  | "eat"
  | "injury"
  | "breed"
  | "mutation"
  | "death"
  | "weather"
  | "milestone"
  | "arrival";

export type TraitSet = {
  speed: number;
  lifespan: number;
  fertility: number;
  cold: number;
  aggression: number;
  size: number;
};

export type LifeEvent = {
  year: number;
  type: EventType;
  text: string;
};

export type Species = {
  id: string;
  name: string;
  kind: EntityKind;
  diet: Diet;
  color: string;
  traits: TraitSet;
  generation: number;
  origin?: string;
  alive: number;
};

export type Entity = {
  id: string;
  name: string;
  kind: EntityKind;
  speciesId: string;
  x: number;
  y: number;
  age: number;
  energy: number;
  lifespan: number;
  alive: boolean;
  parentIds: string[];
  biography: LifeEvent[];
  icon?: string;
};

export type WorldEvent = {
  id: string;
  year: number;
  type: EventType;
  text: string;
  entityId?: string;
};

export type MilestoneReport = {
  year: 10 | 50 | 100;
  summary: string;
  extinct: string[];
  newSpecies: string[];
  biography?: LifeEvent[];
  achievements: string[];
};

export type World = {
  template: TerrainTemplate;
  year: number;
  entities: Entity[];
  species: Species[];
  events: WorldEvent[];
  reports: MilestoneReport[];
  achievements: string[];
  climate: {
    temperature: number;
    water: number;
    fertility: number;
  };
};

type AddEntityInput = {
  name: string;
  kind: EntityKind;
  speciesName?: string;
  icon?: string;
};

const WIDTH = 100;
const HEIGHT = 44;
const INITIAL_SUBJECTS = 20;
const MAX_LIVING = 50;
const MAX_TOTAL_ENTITIES = 120;
const MAX_SPECIES = 26;
const MILESTONES = [10, 50, 100] as const;
const PALETTE = ["#e75f3f", "#f6b54b", "#69b578", "#5fa8d3", "#d98abf", "#9a7bd1", "#e8df7a"];
const NAMES = ["苔光", "岚牙", "灰步", "露尾", "木心", "砂眼", "澈鳞", "赤枝", "慢壳", "星鼻"];

let nextId = 1;

const rnd = (min: number, max: number) => min + Math.random() * (max - min);
const pick = <T,>(list: T[]) => list[Math.floor(Math.random() * list.length)];
const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));
const makeId = (prefix: string) => `${prefix}-${nextId++}`;

const templateClimate: Record<TerrainTemplate, World["climate"]> = {
  island: { temperature: 0.62, water: 0.7, fertility: 0.68 },
  ocean: { temperature: 0.58, water: 0.95, fertility: 0.46 },
  land: { temperature: 0.66, water: 0.46, fertility: 0.74 },
  mountain: { temperature: 0.38, water: 0.5, fertility: 0.42 },
};

const starterSpecies: Omit<Species, "id" | "alive">[] = [
  {
    name: "河岸人",
    kind: "human",
    diet: "mixed",
    color: "#ffd08a",
    generation: 1,
    traits: { speed: 0.62, lifespan: 52, fertility: 0.32, cold: 0.52, aggression: 0.38, size: 0.7 },
  },
  {
    name: "短尾鹿",
    kind: "animal",
    diet: "plant",
    color: "#d88f45",
    generation: 1,
    traits: { speed: 0.78, lifespan: 22, fertility: 0.62, cold: 0.45, aggression: 0.18, size: 0.55 },
  },
  {
    name: "蓝背狐",
    kind: "animal",
    diet: "meat",
    color: "#5fa8d3",
    generation: 1,
    traits: { speed: 0.82, lifespan: 18, fertility: 0.42, cold: 0.66, aggression: 0.72, size: 0.45 },
  },
  {
    name: "银根草",
    kind: "plant",
    diet: "sun",
    color: "#7ac76f",
    generation: 1,
    traits: { speed: 0.08, lifespan: 14, fertility: 0.8, cold: 0.36, aggression: 0.02, size: 0.25 },
  },
  {
    name: "甜浆果",
    kind: "plant",
    diet: "sun",
    color: "#d94f70",
    generation: 1,
    traits: { speed: 0.04, lifespan: 9, fertility: 0.88, cold: 0.28, aggression: 0.01, size: 0.18 },
  },
  {
    name: "小麦田",
    kind: "plant",
    diet: "sun",
    color: "#d9b85d",
    generation: 1,
    traits: { speed: 0.02, lifespan: 12, fertility: 0.62, cold: 0.42, aggression: 0.01, size: 0.22 },
  },
  {
    name: "玉米苗",
    kind: "plant",
    diet: "sun",
    color: "#a8c957",
    generation: 1,
    traits: { speed: 0.02, lifespan: 16, fertility: 0.58, cold: 0.5, aggression: 0.01, size: 0.24 },
  },
  {
    name: "薯片袋",
    kind: "resource",
    diet: "none",
    color: "#f6b54b",
    generation: 1,
    traits: { speed: 0, lifespan: 28, fertility: 0, cold: 0.38, aggression: 0, size: 0.32 },
  },
  {
    name: "淡水泉",
    kind: "resource",
    diet: "none",
    color: "#8bd8ff",
    generation: 1,
    traits: { speed: 0, lifespan: 120, fertility: 0, cold: 0.9, aggression: 0, size: 0.4 },
  },
  {
    name: "气泡饮料",
    kind: "resource",
    diet: "none",
    color: "#d98abf",
    generation: 1,
    traits: { speed: 0, lifespan: 24, fertility: 0, cold: 0.35, aggression: 0, size: 0.3 },
  },
];

export const templateLabels: Record<TerrainTemplate, string> = {
  island: "小岛",
  ocean: "海洋",
  land: "陆地",
  mountain: "群山",
};

export const kindLabels: Record<EntityKind, string> = {
  human: "人",
  animal: "动物",
  plant: "植物",
  resource: "资源",
  oddity: "异常物",
};

export function createWorld(template: TerrainTemplate): World {
  nextId = 1;
  const species = starterSpecies.map((item) => ({ ...item, id: makeId("species"), alive: 0 }));
  const world: World = {
    template,
    year: 0,
    entities: [],
    species,
    events: [],
    reports: [],
    achievements: [],
    climate: { ...templateClimate[template] },
  };

  const plan: Array<[number, Species]> = [
    [2, species[0]],
    [3, species[1]],
    [2, species[2]],
    [2, species[3]],
    [2, species[4]],
    [3, species[5]],
    [2, species[6]],
    [2, species[7]],
    [1, species[8]],
    [1, species[9]],
  ];

  plan.forEach(([count, item]) => {
    for (let index = 0; index < count; index += 1) {
      world.entities.push(createEntity(world, item, []));
    }
  });

  recountSpecies(world);
  addWorldEvent(world, "arrival", `${templateLabels[template]}生态盘苏醒，${INITIAL_SUBJECTS} 个主体开始互动。`);
  return world;
}

export function addCustomEntity(world: World, input: AddEntityInput): World {
  const copy = cloneWorld(world);
  const baseTraits: TraitSet =
    input.kind === "plant"
      ? { speed: 0.05, lifespan: 18, fertility: 0.72, cold: 0.42, aggression: 0.02, size: 0.28 }
      : input.kind === "resource"
        ? { speed: 0, lifespan: 80, fertility: 0, cold: 0.5, aggression: 0, size: 0.35 }
        : input.kind === "oddity"
          ? { speed: 0.38, lifespan: 45, fertility: 0.18, cold: 0.65, aggression: 0.3, size: 0.5 }
          : { speed: 0.58, lifespan: 32, fertility: 0.36, cold: 0.48, aggression: 0.35, size: 0.5 };

  const species: Species = {
    id: makeId("species"),
    name: input.speciesName || input.name,
    kind: input.kind,
    diet: input.kind === "plant" ? "sun" : input.kind === "resource" ? "none" : "mixed",
    color: pick(PALETTE),
    traits: baseTraits,
    generation: 1,
    origin: "用户投放",
    alive: 0,
  };

  const entity = createEntity(copy, species, []);
  entity.name = input.name;
  entity.icon = input.icon;
  entity.biography.push({ year: copy.year, type: "arrival", text: `${entity.name} 被玩家从现实投放进生态箱。` });
  copy.species.push(species);
  copy.entities.push(entity);
  addWorldEvent(copy, "arrival", `${entity.name} 作为 ${kindLabels[input.kind]} 落入世界，生态关系出现新变量。`, entity.id);
  recountSpecies(copy);
  return copy;
}

export function advanceWorld(world: World, years = 1): World {
  const copy = cloneWorld(world);
  for (let step = 0; step < years; step += 1) {
    copy.year += 1;
    driftClimate(copy);
    maybeWorldEvent(copy);
    copy.entities.filter((entity) => entity.alive).forEach((entity) => tickEntity(copy, entity));
    maybeRegrow(copy);
    recountSpecies(copy);
    enforceCarryingCapacity(copy);
    recountSpecies(copy);
    maybeReport(copy);
  }
  return copy;
}

export function jumpToYear(world: World, targetYear: 10 | 50 | 100): World {
  return advanceWorld(world, Math.max(0, targetYear - world.year));
}

export function livingEntities(world: World) {
  return world.entities.filter((entity) => entity.alive);
}

export function deadEntities(world: World) {
  return world.entities.filter((entity) => !entity.alive);
}

export function getSpecies(world: World, speciesId: string) {
  return world.species.find((species) => species.id === speciesId);
}

function createEntity(world: World, species: Species, parentIds: string[]): Entity {
  const entity: Entity = {
    id: makeId("entity"),
    name: `${pick(NAMES)}-${Math.floor(rnd(10, 99))}`,
    kind: species.kind,
    speciesId: species.id,
    x: spawnX(world.template),
    y: spawnY(world.template, species.kind),
    age: Math.floor(rnd(0, species.traits.lifespan * 0.3)),
    energy: rnd(45, 90),
    lifespan: Math.max(4, species.traits.lifespan + rnd(-5, 8)),
    alive: true,
    parentIds,
    biography: [],
  };
  entity.biography.push({
    year: world.year,
    type: parentIds.length ? "birth" : "arrival",
    text: parentIds.length ? `${entity.name} 在第 ${world.year} 年出生。` : `${entity.name} 在生态箱中醒来。`,
  });
  return entity;
}

function tickEntity(world: World, entity: Entity) {
  const species = getSpecies(world, entity.speciesId);
  if (!species) return;

  entity.age += 1;
  entity.energy -= species.kind === "plant" ? rnd(1, 3) : rnd(4, 9);
  moveEntity(world, entity, species);
  feed(world, entity, species);

  const climateStress = Math.abs(world.climate.temperature - species.traits.cold) * 7;
  entity.energy -= climateStress;

  const livingCount = livingEntities(world).length;
  const densityPressure = clamp(1 - livingCount / MAX_LIVING, 0, 1);
  if (entity.energy > 76 && livingCount < MAX_LIVING && Math.random() < species.traits.fertility * 0.14 * densityPressure) {
    breed(world, entity, species);
  }

  if (entity.energy <= 0 || entity.age >= entity.lifespan) {
    kill(world, entity, entity.energy <= 0 ? "饥饿与环境压力耗尽了能量" : "寿命走到终点");
  }
}

function moveEntity(world: World, entity: Entity, species: Species) {
  if (species.kind === "plant" || species.kind === "resource") return;
  const previousX = entity.x;
  entity.x = clamp(entity.x + rnd(-2, 2) * species.traits.speed, 2, WIDTH - 2);
  entity.y = clamp(entity.y + rnd(-1, 1) * species.traits.speed, 9, HEIGHT - 4);
  if (Math.abs(entity.x - previousX) > 1.2 && Math.random() < 0.06) {
    entity.biography.push({ year: world.year, type: "move", text: `${entity.name} 迁徙到新的地带寻找资源。` });
  }
}

function feed(world: World, entity: Entity, species: Species) {
  if (species.diet === "none") return;
  if (species.diet === "sun") {
    entity.energy += 12 * world.climate.fertility;
    return;
  }

  const target = nearestFood(world, entity, species.diet);
  if (!target) return;
  const distance = Math.hypot(target.x - entity.x, target.y - entity.y);
  if (distance < 9) {
    entity.energy = clamp(entity.energy + (target.kind === "resource" ? 28 : 36), 0, 120);
    target.energy -= target.kind === "plant" ? 45 : 90;
    entity.biography.push({ year: world.year, type: "eat", text: `${entity.name} 找到食物，能量恢复。` });
    if (target.energy <= 0) kill(world, target, `${entity.name} 将其纳入食物链`);
  }
}

function nearestFood(world: World, entity: Entity, diet: Diet) {
  let nearest: Entity | undefined;
  let nearestDistance = Number.POSITIVE_INFINITY;
  for (const candidate of world.entities) {
    if (!candidate.alive || candidate.id === entity.id) continue;
    const edible =
      candidate.kind === "resource" ||
      (diet === "plant" && candidate.kind === "plant") ||
      (diet === "meat" && (candidate.kind === "animal" || candidate.kind === "human")) ||
      (diet === "mixed" && candidate.kind === "plant");
    if (!edible) continue;
    const distance = Math.hypot(candidate.x - entity.x, candidate.y - entity.y);
    if (distance < nearestDistance) {
      nearest = candidate;
      nearestDistance = distance;
    }
  }

  return nearest;
}

function breed(world: World, parent: Entity, species: Species) {
  parent.energy -= 26;
  let childSpecies = species;
  let mutated = false;

  if (Math.random() < 0.18) {
    childSpecies = mutateSpecies(world, species);
    mutated = true;
  }

  const child = createEntity(world, childSpecies, [parent.id]);
  child.x = clamp(parent.x + rnd(-4, 4), 2, WIDTH - 2);
  child.y = clamp(parent.y + rnd(-3, 3), 8, HEIGHT - 4);
  world.entities.push(child);
  parent.biography.push({
    year: world.year,
    type: mutated ? "mutation" : "breed",
    text: mutated ? `${parent.name} 的后代出现稳定突变：${childSpecies.name}。` : `${parent.name} 留下了一个后代。`,
  });
  addWorldEvent(world, mutated ? "mutation" : "birth", mutated ? `新变种 ${childSpecies.name} 诞生。` : `${species.name} 族群诞生新个体。`, child.id);
}

function mutateSpecies(world: World, species: Species) {
  if (world.species.length >= MAX_SPECIES) return species;
  const traitName = pick(Object.keys(species.traits) as Array<keyof TraitSet>);
  const traits = { ...species.traits };
  traits[traitName] = clamp(traits[traitName] + rnd(-0.16, 0.22), traitName === "lifespan" ? 6 : 0, traitName === "lifespan" ? 90 : 1);
  const childSpecies: Species = {
    ...species,
    id: makeId("species"),
    name: `${species.name}${pick(["长风型", "寒脉型", "赤眼型", "浅水型", "细足型"])}`,
    traits,
    generation: species.generation + 1,
    origin: `${species.name} 的 ${traitName} 突变`,
    alive: 0,
  };
  world.species.push(childSpecies);
  return childSpecies;
}

function kill(world: World, entity: Entity, cause: string) {
  if (!entity.alive) return;
  entity.alive = false;
  entity.energy = 0;
  entity.biography.push({ year: world.year, type: "death", text: `${entity.name} 死亡：${cause}。` });
  addWorldEvent(world, "death", `${entity.name} 死亡，原因是${cause}。`, entity.id);
}

function driftClimate(world: World) {
  world.climate.temperature = clamp(world.climate.temperature + rnd(-0.025, 0.025), 0.1, 0.95);
  world.climate.water = clamp(world.climate.water + rnd(-0.03, 0.03), 0.05, 1);
  world.climate.fertility = clamp(world.climate.fertility + rnd(-0.025, 0.025), 0.05, 1);
}

function maybeWorldEvent(world: World) {
  if (Math.random() > 0.18) return;
  const event = pick(["寒潮", "洪水", "干旱", "火山灰", "疾病", "浆果丰年"]);
  if (event === "寒潮") world.climate.temperature = clamp(world.climate.temperature - 0.22, 0.05, 1);
  if (event === "洪水") world.climate.water = clamp(world.climate.water + 0.25, 0.05, 1);
  if (event === "干旱") world.climate.water = clamp(world.climate.water - 0.24, 0.05, 1);
  if (event === "火山灰") world.climate.fertility = clamp(world.climate.fertility - 0.18, 0.05, 1);
  if (event === "浆果丰年") world.climate.fertility = clamp(world.climate.fertility + 0.22, 0.05, 1);

  const affected = livingEntities(world).filter(() => Math.random() < 0.22);
  if (event === "疾病") {
    affected.forEach((entity) => {
      entity.energy -= rnd(14, 32);
      entity.biography.push({ year: world.year, type: "injury", text: `${entity.name} 熬过一场疾病。` });
    });
  }
  addWorldEvent(world, "weather", `${event} 改变了生态箱的温度、水分或肥力。`);
}

function maybeRegrow(world: World) {
  const livingCount = livingEntities(world).length;
  if (livingCount >= MAX_LIVING) return;
  const pressure = clamp(1 - livingCount / MAX_LIVING, 0.12, 1);
  const plantSpecies = world.species.filter((species) => species.kind === "plant" && species.alive > 0);
  const resourceSpecies = world.species.filter((species) => species.kind === "resource");
  const plantCount = world.entities.filter((entity) => entity.alive && entity.kind === "plant").length;
  const resourceCount = world.entities.filter((entity) => entity.alive && entity.kind === "resource").length;
  if (plantSpecies.length && plantCount < 24 && Math.random() < world.climate.fertility * 0.18 * pressure) {
    world.entities.push(createEntity(world, pick(plantSpecies), []));
  }
  if (resourceSpecies.length && resourceCount < 8 && livingEntities(world).length < MAX_LIVING && Math.random() < world.climate.water * 0.06 * pressure) {
    world.entities.push(createEntity(world, pick(resourceSpecies), []));
  }
}

function enforceCarryingCapacity(world: World) {
  const living = livingEntities(world);
  if (living.length > MAX_LIVING) {
    const excess = [...living]
      .sort((a, b) => a.energy - b.energy || b.age - a.age)
      .slice(0, living.length - MAX_LIVING);
    excess.forEach((entity) => kill(world, entity, "生态箱承载力不足"));
    addWorldEvent(world, "weather", `生态承载力触顶，${excess.length} 个低能量个体退出竞争。`);
  }

  const overflow = world.entities.length - MAX_TOTAL_ENTITIES;
  if (overflow > 0) {
    const removableDeadIds = new Set(
      world.entities
        .filter((entity) => !entity.alive)
        .sort((a, b) => b.biography.length - a.biography.length || b.age - a.age)
        .slice(38 + overflow)
        .map((entity) => entity.id),
    );
    world.entities = world.entities.filter((entity) => entity.alive || !removableDeadIds.has(entity.id));
  }
}

function maybeReport(world: World) {
  if (!MILESTONES.includes(world.year as 10 | 50 | 100)) return;
  if (world.reports.some((report) => report.year === world.year)) return;
  const living = livingEntities(world);
  const extinct = world.species.filter((species) => species.alive === 0 && species.generation > 1).map((species) => species.name);
  const newSpecies = world.species.filter((species) => species.generation > 1).map((species) => species.name);
  const oldest = [...world.entities].sort((a, b) => b.age - a.age)[0];
  const achievements = achievementsFor(world);
  world.achievements = Array.from(new Set([...world.achievements, ...achievements]));
  world.reports.push({
    year: world.year as 10 | 50 | 100,
    summary: `${world.year} 年后，${living.length} 个个体仍在活动，生态箱记录了 ${world.events.length} 个关键事件。`,
    extinct,
    newSpecies,
    biography: oldest?.biography.slice(-6),
    achievements,
  });
  addWorldEvent(world, "milestone", `${world.year} 年节点到达，生态报告已生成。`);
}

function achievementsFor(world: World) {
  const achievements: string[] = [];
  if (world.species.some((species) => species.generation > 1)) achievements.push("新物种诞生");
  if (world.species.some((species) => species.alive === 0 && species.generation > 1)) achievements.push("变种灭绝档案");
  if (world.entities.some((entity) => !entity.alive && entity.biography.length > 3)) achievements.push("完整生命传记");
  if (world.year >= 100) achievements.push("百年生态观察员");
  if (livingEntities(world).length >= 30) achievements.push("繁盛生态箱");
  if (livingEntities(world).length <= 8) achievements.push("脆弱平衡");
  return achievements;
}

function recountSpecies(world: World) {
  world.species.forEach((species) => {
    species.alive = world.entities.filter((entity) => entity.alive && entity.speciesId === species.id).length;
  });
}

function addWorldEvent(world: World, type: EventType, text: string, entityId?: string) {
  world.events.unshift({ id: makeId("event"), year: world.year, type, text, entityId });
  world.events = world.events.slice(0, 120);
}

function spawnX(template: TerrainTemplate) {
  if (template === "ocean") return rnd(15, 88);
  if (template === "mountain") return rnd(8, 92);
  if (template === "island") return rnd(26, 74);
  return rnd(6, 94);
}

function spawnY(template: TerrainTemplate, kind: EntityKind) {
  if (kind === "plant") return rnd(23, 34);
  if (kind === "resource") return template === "ocean" ? rnd(27, 38) : rnd(30, 39);
  if (template === "ocean") return rnd(24, 36);
  if (template === "mountain") return rnd(13, 33);
  return rnd(19, 34);
}

function cloneWorld(world: World): World {
  return {
    ...world,
    climate: { ...world.climate },
    achievements: [...world.achievements],
    reports: world.reports.map((report) => ({
      ...report,
      extinct: [...report.extinct],
      newSpecies: [...report.newSpecies],
      achievements: [...report.achievements],
      biography: report.biography?.map((item) => ({ ...item })),
    })),
    events: world.events.map((event) => ({ ...event })),
    species: world.species.map((species) => ({ ...species, traits: { ...species.traits } })),
    entities: world.entities.map((entity) => ({
      ...entity,
      parentIds: [...entity.parentIds],
      biography: entity.biography.map((item) => ({ ...item })),
    })),
  };
}
