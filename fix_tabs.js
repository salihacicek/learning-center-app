const fs = require('fs');

// 1. HTML: Add Tabs back to microservices-learning.component.html
let html = fs.readFileSync('src/app/features/microservices-learning/microservices-learning.component.html', 'utf8');

const tabsHtml = `
  <!-- YENİ: Mimari Modu Sekmeleri (Tab Switcher) -->
  <div class="architecture-tabs" style="display: flex; justify-content: center; gap: 10px; padding-bottom: 20px;">
    <button class="tab-btn" [class.active]="activeMode() === 'basic'" (click)="switchMode('basic')" style="padding: 10px 20px; cursor: pointer; border-radius: 5px; border: 1px solid #cbd5e1; background: white;">Basit Mimari</button>
    <button class="tab-btn" [class.active]="activeMode() === 'advanced'" (click)="switchMode('advanced')" style="padding: 10px 20px; cursor: pointer; border-radius: 5px; border: 1px solid #cbd5e1; background: white;">Gelişmiş Mimari (Özel Alan)</button>
  </div>
`;

if (!html.includes('Mimari Modu Sekmeleri')) {
  // Find <div class="architecture-container"> and append after it
  html = html.replace(/<div class="architecture-container">/, '<div class="architecture-container">' + tabsHtml);
}
fs.writeFileSync('src/app/features/microservices-learning/microservices-learning.component.html', html);


// 2. TS: Add activeMode and switchMode to microservices-learning.component.ts
let ts = fs.readFileSync('src/app/features/microservices-learning/microservices-learning.component.ts', 'utf8');

if (!ts.includes('activeMode = signal')) {
  // Add computed import if missing
  if (!ts.includes('computed')) {
    ts = ts.replace(/import \{ Component, signal, OnInit, OnDestroy, ViewChild, ElementRef, AfterViewChecked /g, 
      "import { Component, signal, computed, OnInit, OnDestroy, ViewChild, ElementRef, AfterViewChecked ");
  }

  // Add advanced imports
  ts = ts.replace(/import \{ MICROSERVICES_LAYERS, MICROSERVICES_FLOWS \} from '\.\/data\/microservices\.data';/, 
    "import { MICROSERVICES_LAYERS, MICROSERVICES_FLOWS } from './data/microservices.data';\nimport { ADVANCED_LAYERS, ADVANCED_FLOWS } from './data/advanced-microservices.data';");

  // Replace layers and flows
  ts = ts.replace(/layers = signal<Layer\[\]>\(MICROSERVICES_LAYERS\);/, 
    "activeMode = signal<'basic'|'advanced'>('basic');\n  layers = computed(() => this.activeMode() === 'advanced' ? ADVANCED_LAYERS : MICROSERVICES_LAYERS);");
  ts = ts.replace(/flows = signal<FlowPath\[\]>\(MICROSERVICES_FLOWS\);/, 
    "flows = computed(() => this.activeMode() === 'advanced' ? ADVANCED_FLOWS : MICROSERVICES_FLOWS);");

  // Add switchMode method
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

// 3. Fix the 3 databases in basic view:
let basicData = fs.readFileSync('src/app/features/microservices-learning/data/microservices.data.ts', 'utf8');
basicData = basicData.replace(/isTwoColumn: true,[\s\S]*?leftNodes: \[[\s\S]*?\{ id: 'db-main', name: 'Merkezi Veritabanı', type: 'db', desc: 'Tüm servislerin bağlandığı tek veritabanı' \}[\s\S]*?\],[\s\S]*?rightNodes: \[[\s\S]*?\{ id: 'redis', name: 'Redis Cache', type: 'cache', desc: 'Sık kullanılan verileri bellekte tutar' \},[\s\S]*?\{ id: 'rabbitmq', name: 'RabbitMQ', type: 'queue', desc: 'Asenkron mesajlaşma kuyruğu' \}[\s\S]*?\]/g, 
  `nodes: [
      { id: 'db-main', name: 'Merkezi Veritabanı', type: 'db', desc: 'Tüm servislerin bağlandığı tek veritabanı' }
    ]`);
fs.writeFileSync('src/app/features/microservices-learning/data/microservices.data.ts', basicData);
