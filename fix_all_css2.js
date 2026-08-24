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

fs.writeFileSync('src/app/features/microservices-learning/microservices-learning.component.css', css);
