import { Project } from "@/src/lib/storyflow/types";
import { ProjectCard } from "./project-card";

export function ProjectGrid({ projects }: { projects: Project[] }) {
  return (
    <div data-testid="projects-list" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {projects.map((project) => (
        <ProjectCard key={project.id} project={project} />
      ))}
    </div>
  );
}
