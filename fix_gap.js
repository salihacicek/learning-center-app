const fs = require('fs');
let css = fs.readFileSync('src/app/features/microservices-learning/microservices-learning.component.css', 'utf8');

css = css.replace(/gap: 24px; \/\* Boyuna boşluk artırıldı[^\n]*\n/, 'gap: 60px; /* Boyuna boşluk daha da artırıldı (V şekli oluşsun diye) */\n');

fs.writeFileSync('src/app/features/microservices-learning/microservices-learning.component.css', css);
