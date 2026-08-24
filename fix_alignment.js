const fs = require('fs');
let css = fs.readFileSync('src/app/features/microservices-learning/microservices-learning.component.css', 'utf8');

css = css.replace(/align-items: flex-start;[\s\S]*?align-content: flex-start;/, 'align-items: center;\n  align-content: center;');

fs.writeFileSync('src/app/features/microservices-learning/microservices-learning.component.css', css);
