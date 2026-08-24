const fs = require('fs');
let content = fs.readFileSync('src/app/features/microservices-learning/microservices-learning.component.ts', 'utf8');

// 1. Add import for ADVANCED
content = content.replace(
  "import { MICROSERVICES_LAYERS, MICROSERVICES_FLOWS } from './data/microservices.data';",
  "import { MICROSERVICES_LAYERS, MICROSERVICES_FLOWS } from './data/microservices.data';\nimport { ADVANCED_LAYERS, ADVANCED_FLOWS } from './data/advanced-microservices.data';"
);

// 2. Add activeMode signal
content = content.replace(
  "showInactiveNodes = signal(false);",
  "showInactiveNodes = signal(false);\n  activeMode = signal<'basic' | 'advanced'>('basic');"
);

// 3. Modify layers and flows to use the activeMode
content = content.replace(
  "layers = computed(() => MICROSERVICES_LAYERS);",
  "layers = computed(() => this.activeMode() === 'basic' ? MICROSERVICES_LAYERS : ADVANCED_LAYERS);"
);
content = content.replace(
  "flows = computed(() => MICROSERVICES_FLOWS);",
  "flows = computed(() => this.activeMode() === 'basic' ? MICROSERVICES_FLOWS : ADVANCED_FLOWS);"
);

// 4. Modify onBoxClick to trigger the new flows if in advanced mode
const onBoxClickLogic = `
  onBoxClick(node: any, event?: MouseEvent) {
    if (this.hasNodeMoved) return;
    
    let targetFlowId: string | null = null;
    
    if (this.activeMode() === 'advanced') {
      if (node.id === 'client-node') {
        targetFlowId = 'login-flow';
      } else if (node.id === 'crud-service' || node.id === 'crud-db') {
        targetFlowId = 'crud-flow';
      } else {
        targetFlowId = 'login-flow';
      }
    } else {
      if (node.id === 'user-action-comp') {
        targetFlowId = 'simple-register';
      }
    }

    if (targetFlowId) {
`;

content = content.replace(/onBoxClick\(node: any, event\?: MouseEvent\) \{[\s\S]*?if \(targetFlowId\) \{/, onBoxClickLogic);

// Add a helper method to switch modes and reset
const switchModeMethod = `
  switchMode(mode: 'basic' | 'advanced') {
    this.activeMode.set(mode);
    this.activeFlowId.set(null);
    this.svgLines.set([]);
    this.resetNodePositions();
    this.consoleHistory.set([]);
  }
`;
content = content.replace(/ngOnInit\(\) \{/, switchModeMethod + "\n  ngOnInit() {");

fs.writeFileSync('src/app/features/microservices-learning/microservices-learning.component.ts', content);
