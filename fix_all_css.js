const fs = require('fs');
let css = fs.readFileSync('src/app/features/microservices-learning/microservices-learning.component.css', 'utf8');

// 1. stroke-dasharray fix for default-bg-line
css = css.replace(/stroke-dasharray: 4, 4;/g, '/* stroke-dasharray removed */');

// 2. Hide animated-path for default-bg-line
const animatedPathReplacement = `
.default-bg-line .animated-path {
  display: none;
}
.default-bg-label {
`;
css = css.replace(/\.default-bg-line \.animated-path \{[\s\S]*?\}\n\.default-bg-label \{/, animatedPathReplacement);

// 3. Fix gap in .layer-body for vertical separation (Sideways V shape)
css = css.replace(/gap: 24px;/g, 'gap: 60px;');

// 4. Center align schema-board for Sideways V shape
css = css.replace(/align-items: flex-start;\s*align-content: flex-start;/g, 'align-items: center;\n  align-content: center;');

// 5. Remove min-height overrides for has-active-flow
css = css.replace(/\.schema-board\.has-active-flow \.schema-box \{[\s\S]*?padding: 16px 16px;\n\}/g, '');
css = css.replace(/\.schema-board\.has-active-flow #layer-services \.schema-box \{[\s\S]*?min-height: 140px;[\s\S]*?\n\}/g, '');

// 6. Set explicit 120px height for .schema-box
const schemaBoxReplacement = `
.schema-box {
  position: relative;
  z-index: 10; /* Kutular her zaman üstte */
  background-color: #ffffff; /* Kesin beyaz arka plan (eğer tip belirtilmemişse) */
  border: 1px solid #e2e8f0; /* Standart kenarlık, üstteki kalın çizgiyi kaldırdık */
  padding: 16px 12px; /* Kenarlara daha fazla ok sığabilmesi için boyuna padding artırıldı */
  min-height: 120px;
  height: 120px;
  border-radius: 8px; /* Daha yumuşak köşeler */
`;
css = css.replace(/\n\.schema-box \{\s*position: relative;\s*z-index: 10;[\s\S]*?min-height: 60px;\s*border-radius: 8px;/g, schemaBoxReplacement);

fs.writeFileSync('src/app/features/microservices-learning/microservices-learning.component.css', css);
