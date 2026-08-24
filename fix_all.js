const fs = require('fs');

// --- 1. Fix HTML ---
let htmlContent = fs.readFileSync('src/app/features/microservice-tutorial/microservice-tutorial.component.html', 'utf8');

const replacement = `
  <div class="architecture-tabs">
    <h2>Mikroservis Öğrenme Merkezi</h2>
    <div style="margin-top: 10px; display: flex; gap: 10px;">
      <button class="tab-btn" [class.active]="activeFlowId() === 'login-flow'" (click)="selectFlow('login-flow')">1. Kimlik Akışı (Login)</button>
      <button class="tab-btn" [class.active]="activeFlowId() === 'crud-flow'" (click)="selectFlow('crud-flow')">2. Özel Alan Akışı (CRUD)</button>
      <button class="tab-btn" (click)="selectFlow(null)" *ngIf="activeFlowId()">Sıfırla / İptal</button>
    </div>
  </div>
`;

htmlContent = htmlContent.replace(/<div class="architecture-tabs">[\s\S]*?<\/div>/, replacement);

fs.writeFileSync('src/app/features/microservice-tutorial/microservice-tutorial.component.html', htmlContent);

// --- 2. Fix TS ---
let tsContent = fs.readFileSync('src/app/features/microservice-tutorial/microservice-tutorial.component.ts', 'utf8');

tsContent = tsContent.replace(/templateUrl: '\.\/architecture-schema\.component\.html'/, "templateUrl: './microservice-tutorial.component.html'");
tsContent = tsContent.replace(/styleUrl: '\.\/architecture-schema\.component\.css'/, "styleUrl: './microservice-tutorial.component.css'");
tsContent = tsContent.replace(/setTab\(tab: 'auth' \| 'follower' \| 'advanced'\) \{/g, "setTab(tab: 'tutorial') {");

fs.writeFileSync('src/app/features/microservice-tutorial/microservice-tutorial.component.ts', tsContent);

console.log("Fixed!");
