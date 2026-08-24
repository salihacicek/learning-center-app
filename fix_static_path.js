const fs = require('fs');
let html = fs.readFileSync('src/app/features/microservices-learning/microservices-learning.component.html', 'utf8');

// The HTML currently has:
// <path class="static-path"
//   [attr.d]="line.pathD"
//   [attr.marker-end]="'url(#arrowhead)'"
// />
// I want to change it to:
// <path class="static-path" *ngIf="line.isDefaultBackground" ...

html = html.replace(/<path class="static-path"/g, '<path class="static-path" *ngIf="line.isDefaultBackground"');

fs.writeFileSync('src/app/features/microservices-learning/microservices-learning.component.html', html);
