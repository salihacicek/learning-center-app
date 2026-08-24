const fs = require('fs');
let ts = fs.readFileSync('src/app/features/microservices-learning/microservices-learning.component.ts', 'utf8');

// ALWAYS draw bgFlow, regardless of activeFlow
const replacement = `
    const activeFlow = this.activeFlowData();
    const bgFlow = this.flows().find(f => f.id === 'static-background');
    
    // YENİ: bgFlow her zaman çizilecek (CSS veya HTML opacity ile gizlenecek)
    if (bgFlow) {
      pushFlowLines(bgFlow, true);
    }

    if (activeFlow && activeFlow.id !== 'static-background') {
      pushFlowLines(activeFlow, false);
    }
`;

// Remove the debug log and previous logic
ts = ts.replace(/const activeFlow = this\.activeFlowData\(\);\s*const bgFlow = this\.flows\(\)\.find\(f => f\.id === 'static-background'\);\s*if \(bgFlow && !activeFlow\) \{\s*console\.log\('Pushing bgFlow lines\.\.\.', bgFlow\);\s*pushFlowLines\(bgFlow, true\);\s*\}\s*console\.log\('Finished calculating\. newLines:', newLines\);\s*if \(activeFlow && activeFlow\.id !== 'static-background'\) \{\s*pushFlowLines\(activeFlow, false\);\s*\}/, replacement);

fs.writeFileSync('src/app/features/microservices-learning/microservices-learning.component.ts', ts);

// Now update HTML to hide bgFlow if activeFlow is present
let html = fs.readFileSync('src/app/features/microservices-learning/microservices-learning.component.html', 'utf8');
html = html.replace(/\[style\.opacity\]="line\.isDefaultBackground \? '0\.6' : '1'"/, `[style.opacity]="line.isDefaultBackground ? (activeFlowId() !== null ? '0' : '0.6') : '1'"`);
fs.writeFileSync('src/app/features/microservices-learning/microservices-learning.component.html', html);
