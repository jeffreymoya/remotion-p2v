import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import prismaPkg from "../../src/generated/storyflow/index.js";

const { PrismaClient, ProjectStatus, RenderQuality, RenderStatus, AssetType } = prismaPkg;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "../..");
const dbFile = path.resolve(repoRoot, "e2e/fixtures/test.db");
const databaseUrl = "file:" + path.relative(repoRoot, dbFile);

function ensureArtifactFiles() {
  const artifactRoot = path.join(repoRoot, "e2e/fixtures/artifacts");
  const audioDir = path.join(artifactRoot, "audio");
  const imageDir = path.join(artifactRoot, "images");
  const renderDir = path.join(artifactRoot, "renders");

  fs.mkdirSync(audioDir, { recursive: true });
  fs.mkdirSync(imageDir, { recursive: true });
  fs.mkdirSync(renderDir, { recursive: true });

  const tinyBuffer = Buffer.from("seed");
  if (!fs.existsSync(path.join(audioDir, "sample.mp3"))) {
    fs.writeFileSync(path.join(audioDir, "sample.mp3"), tinyBuffer);
  }
  if (!fs.existsSync(path.join(imageDir, "cover.jpg"))) {
    fs.writeFileSync(path.join(imageDir, "cover.jpg"), tinyBuffer);
  }
  if (!fs.existsSync(path.join(renderDir, "output.mp4"))) {
    fs.writeFileSync(path.join(renderDir, "output.mp4"), tinyBuffer);
  }
}

function pushSchema() {
  execFileSync(
    "npx",
    ["prisma", "db", "push", "--schema", "prisma/storyflow.schema.prisma"],
    {
      cwd: repoRoot,
      stdio: "inherit",
      env: {
        ...process.env,
        STORYFLOW_DATABASE_URL: databaseUrl,
        DATABASE_URL: databaseUrl,
        SKIP_ENV_VALIDATION: "true",
        GOOGLE_TTS_API_KEY: process.env.GOOGLE_TTS_API_KEY ?? "test-key",
        NODE_ENV: process.env.NODE_ENV ?? "test",
      },
    }
  );
}

async function seedProjects(prisma) {
  const scriptSegments = [
    {
      id: "seg-1",
      text: "Hello world",
      speaker: "narrator",
      durationMs: 1200,
    },
  ];

  await prisma.project.create({
    data: {
      id: "project-draft",
      name: "Draft project",
      status: ProjectStatus.DRAFT,
    },
  });

  await prisma.project.create({
    data: {
      id: "project-scripted",
      name: "Script ready project",
      status: ProjectStatus.SCRIPT_READY,
      script: {
        create: {
          title: "Seed Script",
          segments: scriptSegments,
          timestamps: [],
        },
      },
    },
  });

  const assetsProject = await prisma.project.create({
    data: {
      id: "project-assets",
      name: "Assets ready project",
      status: ProjectStatus.ASSETS_READY,
      script: {
        create: {
          title: "Assets Script",
          segments: scriptSegments,
          timestamps: [],
        },
      },
    },
  });

  await prisma.asset.create({
    data: {
      projectId: assetsProject.id,
      type: AssetType.AUDIO,
      filename: "sample.mp3",
      path: "e2e/fixtures/artifacts/audio/sample.mp3",
      metadata: { label: "narration" },
    },
  });

  await prisma.asset.create({
    data: {
      projectId: assetsProject.id,
      type: AssetType.IMAGE,
      filename: "cover.jpg",
      path: "e2e/fixtures/artifacts/images/cover.jpg",
      metadata: { width: 100, height: 100 },
    },
  });

  const viewportProject = await prisma.project.create({
    data: {
      id: "project-viewport",
      name: "Viewport ready project",
      status: ProjectStatus.VIEWPORT_READY,
    },
  });

  const viewportImage = await prisma.asset.create({
    data: {
      projectId: viewportProject.id,
      type: AssetType.IMAGE,
      filename: "viewport.jpg",
      path: "e2e/fixtures/artifacts/images/cover.jpg",
      metadata: { width: 100, height: 100 },
    },
  });

  await prisma.viewport.create({
    data: {
      projectId: viewportProject.id,
      imageAssetId: viewportImage.id,
      keyframes: [{ time: 0, elements: [] }],
      regions: [{ id: "region-1", box: [0, 0, 100, 100] }],
    },
  });

  const boardsProject = await prisma.project.create({
    data: {
      id: "project-boards",
      name: "Boards ready project",
      status: ProjectStatus.BOARDS_READY,
    },
  });

  const boardImage = await prisma.asset.create({
    data: {
      projectId: boardsProject.id,
      type: AssetType.IMAGE,
      filename: "board-1.png",
      path: "e2e/fixtures/artifacts/images/cover.jpg",
      metadata: { width: 100, height: 100 },
    },
  });

  await prisma.board.create({
    data: {
      projectId: boardsProject.id,
      index: 0,
      assetId: boardImage.id,
      layout: { rows: 2, cols: 2 },
      regions: [],
      triggers: [],
      plan: {
        boardId: "board-1",
        segmentIndices: [0],
        totalDurationMs: 1200,
        topicSummary: "Seeded board for storyboard operations",
      },
      prompts: [{ boardId: "board-1", text: "Generate image" }],
    },
  });

  await prisma.project.create({
    data: {
      id: "project-renderable",
      name: "Render ready project",
      status: ProjectStatus.RENDER_READY,
    },
  });

  const renderingProject = await prisma.project.create({
    data: {
      id: "project-rendering",
      name: "Rendering project",
      status: ProjectStatus.RENDERING,
    },
  });

  await prisma.render.create({
    data: {
      projectId: renderingProject.id,
      quality: RenderQuality.DRAFT,
      status: RenderStatus.PROCESSING,
      progress: 35,
    },
  });

  const completedProject = await prisma.project.create({
    data: {
      id: "project-completed",
      name: "Completed project",
      status: ProjectStatus.COMPLETED,
    },
  });

  await prisma.render.create({
    data: {
      projectId: completedProject.id,
      quality: RenderQuality.MEDIUM,
      status: RenderStatus.COMPLETED,
      progress: 100,
      outputPath: "e2e/fixtures/artifacts/renders/output.mp4",
      completedAt: new Date(),
    },
  });

  await prisma.project.create({
    data: {
      id: "project-error",
      name: "Errored project",
      status: ProjectStatus.ERROR,
    },
  });
}

export async function seedDatabase() {
  ensureArtifactFiles();
  fs.rmSync(dbFile, { force: true });
  pushSchema();

  const prisma = new PrismaClient({
    datasources: {
      storyflowDb: {
        url: databaseUrl,
      },
    },
  });

  try {
    await prisma.$transaction([
      prisma.board.deleteMany(),
      prisma.viewport.deleteMany(),
      prisma.asset.deleteMany(),
      prisma.render.deleteMany(),
      prisma.script.deleteMany(),
      prisma.project.deleteMany(),
    ]);

    await seedProjects(prisma);
  } finally {
    await prisma.$disconnect();
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  seedDatabase().catch((err) => {
    console.error("Failed to seed E2E database", err);
    process.exit(1);
  });
}
