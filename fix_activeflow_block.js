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

ts = ts.replace(/    const activeFlow = this\.activeFlowData\(\);\n    if \(!activeFlow\) \{\n      this\.svgLines\.set\(\[\]\);\n      this\.groupSvgLines\.set\(\[\]\);\n      return;\n    \}/, activeFlowBlock);

const pushBlock = `        newLines.push({
          id: \`\${step.fromNodeId}-\${step.toNodeId}-\${i}\`, 
          x1, y1, x2, y2, midX: labelX, labelX, labelY,
          pathD,
          tokenPathD: isDrawingBackground ? pathD : tokenPathD,
          label: isDrawingBackground ? '' : step.label,
          subLabel: isDrawingBackground ? '' : step.subLabel,
          active: isDrawingBackground ? false : (i === this.currentStepIndex() && !this.isAnimationFinished()),
          isReturn: step.isReturn || false,
          isDefaultBackground: isDrawingBackground,
          stepIndex: i + 1,
          lineColor: isDrawingBackground ? '#cbd5e1' : lineColor,
          markerEnd: isDrawingBackground ? 'arrowhead-default' : markerEnd
        });`;

ts = ts.replace(/        newLines\.push\(\{\n          id: `\$\{step\.fromNodeId\}-\$\{step\.toNodeId\}-\$\{i\}`,\s*\n          x1, y1, x2, y2, midX: labelX, labelX, labelY,\n          pathD,\n          tokenPathD, \/\/ YENİ: Token'ın kayacağı kesintisiz yol\n          label: step\.label,\n          subLabel: step\.subLabel,\n          active: i === this\.currentStepIndex\(\) && !this\.isAnimationFinished\(\),\n          isReturn: step\.isReturn \|\| false,\n          isDefaultBackground: false,\n          stepIndex: i \+ 1,\n          lineColor,\n          markerEnd\n        \}\);/, pushBlock);

fs.writeFileSync('src/app/features/microservices-learning/microservices-learning.component.ts', ts);
