const fs = require('fs');
let html = fs.readFileSync('src/app/features/microservices-learning/microservices-learning.component.html', 'utf8');

html = html.replace(/\[style\.opacity\]="line\.isDefaultBackground \? '0\.2' : '1'"/g, '[style.opacity]="line.isDefaultBackground ? \'0.6\' : \'1\'"');

fs.writeFileSync('src/app/features/microservices-learning/microservices-learning.component.html', html);
