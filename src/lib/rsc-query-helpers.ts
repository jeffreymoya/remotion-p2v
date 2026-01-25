/**
 * RSC + React Query Integration Helpers
 *
 * These utilities help integrate React Server Components (RSC) with React Query
 * by providing type-safe patterns for passing initial data from server to client.
 *
 * @see docs/react-query-migration-checklist.md - RSC Integration section
 */

import { QueryClient } from "@tanstack/react-query";

/**
 * Type for props that include initial data from RSC
 */
export type WithInitialData<T> = {
  initialData: T;
};

/**
 * Prefetch query data on the server and return it for client hydration
 *
 * @example
 * ```tsx
 * // app/(dashboard)/projects/[id]/page.tsx (RSC)
 * export default async function ProjectPage({ params }: Params) {
 *   const { id } = await params;
 *   const project = await prefetchQuery(['project', id], () =>
 *     fetchProject(id)
 *   );
 *
 *   return <ProjectDetail initialData={project} />;
 * }
 *
 * // components/project-detail.tsx (Client)
 * "use client";
 * export function ProjectDetail({ initialData }: WithInitialData<Project>) {
 *   const { data: project } = useQuery({
 *     queryKey: ['project', initialData.id],
 *     queryFn: () => fetchProject(initialData.id),
 *     initialData, // No loading flash on first render
 *   });
 *   // ...
 * }
 * ```
 */
export async function prefetchQuery<T>(
  queryKey: unknown[],
  queryFn: () => Promise<T>
): Promise<T> {
  try {
    return await queryFn();
  } catch (error) {
    // Log error but don't throw - let client component handle it
    console.error(`[RSC] Failed to prefetch query [${queryKey.join(", ")}]:`, error);
    throw error; // Re-throw to let RSC error boundary handle it
  }
}

/**
 * Hydrate the query client on the server with pre-fetched data
 *
 * @example
 * ```tsx
 * // app/(dashboard)/projects/page.tsx (RSC)
 * export default async function ProjectsPage() {
 *   const queryClient = new QueryClient();
 *   await hydrateQuery(queryClient, ['projects'], fetchProjects);
 *
 *   return (
 *     <HydrationBoundary state={dehydrate(queryClient)}>
 *       <ProjectsList />
 *     </HydrationBoundary>
 *   );
 * }
 * ```
 */
export async function hydrateQuery<T>(
  queryClient: QueryClient,
  queryKey: unknown[],
  queryFn: () => Promise<T>
): Promise<void> {
  try {
    const data = await queryFn();
    queryClient.setQueryData(queryKey, data);
  } catch (error) {
    console.error(`[RSC] Failed to hydrate query [${queryKey.join(", ")}]:`, error);
    // Don't set error state - let client component fetch fresh data
  }
}

/**
 * Create props for client component with initial data
 *
 * @example
 * ```tsx
 * // app/(dashboard)/projects/[id]/page.tsx (RSC)
 * export default async function MediaPage({ params }: Params) {
 *   const { id } = await params;
 *   const assets = await fetchAssets(id);
 *
 *   return (
 *     <MediaManager
 *       projectId={id}
 *       {...withInitialData(assets)}
 *     />
 *   );
 * }
 *
 * // components/media-manager.tsx (Client)
 * "use client";
 * type Props = { projectId: string } & WithInitialData<Asset[]>;
 *
 * export function MediaManager({ projectId, initialData }: Props) {
 *   const { data: assets } = useQuery({
 *     queryKey: ['assets', projectId],
 *     queryFn: () => fetchAssets(projectId),
 *     initialData,
 *   });
 *   // ...
 * }
 * ```
 */
export function withInitialData<T>(data: T): WithInitialData<T> {
  return { initialData: data };
}

/**
 * Type guard to check if component props include initial data
 */
export function hasInitialData<T>(
  props: unknown
): props is WithInitialData<T> {
  return (
    typeof props === "object" &&
    props !== null &&
    "initialData" in props
  );
}
