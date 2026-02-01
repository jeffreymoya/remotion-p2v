import { PrismaClient } from './src/generated/storyflow/client';
import { projectExtension } from './src/lib/storyflow/prisma-extensions';
(async () => {
  const client = new PrismaClient().$extends(projectExtension);
  console.log('has appSettings', 'appSettings' in client);
  console.log('has project', 'project' in client);
  console.log('has model key', 'model' in client);
  await client.$disconnect();
})();
