const fs = require('fs');
let css = fs.readFileSync('src/app/features/microservices-learning/microservices-learning.component.css', 'utf8');

css += `
/* YENI YERLESIM KONTROLLERI (OPTICAL ILLUSION FIX) */
.schema-page {
  padding: 30px;
  min-height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center; 
}
.architecture-container {
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
}
.board-wrapper {
  width: 100%;
  max-width: 1400px;
  display: flex;
  justify-content: center;
  margin: 0 auto;
}
.schema-board {
  max-width: 1400px;
  width: 100%;
}
.console-wrapper {
  width: 100%;
  max-width: 1400px;
  margin: 40px auto 0 auto !important;
}
`;

fs.writeFileSync('src/app/features/microservices-learning/microservices-learning.component.css', css);
