const fs = require('fs');
let ts = fs.readFileSync('src/app/features/microservices-learning/microservices-learning.component.ts', 'utf8');

// The logic was:
// const bgFlow = this.flows().find(f => f.id === 'static-background');
// if (bgFlow) { pushFlowLines(bgFlow, true); }
// 
// I will change it to ONLY draw bgFlow if there is NO active flow running!
// Wait, actually, if I look at the script, activeFlowId might be set. If it is set, should we draw bgFlow? 
// The user says "gri oklar duruyor ... onların olmaması lazım". So if an active flow is running, NO background arrows should exist.

const replacement = `
    // Eğer aktif bir akış (animasyon) varsa arka plan oklarını (gri okları) ÇİZME.
    // Sadece ekran boşken (hiçbir komut çalışmıyorken) statik oklar görünsün.
    const activeFlow = this.activeFlowData();
    const bgFlow = this.flows().find(f => f.id === 'static-background');
    
    if (bgFlow && !activeFlow) {
      pushFlowLines(bgFlow, true);
    }

    if (activeFlow && activeFlow.id !== 'static-background') {
      pushFlowLines(activeFlow, false);
    }
`;

ts = ts.replace(/\/\/ HER ZAMAN arka plan akışını çiz \(Static Background\)[\s\S]*?pushFlowLines\(activeFlow, false\);\n    \}/, replacement);

fs.writeFileSync('src/app/features/microservices-learning/microservices-learning.component.ts', ts);
