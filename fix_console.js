const fs = require('fs');
let content = fs.readFileSync('src/app/features/microservices-learning/microservices-learning.component.ts', 'utf8');

const newResetConsole = `
  resetConsole() {
    if (this.activeMode() === 'advanced') {
      this.consoleHistory.set([
        { type: 'system', text: 'Sistem hazır (Gelişmiş Mimari).\\n\\nKullanabileceğiniz İşlemler:\\n- kimlik (Kimlik / Login Akışı)\\n- özel alan (Veri Ekleme Akışı)\\n- temizle\\n\\nLütfen bir işlem seçin (örn: "kimlik")' }
      ]);
    } else {
      this.consoleHistory.set([
        { type: 'system', text: 'Sistem hazır (Basit Mimari).\\n\\nKullanabileceğiniz İşlemler:\\n- genel mimari\\n- giriş yap\\n- profil düzenle\\n- temizle\\n\\nLütfen bir işlem seçin (örn: "genel mimari")' }
      ]);
    }
    this.activePrompt.set({ step: 'main', prefix: '>', placeholder: 'Komut yazın...' });
    this.pendingFlow = null;
    this.consoleInput = '';
    this.activeFlowId.set(null); // Akışı da sıfırla
    this.currentDataToken = '';
  }
`;

content = content.replace(/resetConsole\(\) \{[\s\S]*?this\.currentDataToken = '';\n  \}/, newResetConsole);

const newExecuteCommand = `
  executeCommand(command: string) {
    const cmd = command.trim();
    const prompt = this.activePrompt();
    
    if (prompt?.step === 'main' && !cmd) return;

    if (cmd) {
      this.consoleHistory.update(h => [...h, { type: 'user', text: cmd }]);
    } else {
      this.consoleHistory.update(h => [...h, { type: 'user', text: '<Enter>' }]);
    }

    if (prompt?.step === 'main') {
      const lowerCmd = cmd.toLowerCase();
      
      if (lowerCmd === 'clear' || lowerCmd === 'temizle' || lowerCmd === 'reset') {
        this.resetConsole();
        return; 
      }

      if (this.activeMode() === 'advanced') {
        if (lowerCmd.startsWith('kimlik') || lowerCmd.startsWith('login')) {
          this.executeFlowWithParam('login-flow', '');
        } else if (lowerCmd.startsWith('özel alan') || lowerCmd.startsWith('ozel alan') || lowerCmd.startsWith('veri ekle')) {
          this.executeFlowWithParam('crud-flow', '');
        } else {
          this.consoleHistory.update(h => [...h, { type: 'system', text: 'Geçersiz komut. Kullanabileceğiniz işlemler: "kimlik", "özel alan", "temizle"' }]);
        }
      } else {
        if (lowerCmd.startsWith('giriş yap') || lowerCmd.startsWith('giris yap')) {
          const param = cmd.replace(/^giri[sş][ -]yap/i, '').trim();
          if (param) {
            this.executeFlowWithParam('giris-yap', param);
          } else {
            this.pendingFlow = 'giris-yap';
            this.activePrompt.set({ step: 'input1', prefix: 'Kullanıcı Adınız:', placeholder: 'Örn: Saliha Çiçek' });
          }
        } else if (lowerCmd.startsWith('profil düzenle') || lowerCmd.startsWith('profil duzenle')) {
          const param = cmd.replace(/^profil[ -]d[uü]zenle/i, '').trim();
          if (param) {
            this.executeFlowWithParam('profil-duzenle', param);
          } else {
            this.pendingFlow = 'profil-duzenle';
            this.activePrompt.set({ step: 'input1', prefix: 'Yeni Ad Soyad:', placeholder: 'Örn: Ali Yılmaz' });
          }
        } else if (lowerCmd === 'genel mimari' || lowerCmd === 'genel-mimari') {
          this.executeFlowWithParam('genel-mimari', '');
        } else {
          this.consoleHistory.update(h => [...h, { type: 'system', text: 'Geçersiz komut. Kullanabileceğiniz işlemler: "genel mimari", "giriş yap", "profil düzenle", "temizle"' }]);
        }
      }
    } else if (prompt?.step === 'input1') {
      const finalParam = cmd || 'Kullanıcı';
      this.executeFlowWithParam(this.pendingFlow!, finalParam);
    }
    
    this.consoleInput = '';
  }
`;

content = content.replace(/executeCommand\(command: string\) \{[\s\S]*?this\.consoleInput = '';\n  \}/, newExecuteCommand);

const newSwitchModeMethod = `
  switchMode(mode: 'basic' | 'advanced') {
    this.activeMode.set(mode);
    this.svgLines.set([]);
    this.resetNodePositions();
    this.resetConsole();
  }
`;
content = content.replace(/switchMode\(mode: 'basic' \| 'advanced'\) \{[\s\S]*?this\.consoleHistory\.set\(\[\]\);\n  \}/, newSwitchModeMethod);

// Wait, let's also fix the startLearning method so it prints the initial console output properly.
const newStartLearning = `
  startLearning() {
    this.showWelcome.set(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    this.resetConsole();
  }
`;
content = content.replace(/startLearning\(\) \{[\s\S]*?window\.scrollTo\(\{ top: 0, behavior: 'smooth' \}\);\n  \}/, newStartLearning);

fs.writeFileSync('src/app/features/microservices-learning/microservices-learning.component.ts', content);
