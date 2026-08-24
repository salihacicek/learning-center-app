const fs = require('fs');
let css = fs.readFileSync('src/app/features/microservices-learning/microservices-learning.component.css', 'utf8');

css = css.replace('min-height: 60px; /* Okların dağılabilmesi için minimum yükseklik garantisi */', 'height: 120px;\n  min-height: 120px;');

fs.writeFileSync('src/app/features/microservices-learning/microservices-learning.component.css', css);
