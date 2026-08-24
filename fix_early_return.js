const fs = require('fs');

let ts = fs.readFileSync('src/app/features/microservices-learning/microservices-learning.component.ts', 'utf8');

const activeFlowBlock = `    let activeFlow = this.activeFlowData();
    const bgFlow = this.flows().find(f => f.id === 'static-background');
    let isDrawingBackground = false;

    if (!activeFlow) {
      if (bgFlow) {
        activeFlow = bgFlow;
        isDrawingBackground = true;
      } else {
        this.svgLines.set([]);
        this.groupSvgLines.set([]);
        return;
      }
    }`;

ts = ts.replace(/    if \(!activeFlow\) \{ this\.svgLines\.set\(\[\]\); return; \}/, activeFlowBlock);

fs.writeFileSync('src/app/features/microservices-learning/microservices-learning.component.ts', ts);
