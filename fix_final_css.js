const fs = require('fs');
let css = fs.readFileSync('src/app/features/microservices-learning/microservices-learning.component.css', 'utf8');

css = css.replace(/:host-context\(\.dark-theme\) \.default-bg-line \.animated-path,\n\.dark-theme \n\n\.default-bg-line \.animated-path \{\n  display: none;\n\}\n\.default-bg-label \{/, 
`:host-context(.dark-theme) .default-bg-line .animated-path,
.dark-theme .default-bg-line .animated-path {
  stroke: #475569;
}
.default-bg-line .animated-path {
  display: none;
}
.default-bg-label {`);

fs.writeFileSync('src/app/features/microservices-learning/microservices-learning.component.css', css);
