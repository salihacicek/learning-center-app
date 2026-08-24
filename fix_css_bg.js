const fs = require('fs');
let css = fs.readFileSync('src/app/features/microservices-learning/microservices-learning.component.css', 'utf8');

const replacement = `
.default-bg-line {
  z-index: 10;
}
.default-bg-line .static-path {
  stroke: #94a3b8; /* Arrowhead rengiyle tam uyumlu */
  stroke-width: 2px;
}
.default-bg-line .animated-path {
  display: none; /* Arka plan oklarında ikinci çizgiye gerek yok */
}
`;

css = css.replace(/\.default-bg-line \{[\s\S]*?font-size: 0\.55rem;\n\}/, replacement);

fs.writeFileSync('src/app/features/microservices-learning/microservices-learning.component.css', css);
