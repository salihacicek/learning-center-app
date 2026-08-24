const fs = require('fs');
let css = fs.readFileSync('src/app/features/microservices-learning/microservices-learning.component.css', 'utf8');

// 1. Remove the old height overrides
css = css.replace(/\.schema-board\.has-active-flow \.schema-box \{[\s\S]*?min-height: 140px;[^\n]*\n\}/g, '/* Removed old height overrides */');

// 2. Add fixed height to .schema-box
const replacement = `
.schema-box {
  position: relative;
  z-index: 10;
  background-color: #ffffff;
  border: 1px solid #e2e8f0;
  padding: 16px 12px;
  height: 120px; /* Tüm kutular her zaman eşit yükseklikte (Kullanıcı talebi) */
  min-height: 120px;
  border-radius: 8px;
`;

css = css.replace(/\.schema-box \{\s*position: relative;\s*z-index: 10;\s*background-color: #ffffff;\s*border: 1px solid #e2e8f0;\s*padding: 16px 12px;\s*min-height: 60px;\s*border-radius: 8px;/g, replacement);

fs.writeFileSync('src/app/features/microservices-learning/microservices-learning.component.css', css);
