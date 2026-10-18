import { boot } from './app.js';
import './views/home.js';
import './views/proposals.js';
import './views/project.js';
import './views/design.js';
import './views/govern.js';
import './views/schedule.js';
import './views/sync.js';
import './autopilot.js';

// Re-render the settings form when the AI provider changes.
document.addEventListener('change', e => {
  if (e.target.id === 'ai-prov') window.crosscourse.actions['save-ai']();
});
boot();
