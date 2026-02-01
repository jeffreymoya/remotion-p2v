import { storyflowPrisma } from './src/lib/storyflow/prisma';

async function main() {
  console.log('keys', Object.keys(storyflowPrisma));
  console.log('has appSettings', 'appSettings' in (storyflowPrisma as any));
  console.log('appSettings type', typeof (storyflowPrisma as any).appSettings);
  console.log('project delegate type', typeof (storyflowPrisma as any).project);
  await storyflowPrisma.$disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
