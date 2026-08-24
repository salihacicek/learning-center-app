const fs = require('fs');
let css = fs.readFileSync('src/app/features/microservices-learning/microservices-learning.component.css', 'utf8');

const replacement = `
.schema-box {
  position: relative;
  z-index: 10; /* Kutular her zaman üstte */
  background-color: #ffffff; /* Kesin beyaz arka plan (eğer tip belirtilmemişse) */
  border: 1px solid #e2e8f0; /* Standart kenarlık, üstteki kalın çizgiyi kaldırdık */
  padding: 16px 12px; /* Kenarlara daha fazla ok sığabilmesi için boyuna padding artırıldı */
  min-height: 120px; /* Tüm kutular her zaman eşit yükseklikte (Kullanıcı talebi) */
  height: 120px;
  border-radius: 8px; /* Daha yumuşak köşeler */
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -2px rgba(0, 0, 0, 0.05); /* Modern card gölgesi */
  display: flex;
  flex-direction: column;
  justify-content: center; /* İçerik dikeyde ortalansın */
  font-size: 0.75rem; 
  font-weight: 500;
  transition: all 0.2s ease-out;
}
`;

css = css.replace(/\.schema-box \{[\s\S]*?transition: all 0\.2s ease-out;\n\}/g, replacement.trim());

fs.writeFileSync('src/app/features/microservices-learning/microservices-learning.component.css', css);
