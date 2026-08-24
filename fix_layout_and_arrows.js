const fs = require('fs');

// 1. Fix the TS file to not clear arrows on null activeFlow
let ts = fs.readFileSync('src/app/features/microservices-learning/microservices-learning.component.ts', 'utf8');
ts = ts.replace(/if \(!activeFlow\) \{ this\.svgLines\.set\(\[\]\); return; \}/g, '// Removed return so static background can be drawn when no flow is active');
fs.writeFileSync('src/app/features/microservices-learning/microservices-learning.component.ts', ts);

// 2. Fix the CSS file for uniform equal column widths and gaps
let css = fs.readFileSync('src/app/features/microservices-learning/microservices-learning.component.css', 'utf8');

const layerColumnReplacement = `
.layer-column {
  position: relative;
  display: flex;
  flex-direction: column;
  background: transparent; 
  border: none; 
  width: 280px;
  flex: 0 0 280px; /* Tamamen sabit genişlik, her kolon EŞİT boyutta! */
  max-width: 280px; 
  z-index: 10; 
}
`;
css = css.replace(/\.layer-column \{\s*position: relative;\s*display: flex;\s*flex-direction: column;\s*background: transparent;\s*border: none;\s*min-width: 0;[^\n]*\n\s*flex: 1 1 0;[^\n]*\n\s*max-width: 250px;\s*z-index: 10;\s*\}/, layerColumnReplacement);

// Make the board gap equal and big
css = css.replace(/gap: 2vw; \/\* Ekran küçüldükçe boşluk da küçülsün \*\//g, 'gap: 4vw; /* Aralarındaki boşluklar EŞİT ve daha geniş */');

// Center text in boxes
css = css.replace(/\.box-title-area \{/g, '.box-title-area {\n  align-items: center;\n  text-align: center;');
css = css.replace(/\.box-desc \{/g, '.box-desc {\n  text-align: center;');

// Make layer headers centered
css = css.replace(/\.layer-header \{/g, '.layer-header {\n  text-align: center;');

fs.writeFileSync('src/app/features/microservices-learning/microservices-learning.component.css', css);
