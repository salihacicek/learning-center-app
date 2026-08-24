const fs = require('fs');

let html = fs.readFileSync('src/app/features/microservices-learning/microservices-learning.component.html', 'utf8');

const targetBlock = `<path class="animated-path"
            [attr.d]="line.pathD"
            [style.stroke]="!line.isDefaultBackground ? line.lineColor : ''"
            [attr.marker-end]="!line.isDefaultBackground && line.markerEnd ? 'url(#' + line.markerEnd + ')' : null"
          />`;

const replacementBlock = `<path class="animated-path"
            [attr.d]="line.pathD"
            [style.stroke]="line.isDefaultBackground ? line.lineColor : (line.active && !line.isReturn ? line.lineColor : '')"
            [attr.marker-end]="line.isDefaultBackground ? 'url(#' + line.markerEnd + ')' : (line.active ? (line.isReturn ? 'url(#arrowhead-return)' : 'url(#' + line.markerEnd + ')') : null)"
          />`;

html = html.replace(targetBlock, replacementBlock);

fs.writeFileSync('src/app/features/microservices-learning/microservices-learning.component.html', html);
