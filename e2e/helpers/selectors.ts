export const selectors = {
  // Projects
  projectsList: '[data-testid="projects-list"]',
  projectCard: (id: string) => `[data-testid="project-card-${id}"]`,
  projectDeleteButton: '[data-testid="project-delete-button"]',
  projectDeleteConfirm: '[data-testid="project-delete-confirm"]',
  projectDeleteCancel: '[data-testid="project-delete-cancel"]',

  // New project form
  newProjectTopic: '[data-testid="new-project-topic"]',
  newProjectName: '[data-testid="new-project-name"]',
  newProjectAspectRatio: '[data-testid="new-project-aspect-ratio"]',
  newProjectSubmit: '[data-testid="new-project-submit"]',

  // Navigation
  newProjectButton: 'a[href="/projects/new"]',
  pipelineStepper: '[data-testid="pipeline-stepper"]',
  pipelineStage: (stageId: string) => `[data-testid="pipeline-stage-${stageId}"]`,

  // Render panel
  renderDraftButton: '[data-testid="render-draft-button"]',
  renderProductionButton: '[data-testid="render-production-button"]',
  renderStatus: '[data-testid="render-status"]',
  renderProgressBar: '[data-testid="render-progress-bar"]',
  renderProgressPct: '[data-testid="render-progress-pct"]',
  renderDownloadLink: '[data-testid="render-download-link"]',

  // Assets
  uploadZone: '[data-testid="upload-zone"]',
  uploadFileInput: '[data-testid="upload-file-input"]',

  // Video preview
  videoPreviewFallback: '[data-testid="video-preview-fallback"]',

  // Toast
  toast: '[role="status"], [data-sonner-toast]',
};

export type SelectorKey = keyof typeof selectors;
export function sel(key: keyof typeof selectors): string | ((...args: string[]) => string) {
  return selectors[key];
}
