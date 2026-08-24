const fs = require('fs');
let html = fs.readFileSync('src/app/features/microservices-learning/microservices-learning.component.html', 'utf8');

// Hide layer-col-right if there is no active flow and showInactiveNodes is false
html = html.replace(/<div class="layer-col-right">/g, '<div class="layer-col-right" *ngIf="activeFlowId() !== null || showInactiveNodes()">');

// Also fix layer-body two-columns class condition so it doesn't apply the gap
html = html.replace(/\[class\.two-columns\]="layer\.isTwoColumn"/g, '[class.two-columns]="layer.isTwoColumn && (activeFlowId() !== null || showInactiveNodes())"');

fs.writeFileSync('src/app/features/microservices-learning/microservices-learning.component.html', html);
