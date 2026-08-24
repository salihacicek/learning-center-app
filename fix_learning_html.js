const fs = require('fs');
let htmlContent = fs.readFileSync('src/app/features/microservices-learning/microservices-learning.component.html', 'utf8');

const replacement = `
  <!-- EKLENEN KISIM: Mod Seçimi -->
  <div class="architecture-tabs" *ngIf="!showWelcome()" style="padding: 10px; background: #fff; border-bottom: 1px solid #e2e8f0; display: flex; gap: 10px; justify-content: center;">
    <button class="tab-btn" [class.active]="activeMode() === 'basic'" (click)="switchMode('basic')" style="padding: 8px 16px; border: 1px solid #ccc; border-radius: 4px; cursor: pointer;">Basit Mimari</button>
    <button class="tab-btn" [class.active]="activeMode() === 'advanced'" (click)="switchMode('advanced')" style="padding: 8px 16px; border: 1px solid #ccc; border-radius: 4px; cursor: pointer;">Gelişmiş Mimari (Özel Alan)</button>
  </div>

  <div class="schema-toolbar"
`;

htmlContent = htmlContent.replace('<div class="schema-toolbar"', replacement);

fs.writeFileSync('src/app/features/microservices-learning/microservices-learning.component.html', htmlContent);
