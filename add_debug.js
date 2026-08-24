const fs = require('fs');
let ts = fs.readFileSync('src/app/features/microservices-learning/microservices-learning.component.ts', 'utf8');

const debugLog = `
    if (bgFlow && !activeFlow) {
      console.log('Pushing bgFlow lines...', bgFlow);
      pushFlowLines(bgFlow, true);
    }
    console.log('Finished calculating. newLines:', newLines);
`;

ts = ts.replace(/if \(bgFlow && !activeFlow\) \{\s*pushFlowLines\(bgFlow, true\);\s*\}/, debugLog);

fs.writeFileSync('src/app/features/microservices-learning/microservices-learning.component.ts', ts);
