const fs = require('fs');
let html = fs.readFileSync('src/app/features/microservices-learning/microservices-learning.component.html', 'utf8');

// Hide label if it's default background
html = html.replace(/<div class="html-line-label"/g, '<div class="html-line-label" *ngIf="!line.isDefaultBackground"');

fs.writeFileSync('src/app/features/microservices-learning/microservices-learning.component.html', html);

// Let's also fix the CSS for .default-bg-line to NOT have stroke-dasharray and have a nice solid stroke
let css = fs.readFileSync('src/app/features/microservices-learning/microservices-learning.component.css', 'utf8');

css = css.replace('stroke-dasharray: 4, 4;', '/* stroke-dasharray removed for solid background arrows */');

fs.writeFileSync('src/app/features/microservices-learning/microservices-learning.component.css', css);
