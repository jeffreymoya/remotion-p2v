/**
 * Fastify Web Server for Topic Curation UI
 */

import Fastify from 'fastify';
import fastifyStatic from '@fastify/static';
import * as path from 'path';
import { logger } from '../../utils/logger';
import { DiscoveredTopic } from '../../commands/discover';

export interface CurationServerOptions {
  port?: number;
  host?: string;
  topics: DiscoveredTopic[];
  onSelect: (topicId: string, userNotes?: string) => void;
  onClose: () => void;
}

export class CurationServer {
  private server: ReturnType<typeof Fastify>;
  private options: CurationServerOptions;
  private selectedTopicId: string | null = null;

  constructor(options: CurationServerOptions) {
    this.options = {
      port: 3000,
      host: '127.0.0.1',
      ...options,
    };

    this.server = Fastify({
      logger: false, // Disable Fastify's logger, use our own
    });

    this.setupRoutes();
  }

  private setupRoutes(): void {
    // Serve static files (HTML, CSS, JS) from public directory
    const publicDir = path.join(__dirname, '../../../public/curation-ui');
    this.server.register(fastifyStatic, {
      root: publicDir,
      prefix: '/',
    });

    // API: Get discovered topics
    this.server.get('/api/topics', async (request, reply) => {
      return {
        topics: this.options.topics,
      };
    });

    // API: Select a topic
    this.server.post<{
      Body: { topicId: string; userNotes?: string };
    }>('/api/select', async (request, reply) => {
      const { topicId, userNotes } = request.body;

      const topic = this.options.topics.find(t => t.id === topicId);
      if (!topic) {
        return reply.status(404).send({ error: 'Topic not found' });
      }

      this.selectedTopicId = topicId;
      this.options.onSelect(topicId, userNotes);

      return {
        success: true,
        message: 'Topic selected successfully',
      };
    });

    // API: Health check
    this.server.get('/api/health', async (request, reply) => {
      return { status: 'ok' };
    });
  }

  async start(): Promise<void> {
    try {
      await this.server.listen({
        port: this.options.port!,
        host: this.options.host!,
      });

      logger.info(`Curation server started at http://${this.options.host}:${this.options.port}`);
      console.log(`\n🌐 Curation UI available at: http://${this.options.host}:${this.options.port}`);
      console.log('📋 Select a topic from the web interface to continue...\n');
    } catch (error: any) {
      logger.error('Failed to start curation server:', error.message);
      throw new Error(`Failed to start server: ${error.message}`);
    }
  }

  async stop(): Promise<void> {
    try {
      await this.server.close();
      this.options.onClose();
      logger.info('Curation server stopped');
    } catch (error: any) {
      logger.error('Error stopping server:', error.message);
    }
  }

  getSelectedTopicId(): string | null {
    return this.selectedTopicId;
  }
}
