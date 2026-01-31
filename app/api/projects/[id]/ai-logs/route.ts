import { NextResponse } from "next/server";
import { z } from "zod";

import { parseQuery, ValidationError, withErrorHandler } from "@/app/api/lib";
import { AiCallStatus, Prisma } from "@/src/generated/storyflow";
import { storyflowPrisma } from "@/src/lib/storyflow/prisma";

const querySchema = z.object({
  page: z.string().regex(/^\d+$/).optional(),
  limit: z.string().regex(/^\d+$/).optional(),
  status: z.nativeEnum(AiCallStatus).optional(),
  provider: z.string().trim().optional(),
  operation: z.string().trim().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

function parseDate(value?: string): Date | undefined {
  if (!value) return undefined;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new ValidationError(`Invalid date: ${value}`);
  }
  return date;
}

export const GET = withErrorHandler(async (request: Request, { params }: { params: { id: string } }) => {
  const resolvedParams = await params;
  const parsedQuery = parseQuery(request, querySchema);

  const page = parsedQuery.page ? Number.parseInt(parsedQuery.page, 10) : 0;
  const limitRaw = parsedQuery.limit ? Number.parseInt(parsedQuery.limit, 10) : 50;
  const limit = Math.min(Math.max(limitRaw, 1), 100);
  if (page < 0) {
    throw new ValidationError("page must be >= 0");
  }

  const where: Prisma.AiCallLogWhereInput = {
    projectId: resolvedParams.id,
  };

  if (parsedQuery.status) where.status = parsedQuery.status;
  if (parsedQuery.provider) where.provider = parsedQuery.provider;
  if (parsedQuery.operation) where.operation = parsedQuery.operation;

  const startDate = parseDate(parsedQuery.startDate);
  const endDate = parseDate(parsedQuery.endDate);
  if (startDate || endDate) {
    where.startedAt = {};
    if (startDate) where.startedAt.gte = startDate;
    if (endDate) where.startedAt.lte = endDate;
  }

  const [logs, totalCount, statusStats, aggregates] = await Promise.all([
    storyflowPrisma.aiCallLog.findMany({
      where,
      orderBy: { startedAt: "desc" },
      skip: page * limit,
      take: limit,
    }),
    storyflowPrisma.aiCallLog.count({ where }),
    storyflowPrisma.aiCallLog.groupBy({
      by: ["status"],
      where,
      _count: true,
      _avg: { durationMs: true },
    }),
    storyflowPrisma.aiCallLog.aggregate({
      where,
      _sum: { promptTokens: true, responseTokens: true },
      _avg: { durationMs: true },
    }),
  ]);

  const completedCount = statusStats.find((s) => s.status === AiCallStatus.COMPLETED)?._count ?? 0;
  const failedCount = statusStats.find((s) => s.status === AiCallStatus.FAILED)?._count ?? 0;
  const pendingCount = statusStats.find((s) => s.status === AiCallStatus.PENDING)?._count ?? 0;
  const totalTokens = (aggregates._sum.promptTokens ?? 0) + (aggregates._sum.responseTokens ?? 0);
  const avgLatency = aggregates._avg.durationMs ?? 0;
  const successDenominator = completedCount + failedCount;
  const successRate = successDenominator === 0 ? 0 : (completedCount / successDenominator) * 100;

  return NextResponse.json({
    logs,
    stats: {
      byStatus: statusStats,
      summary: {
        totalCalls: totalCount,
        successRate,
        avgLatency,
        totalTokens,
        pendingCalls: pendingCount,
      },
    },
    pagination: {
      page,
      limit,
      totalCount,
      totalPages: Math.ceil(totalCount / limit),
      hasMore: (page + 1) * limit < totalCount,
    },
  });
}, "projects/[id]/ai-logs");

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
