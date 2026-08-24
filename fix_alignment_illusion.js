const fs = require('fs');
let css = fs.readFileSync('src/app/features/microservices-learning/microservices-learning.component.css', 'utf8');

// Sabit genislikler ekliyoruz.
const wrapperCSS = `
.schema-page {
  padding: 30px;
  min-height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center; /* Sayfanin her seyini ortala */
}

.architecture-container {
  width: 100%;
  max-width: 1400px; /* Maksimum genislik veriyoruz ki saga/sola kayma hissi olmasin */
  margin: 0 auto;
}

.board-wrapper {
  width: 100%;
  display: flex;
  justify-content: center;
}

.console-wrapper {
  width: 100%;
  max-width: 1400px;
  margin: 40px auto 0 auto;
  border-radius: 8px;
`;

css = css.replace(/\.console-wrapper \{/, wrapperCSS);

fs.writeFileSync('src/app/features/microservices-learning/microservices-learning.component.css', css);
