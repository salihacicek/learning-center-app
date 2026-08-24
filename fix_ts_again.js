const fs = require('fs');
let ts = fs.readFileSync('src/app/features/microservices-learning/microservices-learning.component.ts', 'utf8');

ts = ts.replace(/layers = computed\(\(\) => MICROSERVICES_LAYERS\);/, 
  "activeMode = signal<'basic'|'advanced'>('basic');\n  layers = computed(() => this.activeMode() === 'advanced' ? ADVANCED_LAYERS : MICROSERVICES_LAYERS);");

ts = ts.replace(/flows = computed\(\(\) => MICROSERVICES_FLOWS\);/, 
  "flows = computed(() => this.activeMode() === 'advanced' ? ADVANCED_FLOWS : MICROSERVICES_FLOWS);");

if (!ts.includes('switchMode(')) {
  const switchModeFn = `
  switchMode(mode: 'basic' | 'advanced') {
    this.activeMode.set(mode);
    this.resetNodePositions();
    this.resetConsole();
  }
`;
  ts = ts.replace(/resetConsole\(\) \{/, switchModeFn + '\n  resetConsole() {');
}

fs.writeFileSync('src/app/features/microservices-learning/microservices-learning.component.ts', ts);
