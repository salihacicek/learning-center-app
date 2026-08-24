const fs = require('fs');
let content = fs.readFileSync('src/app/features/microservices-learning/microservices-learning.component.ts', 'utf8');

const replacementFunc = `
  private calculateSvgLines() {
    if (!this.boardWrapper?.nativeElement) return;
    
    const wrapper = this.boardWrapper.nativeElement;
    const wrapperRect = wrapper.getBoundingClientRect();
    
    const getOffset = (el: HTMLElement) => {
      const rect = el.getBoundingClientRect();
      return {
        top: rect.top - wrapperRect.top + wrapper.scrollTop,
        bottom: rect.bottom - wrapperRect.top + wrapper.scrollTop,
        left: rect.left - wrapperRect.left + wrapper.scrollLeft,
        right: rect.right - wrapperRect.left + wrapper.scrollLeft,
        centerX: rect.left - wrapperRect.left + wrapper.scrollLeft + rect.width / 2,
        centerY: rect.top - wrapperRect.top + wrapper.scrollTop + rect.height / 2,
        width: rect.width,
        height: rect.height
      };
    };

    // 1. TÜM görünür kutuların (obstacle) konumlarını topla
    const allBoxes: {id: string, top: number, bottom: number, left: number, right: number}[] = [];
    const allBoxEls = wrapper.querySelectorAll('.schema-box:not(.hidden-node)');
    allBoxEls.forEach((el: Element) => {
      const htmlEl = el as HTMLElement;
      const off = getOffset(htmlEl);
      allBoxes.push({
        id: htmlEl.id || '',
        top: off.top - 5,
        bottom: off.bottom + 5,
        left: off.left - 5,
        right: off.right + 5
      });
    });

    let globalTop = 99999;
    let globalBottom = 0;
    allBoxes.forEach(box => {
      if (box.top < globalTop) globalTop = box.top;
      if (box.bottom > globalBottom) globalBottom = box.bottom;
    });

    const newLines: any[] = [];
    
    // Fonksiyon: Verilen bir flow'u SVG çizgilerine dönüştürüp newLines'a ekler
    const pushFlowLines = (flow: any, isBackground: boolean) => {
      if (!flow) return;
      
      const stepEdges = new Map<number, {fromEdge: string, toEdge: string}>();
      const edgeTotal = new Map<string, number>();

      flow.steps.forEach((step: any, i: number) => {
        const elFrom = document.getElementById(step.fromNodeId);
        const elTo = document.getElementById(step.toNodeId);
        if (!elFrom || !elTo) return;
        
        const fromOff = getOffset(elFrom);
        const toOff = getOffset(elTo);
        const dx = toOff.centerX - fromOff.centerX;
        
        let fromEdge = dx > 0 ? 'right' : 'left';
        let toEdge = dx > 0 ? 'left' : 'right';
        
        const isSameColumn = Math.abs(dx) < 200;
        if (isSameColumn) {
          if (step.isReturn) { fromEdge = 'left'; toEdge = 'left'; }
          else { fromEdge = 'right'; toEdge = 'right'; }
        }

        stepEdges.set(i, { fromEdge, toEdge });
        const fromKey = \`\${step.fromNodeId}-\${fromEdge}\`;
        const toKey = \`\${step.toNodeId}-\${toEdge}\`;
        
        edgeTotal.set(fromKey, (edgeTotal.get(fromKey) || 0) + 1);
        edgeTotal.set(toKey, (edgeTotal.get(toKey) || 0) + 1);
      });

      const edgeCurrent = new Map<string, number>();
      const pairCount = new Map<string, number>();
      
      let topCorridorCount = 0;
      let bottomCorridorCount = 0;

      flow.steps.forEach((step: any, i: number) => {
        const edges = stepEdges.get(i);
        if (!edges) return;

        const elFrom = document.getElementById(step.fromNodeId);
        const elTo = document.getElementById(step.toNodeId);
        if (!elFrom || !elTo) return;

        const from = getOffset(elFrom);
        const to = getOffset(elTo);

        const fromKey = \`\${step.fromNodeId}-\${edges.fromEdge}\`;
        const toKey = \`\${step.toNodeId}-\${edges.toEdge}\`;
        
        const fromTotal = edgeTotal.get(fromKey) || 1;
        const toTotal = edgeTotal.get(toKey) || 1;

        const fromIdx = (edgeCurrent.get(fromKey) || 0) + 1;
        const toIdx = (edgeCurrent.get(toKey) || 0) + 1;
        
        edgeCurrent.set(fromKey, fromIdx);
        edgeCurrent.set(toKey, toIdx);

        const spacing = 36;
        const outTotalHeight = (fromTotal - 1) * spacing;
        const outStartY = from.centerY - (outTotalHeight / 2);
        const fixedY1 = outStartY + (fromIdx - 1) * spacing;

        const inTotalHeight = (toTotal - 1) * spacing;
        const inStartY = to.centerY - (inTotalHeight / 2);
        const fixedY2 = inStartY + (toIdx - 1) * spacing;

        const dx = to.centerX - from.centerX;
        const dy = to.centerY - from.centerY;
        const goingRight = dx > 0;

        let x1 = 0, y1 = 0, x2 = 0, y2 = 0;
        let pathD = '';
        let labelX = 0, labelY = 0;

        const isSameColumn = Math.abs(dx) < 200;
        const isAdjacent = Math.abs(dx) >= 200 && Math.abs(dx) < 500;
        const isReturn = step.isReturn || false;

        if (isSameColumn) {
          if (isReturn) {
            x1 = from.left; y1 = fixedY1; x2 = to.left; y2 = fixedY2;
            const gutterX = Math.min(from.left, to.left) - 40 - (fromIdx * 20);
            pathD = \`M \${x1} \${y1} L \${gutterX} \${y1} L \${gutterX} \${y2} L \${x2} \${y2}\`;
            labelX = gutterX; labelY = (y1 + y2) / 2;
          } else {
            x1 = from.right; y1 = fixedY1; x2 = to.right; y2 = fixedY2;
            const gutterX = Math.max(from.right, to.right) + 40 + (fromIdx * 20);
            pathD = \`M \${x1} \${y1} L \${gutterX} \${y1} L \${gutterX} \${y2} L \${x2} \${y2}\`;
            labelX = gutterX; labelY = (y1 + y2) / 2;
          }
        } else if (isAdjacent && Math.abs(dy) < 150) {
          x1 = goingRight ? from.right : from.left;
          y1 = fixedY1;
          x2 = goingRight ? to.left : to.right;
          y2 = fixedY2;
          const midX = x1 + (x2 - x1) / 2 + (fromIdx * 6 * (goingRight ? 1 : -1));
          pathD = \`M \${x1} \${y1} L \${midX} \${y1} L \${midX} \${y2} L \${x2} \${y2}\`;
          labelX = midX; labelY = (y1 + y2) / 2;
        } else {
          x1 = goingRight ? from.right : from.left;
          y1 = fixedY1;
          x2 = goingRight ? to.left : to.right;
          y2 = fixedY2;
          let midX = (x1 + x2) / 2;
          midX += (fromIdx * 10 * (goingRight ? 1 : -1));
          pathD = \`M \${x1} \${y1} L \${midX} \${y1} L \${midX} \${y2} L \${x2} \${y2}\`;
          labelX = midX;
          labelY = ((y1 + y2) / 2) + ((i % 4) * 25) - 30;
        }

        if (isBackground) {
          newLines.push({
            id: \`bg-\${step.fromNodeId}-\${step.toNodeId}-\${i}\`,
            x1, y1, x2, y2, midX: labelX, labelX, labelY,
            pathD, tokenPathD: pathD,
            label: step.label, subLabel: step.subLabel,
            active: false, isReturn: false,
            isDefaultBackground: true,
            stepIndex: 0,
            lineColor: '#64748b',
            markerEnd: 'arrowhead-default'
          });
        } else {
          let lineColor = this.getLineColor(i);
          let markerEnd = \`arrowhead-\${lineColor.replace('#', '')}\`;
          
          if (i <= this.currentStepIndex() || this.isAnimationFinished()) {
            let tokenPathD = pathD;
            if (i > 0) {
              // try to connect to previous step for smoother animation
              const prevStep = newLines[newLines.length - 1]; // This is a bit naive but works for linear flows
              if (prevStep && !prevStep.isDefaultBackground) {
                tokenPathD = pathD.replace(\`M \${x1} \${y1}\`, \`M \${prevStep.x2} \${prevStep.y2} L \${x1} \${y1}\`);
              }
            }
            newLines.push({
              id: \`\${step.fromNodeId}-\${step.toNodeId}-\${i}\`, 
              x1, y1, x2, y2, midX: labelX, labelX, labelY,
              pathD, tokenPathD,
              label: step.label, subLabel: step.subLabel,
              active: i === this.currentStepIndex() && !this.isAnimationFinished(),
              isReturn: step.isReturn || false,
              isDefaultBackground: false,
              stepIndex: i + 1,
              lineColor, markerEnd
            });
          }
        }
      });
    };

    // HER ZAMAN arka plan akışını çiz (Static Background)
    const bgFlow = this.flows().find(f => f.id === 'static-background');
    if (bgFlow) {
      pushFlowLines(bgFlow, true);
    }

    // Aktif akış varsa onu ÇİZ (Ön planda olacak)
    const activeFlow = this.activeFlowData();
    if (activeFlow && activeFlow.id !== 'static-background') {
      pushFlowLines(activeFlow, false);
    }

    // YENİ: Etiket (Label) Çakışmalarını Önleme Algoritması (Sadece aktif akışlar için uygulayalım, arka planın etiketi yok)
    for (let i = 0; i < newLines.length; i++) {
      if (newLines[i].isDefaultBackground) continue;
      for (let j = i + 1; j < newLines.length; j++) {
        if (newLines[j].isDefaultBackground) continue;
        const lineA = newLines[i];
        const lineB = newLines[j];
        const dx = Math.abs(lineA.labelX - lineB.labelX);
        const dy = Math.abs(lineA.labelY - lineB.labelY);
        if (dx < 150 && dy < 40) {
          if (lineA.labelY <= lineB.labelY) {
            lineB.labelY += (40 - dy) + 5;
          } else {
            lineB.labelY -= (40 - dy) + 5;
          }
        }
      }
    }

    this.svgLines.set(newLines);

    const newGroupLines: {path: string}[] = [];
    const groupEls = wrapper.querySelectorAll('.schema-box.is-group:not(.hidden-node)');
    groupEls.forEach((groupEl: Element) => {
      const container = groupEl.nextElementSibling;
      if (container && container.classList.contains('group-children-container')) {
        const pOffset = getOffset(groupEl as HTMLElement);
        const startX = pOffset.left + 12;
        const startY = pOffset.bottom;
        const children = container.querySelectorAll('.child-box:not(.hidden-node)');
        children.forEach((childEl: Element) => {
          const cOffset = getOffset(childEl as HTMLElement);
          const path = \`M \${startX} \${startY} L \${startX} \${cOffset.centerY} L \${cOffset.left} \${cOffset.centerY}\`;
          newGroupLines.push({ path });
        });
      }
    });

    this.groupSvgLines.set(newGroupLines);
  }
`;

content = content.replace(/private calculateSvgLines\(\) \{[\s\S]*?this\.groupSvgLines\.set\(newGroupLines\);\n  \}/, replacementFunc);

fs.writeFileSync('src/app/features/microservices-learning/microservices-learning.component.ts', content);
