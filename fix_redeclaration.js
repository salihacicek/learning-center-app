const fs = require('fs');

let ts = fs.readFileSync('src/app/features/microservices-learning/microservices-learning.component.ts', 'utf8');

ts = ts.replace(/const activeFlow = this\.activeFlowData\(\);\n    const numberOfSteps = activeFlow \? activeFlow\.steps\.length : 10;/, "let activeFlow = this.activeFlowData();\n    const numberOfSteps = activeFlow ? activeFlow.steps.length : 10;");

ts = ts.replace(/let activeFlow = this\.activeFlowData\(\);\n    const bgFlow = this\.flows\(\)\.find\(f => f\.id === 'static-background'\);/, "const bgFlow = this.flows().find(f => f.id === 'static-background');");

fs.writeFileSync('src/app/features/microservices-learning/microservices-learning.component.ts', ts);
