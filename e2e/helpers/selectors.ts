export const selectors = {
  sidebarProjects: '[data-testid="projects-list"]',
  projectCard: '[data-testid^="project-card-"]',
  newProjectButton: 'button:has-text("New Project")',
  pipelineStepper: '[data-testid="pipeline-stepper"]',
  renderStartButton: 'button:has-text("Start render")',
  toast: '[role="status"], [data-sonner-toast]'
};

export type SelectorKey = keyof typeof selectors;

export function sel(key: SelectorKey): string {
  return selectors[key];
}
