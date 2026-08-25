import { Component, OnDestroy, AfterViewChecked, HostListener, signal, ElementRef, ViewChild, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DomSanitizer, SafeStyle } from '@angular/platform-browser';
import { NODE_DETAILS, NodeDetail } from '../architecture-schema/node-details.data';
import { MICROSERVICES_LAYERS, MICROSERVICES_FLOWS } from './data/microservices.data';
import { ADVANCED_LAYERS, ADVANCED_FLOWS } from './data/advanced-microservices.data';

export interface ChildNode {
  id: string;
  name: string;
  type: string;
  desc?: string;
  subName?: string;
  actionName?: string;
  isGroup?: boolean;
  expanded?: boolean;
  children?: ChildNode[];
}

export interface Layer {
  id: string;
  title: string;
  direction?: 'vertical' | 'horizontal';
  isTwoColumn?: boolean; 
  leftNodes?: ChildNode[]; 
  rightNodes?: ChildNode[]; 
  nodes?: ChildNode[]; 
}

export interface FlowStep {
  fromNodeId: string;
  toNodeId: string;
  label: string;
  subLabel?: string;
  dtoName?: string;
  isReturn?: boolean;
  isDefaultBackground?: boolean; 
  parallelNodeFrom?: string;
  parallelNodeTo?: string;
}

export interface FlowPath {
  id: string;
  name: string;
  steps: FlowStep[];
}

export interface SvgLine {
  id: string;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  midX: number; 
  labelX: number;
  labelY: number;
  labelAlign?: 'center' | 'left' | 'right';
  pathD?: string;
  tokenPathD?: string;
  label: string;
  subLabel?: string;
  dtoName?: string;
  active: boolean; 
  isReturn: boolean; 
  isDefaultBackground: boolean; 
  stepIndex: number;
  lineColor?: string;
  markerEnd?: string;
  parallelTokenPathD?: string;
}

@Component({
  selector: 'app-microservices-learning',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './microservices-learning.component.html',
  styleUrl: './microservices-learning.component.css'
})
export class MicroservicesLearningComponent implements OnDestroy, AfterViewChecked {
  svgWidth: number = 0;
  svgHeight: number = 0;
  @ViewChild('svgContainer') svgContainer!: ElementRef<SVGElement>;
  @ViewChild('consoleBody') consoleBody!: ElementRef<HTMLDivElement>;
  @ViewChild('inputRow') inputRow?: ElementRef<HTMLDivElement>;

  
  showInactiveNodes = signal(false);
  consoleInput = '';
  consoleHistory = signal<{ type: 'system' | 'user', text: string }[]>([
    { type: 'system', text: 'Sistem hazır.\n\nKullanabileceğiniz İşlemler (Komutlar):\n- genel mimari\n- giriş yap\n- profil düzenle\n\nLütfen bir komut giriniz (örn: "genel mimari")' }
  ]);
  activePrompt = signal<{ step: string, prefix: string, placeholder: string, action?: string } | null>({ step: 'main', prefix: '>', placeholder: 'Komut yazın...' });
  pendingFlow: string | null = null;

  showWelcome = signal(true);
  welcomeMessage = 'Mikroservis Öğrenme Merkezine Hoşgeldiniz!';
  
  activeFlowId = signal<string | null>(null);

  activeMode = signal<'basic'|'advanced'>('basic');
  layers = computed(() => this.activeMode() === 'advanced' ? ADVANCED_LAYERS : MICROSERVICES_LAYERS);
  flows = computed(() => this.activeMode() === 'advanced' ? ADVANCED_FLOWS : MICROSERVICES_FLOWS);
  activeFlowData = computed(() => this.flows().find(f => f.id === this.activeFlowId()) || null);

  @ViewChild('boardWrapper') boardWrapper!: ElementRef;
  
  selectedNode = signal<NodeDetail | null>(null);

  isPanelMinimized = signal(true);
  isDragging = false;
  panelLeft = 20;
  panelTop = 100;
  hasMoved = false;
  dragStartX = 0;
  dragStartY = 0;

  // YENİ: Token Animasyonu İçin Veri
  currentDataToken: string = '';
  currentDtoName = signal<string | null>(null);
  
  // YENİ: Token içindeki yazıları satırlara bölme
  currentDataTokenLines() {
    return (this.currentDataToken || 'Veri').split('\n');
  }
  
  getTokenLineCount() {
    return (this.currentDtoName() ? 1 : 0) + this.currentDataTokenLines().length;
  }
  
  getTokenRectHeight() {
    return this.getTokenLineCount() * 16 + 12;
  }
  
  getTokenRectY() {
    const count = this.getTokenLineCount();
    if (count === 1) return 30;
    if (count === 2) return 22;
    if (count === 3) return 14;
    return 10;
  }
  
  getTokenTextY() {
    const count = this.getTokenLineCount();
    if (count === 1) return 46;
    if (count === 2) return 42;
    if (count === 3) return 38;
    return 34;
  }

  positionTrackerInterval: any;
  private lastElementPositions = new Map<string, string>();

  draggingNodeId: string | null = null;
  hasNodeMoved = false;
  nodeOffsets = new Map<string, { x: number; y: number }>();

  @ViewChild('masterTokenAnimator') masterTokenAnimator?: ElementRef<SVGElement>;
  @ViewChild('parallelTokenAnimator') parallelTokenAnimator?: ElementRef<SVGElement>;

  constructor(private sanitizer: DomSanitizer) {}

  getSafeOffsetStyle(pathD: string): SafeStyle {
    return this.sanitizer.bypassSecurityTrustStyle(`offset-path: path('${pathD}');`);
  }

    activeTokenPathD(): string | null {
    if (this.isAnimationFinished()) return null;
    const lines = this.svgLines();
    const activeLine = lines.find(l => l.active && !l.isDefaultBackground && !l.parallelTokenPathD);
    return activeLine?.tokenPathD || null;
  }

  activeParallelTokenPathD(): string | null {
    if (this.isAnimationFinished()) return null;
    const flow = this.activeFlowData();
    if (!flow || flow.id !== 'genel-mimari-advanced') return null;
    
    const lines = this.svgLines();
    const parallelLine = lines.find(l => l.active && !l.isDefaultBackground && l.parallelTokenPathD);
    
    const idx = this.currentStepIndex();
    if (idx === 0 || idx === 5) return null;
    
    return parallelLine?.parallelTokenPathD || null;
  }

  ngOnInit() {
    this.startPositionTracker();
  }

  ngOnDestroy() {
    if (this.positionTrackerInterval) {
      clearInterval(this.positionTrackerInterval);
    }
    this.stopAnimation();
  }

  startLearning() {
    this.showWelcome.set(false);
    setTimeout(() => { this.scheduleRecalculation(); }, 100);
    // Öğrenmeye başla dendiğinde ekranın üst kısmının (mimarinin) görünmesi için scroll'u sıfırlıyoruz.
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  executeCommand(command: string) {
    const cmd = command.trim();
    const prompt = this.activePrompt();
    
    // Eğer main adımındaysa ve boş komut girildiyse işlem yapma
    if (prompt?.step === 'main' && !cmd) return;

    if (cmd) {
      this.consoleHistory.update(h => [...h, { type: 'user', text: cmd }]);
    } else {
      this.consoleHistory.update(h => [...h, { type: 'user', text: '<Enter>' }]);
    }

    if (prompt?.step === 'main') {
      const lowerCmd = cmd.toLowerCase();
      
      const isAdvanced = this.activeMode() === 'advanced';
      
      if (lowerCmd.startsWith('kayıt ol') || lowerCmd.startsWith('kayit ol') || lowerCmd.startsWith('kayit-ol')) {
        const param = cmd.replace(/^kay[ıi]t[ -]ol/i, '').trim();
        const targetFlow = isAdvanced ? 'register-flow' : 'genel-mimari';
        if (!isAdvanced) {
          this.consoleHistory.update(h => [...h, { type: 'system', text: 'Bu komut sadece Gelişmiş Mimari modunda geçerlidir.' }]);
          return;
        }
        if (param) {
          this.executeFlowWithParam(targetFlow, param);
        } else {
          this.pendingFlow = targetFlow;
          this.activePrompt.set({ step: 'input1', prefix: 'Kayıt Olacak Kullanıcı:', placeholder: 'Örn: Ayşe Yılmaz' });
        }
      } else if (lowerCmd.startsWith('giriş yap') || lowerCmd.startsWith('giris yap') || lowerCmd.startsWith('giris-yap')) {
        const param = cmd.replace(/^giri[sş][ -]yap/i, '').trim();
        const targetFlow = isAdvanced ? 'login-flow' : 'giris-yap';
        if (param) {
          this.executeFlowWithParam(targetFlow, param);
        } else {
          this.pendingFlow = targetFlow;
          this.activePrompt.set({ step: 'input1', prefix: 'Kullanıcı Adınız:', placeholder: 'Örn: Saliha Çiçek' });
        }
      } else if (lowerCmd.startsWith('profil düzenle') || lowerCmd.startsWith('profil duzenle') || lowerCmd.startsWith('profil-duzenle') || lowerCmd.startsWith('veri ekle') || lowerCmd.startsWith('crud işlemi yap') || lowerCmd.startsWith('crud islemi yap')) {
        const param = cmd.replace(/^(profil[ -]d[uü]zenle|veri[ -]ekle|crud i[şs]lemi yap)/i, '').trim();
        const targetFlow = isAdvanced ? 'crud-flow' : 'profil-duzenle';
        if (param) {
          this.executeFlowWithParam(targetFlow, param);
        } else {
          this.pendingFlow = targetFlow;
          this.activePrompt.set({ step: 'input1', prefix: isAdvanced ? 'Yapmak İstediğiniz İşlem:' : 'Yeni Ad Soyad:', placeholder: isAdvanced ? 'Örn: Veri Ekle, Veri Sil, Güncelle' : 'Örn: Ali Yılmaz' });
        }
      } else if (lowerCmd === 'genel mimari' || lowerCmd === 'genel-mimari') {
        const targetFlow = isAdvanced ? 'genel-mimari-advanced' : 'genel-mimari';
        this.executeFlowWithParam(targetFlow, '');
      } else if (lowerCmd === 'clear' || lowerCmd === 'temizle' || lowerCmd === 'reset') {
        this.resetConsole();
        return;
      } else {
        this.consoleHistory.update(h => [...h, { type: 'system', text: 'Geçersiz komut. Kullanabileceğiniz komutlar: "genel mimari", ' + (isAdvanced ? '"kayıt ol", ' : '') + '"giriş yap", ' + (isAdvanced ? '"crud işlemi yap"' : '"profil düzenle"') + ', "temizle"' }]);
      }
    } else if (prompt?.step === 'input1') {
      let finalParam = cmd;
      
      if (this.pendingFlow === 'crud-flow') {
         finalParam = finalParam || 'Veri Sil';
         this.activePrompt.set({
            step: 'input2',
            prefix: 'İşlem Yapılacak Veri:',
            placeholder: 'Örn: Rapor 1, Eski Kayıt',
            action: finalParam
         });
         this.consoleInput = '';
         this.scrollToBottom(); // scroll page to input
         return;
      } else if (this.pendingFlow === 'register-flow') {
         finalParam = finalParam || 'Saliha Çiçek';
         this.activePrompt.set({
            step: 'input2',
            prefix: 'Yaş:',
            placeholder: 'Örn: 18',
            action: finalParam
         });
         this.consoleInput = '';
         this.scrollToBottom(); // scroll page to input
         return;
      } else {
         finalParam = finalParam || 'Saliha Çiçek';
         this.executeFlowWithParam(this.pendingFlow!, finalParam);
      }
    } else if (prompt?.step === 'input2') {
      let finalData = cmd;
      
      if (this.pendingFlow === 'crud-flow') {
         finalData = finalData || 'Rapor 1';
         const combined = `${finalData} (${prompt.action})`;
         this.executeFlowWithParam(this.pendingFlow!, combined);
      } else if (this.pendingFlow === 'register-flow') {
         finalData = finalData || '18';
         const combined = `Ad: ${prompt.action}\nYaş: ${finalData}`;
         this.executeFlowWithParam(this.pendingFlow!, combined);
      }
    }
    
    this.consoleInput = '';
    this.scrollToBottom(); // scroll page to input
  }

  // YENİ: Hem input ile hem de direkt parametreli çalıştırma

  scrollToBottom(skipPageScroll: boolean = false) {
    setTimeout(() => {
      requestAnimationFrame(() => {
        if (this.consoleBody && this.consoleBody.nativeElement) {
        this.consoleBody.nativeElement.scrollTop = this.consoleBody.nativeElement.scrollHeight;
        }
        if (!skipPageScroll && this.inputRow && this.inputRow.nativeElement) {
          this.inputRow.nativeElement.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
      });
    }, 100);
  }

  executeFlowWithParam(flowId: string, param: string) {
    if (param) {
      this.consoleHistory.update(h => [...h, { type: 'system', text: `İsteğiniz sunucuya iletiliyor... [Veri: ${param}]` }]);
    } else {
      this.consoleHistory.update(h => [...h, { type: 'system', text: 'İsteğiniz sunucuya (API Gateway) iletiliyor...' }]);
    }
    
    this.activePrompt.set(null); // Input kutusunu gizle
    this.currentDataToken = param; // Token verisini kaydet
    
    this.selectFlow(flowId, true);
    this.pendingFlow = null;
    
    // Mimariyi izleyebilmesi için tam olarak şema tahtasına kaydır
    setTimeout(() => {
      const board = document.querySelector('.board-wrapper');
      if (board) {
        board.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);
  }

  // Animasyon bitince veya flow seçimi değişince terminali sıfırlamak için eklendi:
  
  switchMode(mode: 'basic' | 'advanced') {
    this.activeMode.set(mode);
    this.resetNodePositions();
    this.resetConsole();
  }

    resetConsole() {
    const isAdvanced = this.activeMode() === 'advanced';
    const commands = isAdvanced 
      ? '- genel mimari\n- kayıt ol\n- giriş yap\n- crud işlemi yap\n- temizle'
      : '- genel mimari\n- giriş yap\n- profil düzenle\n- temizle';
      
    this.consoleHistory.set([
      { type: 'system', text: 'Sistem hazır.\n\nKullanabileceğiniz İşlemler (Komutlar):\n' + commands + '\n\nLütfen bir komut giriniz (örn: "genel mimari")' }
    ]);
    this.activePrompt.set({ step: 'main', prefix: '>', placeholder: 'Komut yazın...' });
    this.pendingFlow = null;
    this.consoleInput = '';
    this.activeFlowId.set(null);
    this.scrollToBottom(true); // Akışı da sıfırla
    this.currentDataToken = '';
    this.currentDtoName.set(null);
    
    // DOM güncellendikten sonra (has-active-flow class'ı kalktıktan sonra)
    // okları yeniden hesapla ki kutular hareket ettiyse oklar da doğru yeri göstersin!
    setTimeout(() => {
      this.calculateSvgLines();
    }, 100);
  }

  startPositionTracker() {
    if (!this.positionTrackerInterval) {
      this.positionTrackerInterval = setInterval(() => {
         this.checkAndRecalculateIfMoved();
      }, 50);
    }
  }

  checkAndRecalculateIfMoved() {
    const flow = this.activeFlowData() || this.flows()[0];
    if (!flow) return;
    
    let moved = false;
    flow.steps.forEach(step => {
      [step.fromNodeId, step.toNodeId].forEach(id => {
        const el = document.getElementById(id);
        if (el) {
          const rect = el.getBoundingClientRect();
          const pos = `${Math.round(rect.left)},${Math.round(rect.top)}`;
          if (this.lastElementPositions.get(id) !== pos) {
            moved = true;
            this.lastElementPositions.set(id, pos);
          }
        }
      });
    });

    if (moved) {
      this.calculateSvgLines();
    }
  }

  currentStepIndex = signal<number>(-1);
  isAnimationFinished = signal<boolean>(false); 
  animationTimer: any;
  needsRecalculation = true; 

  svgLines = signal<SvgLine[]>([]);
  groupSvgLines = signal<{path: string}[]>([]); 

  // Yeni Panel Boyutlandırma Değişkenleri
  panelHeight = signal<number>(400); // Başlangıçta 400px
  isPanelResizing = false;
  panelDragStartY = 0;
  panelStartHeight = 0;

  @HostListener('window:resize')
  onResize() {
    this.scheduleRecalculation();
  }

  ngAfterViewChecked() {
    if (this.needsRecalculation) {
      this.calculateSvgLines();
      this.needsRecalculation = false;
    }
  }

  scheduleRecalculation() {
    this.needsRecalculation = true;
  }

  toggleGroup(node: ChildNode, event?: MouseEvent) {
    if (event) event.stopPropagation();
    if (node.isGroup) {
      node.expanded = !node.expanded;
      this.scheduleRecalculation();
    }
  }

  onBoxClick(node: any, event?: MouseEvent) {
    if (this.hasNodeMoved) return;
    
    // In learning center, clicks on boxes do nothing for flows, everything is via console
  }

  onBoardClick(event: MouseEvent) {
    // Eğer az önce bir kutu sürüklendiyse, bu tıklamayı yoksay (sürükleme bırakıldığı için tetiklenmiş)
    if (this.hasNodeMoved) {
      return;
    }

    const target = event.target as HTMLElement;
    
    if (!target.closest('.schema-box') && 
        !target.closest('.flow-legend-panel') && 
        !target.closest('.schema-toolbar')) {
      
      if (this.activeFlowId()) {
        if (this.showInactiveNodes()) {
          this.showInactiveNodes.set(false);
        } else {
          this.selectFlow(null);
        }
      }
    }
  }

  onFlowChange(event: Event) {
    const target = event.target as HTMLSelectElement;
    this.selectFlow(target.value);
  }

  selectFlow(flowId: string | null, forceRestart = false) {
    this.stopAnimation();
    this.isAnimationFinished.set(false);
    
    if (flowId === null || (!forceRestart && this.activeFlowId() === flowId)) {
      this.activeFlowId.set(null);
      this.currentStepIndex.set(-1);
      this.collapseAllGroups();
      this.resetNodePositions();
      // YENİ: Anasayfaya dönüldüğünde konsolu tekrar aktifleştir
      this.activePrompt.set({ step: 'main', prefix: '>', placeholder: 'Yeni komut yazın...' });
    } else if (flowId) {
      this.activeFlowId.set(flowId);
      this.showInactiveNodes.set(false);
      this.expandGroupsInFlow(flowId);
      
      setTimeout(() => {
        this.startAnimation();
      }, 100);
    } else {
      this.activeFlowId.set(null);
      this.currentStepIndex.set(-1);
      this.calculateSvgLines();
    }
  }

  getLayerOrder(layerId: string): number {
    if (this.activeFlowId() !== null) {
      if (layerId === 'backend-core') return 5;
      if (layerId === 'backend-data') return 4;
    }
    return 1;
  }


  toggleInactiveNodes() {
    this.showInactiveNodes.set(!this.showInactiveNodes());
    setTimeout(() => {
      this.calculateSvgLines();
    }, 50);
  }

  expandGroupsInFlow(flowId: string) {
    const flow = this.flows().find(f => f.id === flowId);
    if (!flow) return;

    const activeNodeIds = new Set<string>();
    flow.steps.forEach(s => {
      activeNodeIds.add(s.fromNodeId);
      activeNodeIds.add(s.toNodeId);
      if (s.parallelNodeFrom) activeNodeIds.add(s.parallelNodeFrom);
      if (s.parallelNodeTo) activeNodeIds.add(s.parallelNodeTo);
    });

    let changed = false;
    this.layers().forEach(layer => {
      // Normal nodes
      if (layer.nodes) {
        layer.nodes.forEach(node => {
          if (node.isGroup && node.children) {
            if (activeNodeIds.has(node.id) || node.children.some(c => activeNodeIds.has(c.id))) {
              if (!node.expanded) {
                node.expanded = true;
                changed = true;
              }
            }
          }
        });
      }
      
      // Left nodes
      if (layer.leftNodes) {
        layer.leftNodes.forEach(node => {
          if (node.isGroup && node.children) {
            if (activeNodeIds.has(node.id) || node.children.some(c => activeNodeIds.has(c.id))) {
              if (!node.expanded) {
                node.expanded = true;
                changed = true;
              }
            }
          }
        });
      }

      // Right nodes
      if (layer.rightNodes) {
        layer.rightNodes.forEach(node => {
          if (node.isGroup && node.children) {
            if (activeNodeIds.has(node.id) || node.children.some(c => activeNodeIds.has(c.id))) {
              if (!node.expanded) {
                node.expanded = true;
                changed = true;
              }
            }
          }
        });
      }
    });

    if (changed) {
      this.scheduleRecalculation();
    }
  }

  // YENİ: Seçim iptal edildiğinde (tüm mimari gösterildiğinde) ekranın düzenli durması için tüm grupları kapatır.
  collapseAllGroups() {
    let changed = false;
    this.layers().forEach(layer => {
      const lists = [layer.nodes, layer.leftNodes, layer.rightNodes];
      lists.forEach(nodeList => {
        if (nodeList) {
          nodeList.forEach(node => {
            if (node.isGroup && node.expanded) {
              node.expanded = false;
              changed = true;
            }
          });
        }
      });
    });
    
    if (changed) {
      this.scheduleRecalculation();
    }
  }

  startAnimation() {
    this.stopAnimation();
    this.currentStepIndex.set(0); 
    this.isAnimationFinished.set(false);
    this.calculateSvgLines(); 
    this.scrollToCurrentStep();

    // YENİ: İlk adımın animasyonunu (Frontend'den çıkan ok) anında başlat
    setTimeout(() => {
      if (this.masterTokenAnimator?.nativeElement) {
        (this.masterTokenAnimator.nativeElement as any).beginElement();
      }
      if (this.parallelTokenAnimator?.nativeElement && this.activeParallelTokenPathD()) {
        (this.parallelTokenAnimator.nativeElement as any).beginElement();
      }
    }, 50);

    const flow = this.activeFlowData();
    if (!flow) return;

    this.animationTimer = setInterval(() => {
      let nextIndex = this.currentStepIndex() + 1;
      if (nextIndex >= flow.steps.length) {
        this.stopAnimation();
        this.isAnimationFinished.set(true);
        this.consoleHistory.update(h => [...h, { type: 'system', text: 'İşlem başarıyla tamamlandı!' }]);
        this.scrollToBottom(true);
        // Zamanlayıcı kaldırıldı, akış ekranda kalmaya devam edecek, fakat kullanıcı yeni komut girebilsin diye prompt'u açıyoruz:
        this.activePrompt.set({ step: 'main', prefix: '>', placeholder: 'Yeni komut yazın...' });
      } else {
        this.currentStepIndex.set(nextIndex);
        this.scrollToCurrentStep();
      }
      this.calculateSvgLines();
      
      // YENİ: AnimateMotion elementini yeniden başlat (path değiştikten sonra animasyonun oynaması için zorunlu)
      setTimeout(() => {
        if (this.masterTokenAnimator?.nativeElement) {
          (this.masterTokenAnimator.nativeElement as any).beginElement();
        }
        if (this.parallelTokenAnimator?.nativeElement && this.activeParallelTokenPathD()) {
          (this.parallelTokenAnimator.nativeElement as any).beginElement();
        }
      }, 50);

    }, 4000); // Her adım 4 saniye ekranda kalsın
  }

  onAnimationEnd(stepIndex: number) {
    const flow = this.activeFlowData();
    if (!flow) return;
    
    // stepIndex is 1-based (i + 1)
    if (stepIndex === flow.steps.length) {
      this.isAnimationFinished.set(true);
    } else {
      if (this.currentStepIndex() < stepIndex) {
        this.currentStepIndex.set(stepIndex);
        this.calculateSvgLines();
        this.scrollToCurrentStep();
      }
    }
  }

  // YENİ: Okun kutunun içinden geçmesini engellemek için kesişim (Intersection) noktası hesaplama


  smoothScrollTo(element: HTMLElement, container: HTMLElement, duration: number) {
    const startLeft = container.scrollLeft;
    const startTop = container.scrollTop;
    
    const elRect = element.getBoundingClientRect();
    const contRect = container.getBoundingClientRect();
    
    const targetLeft = startLeft + (elRect.left - contRect.left) - (contRect.width / 2) + (elRect.width / 2);
    const targetTop = startTop + (elRect.top - contRect.top) - (contRect.height / 2) + (elRect.height / 2);

    const startTime = performance.now();

    const animateScroll = (currentTime: number) => {
      const elapsedTime = currentTime - startTime;
      const progress = Math.min(elapsedTime / duration, 1);
      
      // Yumuşak İvmelenme ve Yavaşlama (Ease-in-out Cubic)
      const easeInOutCubic = progress < 0.5 
        ? 4 * progress * progress * progress 
        : 1 - Math.pow(-2 * progress + 2, 3) / 2;

      container.scrollLeft = startLeft + (targetLeft - startLeft) * easeInOutCubic;
      container.scrollTop = startTop + (targetTop - startTop) * easeInOutCubic;

      if (progress < 1) {
        requestAnimationFrame(animateScroll);
      }
    };

    requestAnimationFrame(animateScroll);
  }

  scrollToCurrentStep() {
    const flowId = this.activeFlowId();
    if (!flowId || !this.boardWrapper) return;

    const flow = this.flows().find(f => f.id === flowId);
    if (!flow) return;

    const currentIndex = this.currentStepIndex();
    if (currentIndex >= 0 && currentIndex < flow.steps.length) {
      const step = flow.steps[currentIndex];
      const targetEl = document.getElementById(step.toNodeId);
      
      if (targetEl && this.boardWrapper.nativeElement) {
        // YENİ: Tarayıcının ani zıplaması yerine daha hızlı bir sinematik kaydırma
        this.smoothScrollTo(targetEl, this.boardWrapper.nativeElement, 600);
      }
    }
  }

  stopAnimation() {
    if (this.animationTimer) {
      clearInterval(this.animationTimer);
      this.animationTimer = null;
    }
  }

  isNodeInFlow(nodeId: string): boolean {
    const flowId = this.activeFlowId();
    if (!flowId) return true; 
    const flow = this.flows().find(f => f.id === flowId);
    if (!flow) return true;
    return flow.steps.some(s => s.fromNodeId === nodeId || s.toNodeId === nodeId || s.parallelNodeFrom === nodeId || s.parallelNodeTo === nodeId);
  }

  isNodeHighlighted(nodeId: string): boolean {
    const flowId = this.activeFlowId();
    if (!flowId) return false;
    if (this.isAnimationFinished()) return this.isNodeInFlow(nodeId);
    
    const flow = this.flows().find(f => f.id === flowId);
    if (!flow) return false;
    
    const currentIndex = this.currentStepIndex();
    if (currentIndex === -1) return false;
    
    const step = flow.steps[currentIndex];
    return step.fromNodeId === nodeId || step.toNodeId === nodeId || step.parallelNodeFrom === nodeId || step.parallelNodeTo === nodeId;
  }

  openNodeDetails(nodeId: string) {
    const detail = NODE_DETAILS[nodeId];
    if (detail) {
      this.selectedNode.set(detail);
    } else {
      this.selectedNode.set({
        id: nodeId,
        title: nodeId,
        description: 'Bu sınıf veya modül için henüz detaylı bir dokümantasyon eklenmemiştir.',
      });
    }
  }

  // --- DRAGGABLE PANEL METOTLARI ---
  
  onPanelMouseDown(event: MouseEvent) {
    const target = event.target as HTMLElement;
    if (target.tagName === 'BUTTON' || target.closest('button')) return; 
    
    this.isDragging = true;
    this.dragStartX = event.clientX;
    this.dragStartY = event.clientY;
    
    const panel = document.querySelector('.flow-legend-panel') as HTMLElement;
    if (!this.hasMoved && panel) {
       const rect = panel.getBoundingClientRect();
       this.panelLeft = rect.left;
       this.panelTop = rect.top;
       this.hasMoved = true;
    }
    event.preventDefault(); 
  }

  @HostListener('document:mousemove', ['$event'])
  onPanelMouseMove(event: MouseEvent) {
    if (this.isDragging) {
      const dx = event.clientX - this.dragStartX;
      const dy = event.clientY - this.dragStartY;
      
      this.panelLeft += dx;
      this.panelTop += dy;
      
      this.dragStartX = event.clientX;
      this.dragStartY = event.clientY;
    } else if (this.draggingNodeId) {
      const dx = event.clientX - this.dragStartX;
      const dy = event.clientY - this.dragStartY;

      if (Math.abs(dx) > 2 || Math.abs(dy) > 2) {
        this.hasNodeMoved = true;
      }

      const currentOffset = this.nodeOffsets.get(this.draggingNodeId) || { x: 0, y: 0 };
      this.nodeOffsets.set(this.draggingNodeId, {
        x: currentOffset.x + dx,
        y: currentOffset.y + dy
      });

      this.dragStartX = event.clientX;
      this.dragStartY = event.clientY;
    }
  }

  @HostListener('document:mouseup')
  onPanelMouseUp() {
    if (this.draggingNodeId) {
      this.resolveCollisions(this.draggingNodeId);
    }
    
    this.isDragging = false;
    this.draggingNodeId = null;
    
    // Çizgileri yeniden hesapla
    setTimeout(() => {
      this.calculateSvgLines();
    }, 10);
    
    // Tıklama (click) eventi mouseup'tan hemen sonra tetiklenir. 
    // click event'inin hasNodeMoved durumunu doğru okuyabilmesi için sıfırlamayı kısa bir süre geciktiriyoruz.
    setTimeout(() => {
      this.hasNodeMoved = false;
    }, 50);
  }

  @HostListener('document:keydown.escape')
  onEscape() {
    // ESC tuşuna basıldığında konsolu ve akışı sıfırla
    this.resetConsole();
    this.consoleHistory.update(h => [...h, { type: 'system', text: '>>> SİSTEM SIFIRLANDI (ESC) <<<' }]);
    this.scrollToBottom(true);
  }

  // YENİ: Çarpışma (Collision) Çözümleme - Blokların üst üste binmesini engeller
  resolveCollisions(movedNodeId: string) {
    const movedEl = document.getElementById(movedNodeId);
    if (!movedEl) return;
    
    const movedRect = movedEl.getBoundingClientRect();
    const margin = 30; // 30px güvenlik mesafesi

    // Tüm kutuları bul (sadece mimari ekranda olanlar)
    const boxes = document.querySelectorAll('.architecture-container .schema-box');
    
    let collisionDetected = false;

    boxes.forEach((el) => {
      const targetId = el.id;
      if (!targetId || targetId === movedNodeId) return;
      
      const targetRect = el.getBoundingClientRect();
      
      // Çarpışma var mı?
      const isOverlapping = !(
        movedRect.right + margin < targetRect.left || 
        movedRect.left - margin > targetRect.right || 
        movedRect.bottom + margin < targetRect.top || 
        movedRect.top - margin > targetRect.bottom
      );
      
      if (isOverlapping) {
        collisionDetected = true;
        
        let pushDistance = 0;
        // Eğer sürüklenen kutu hedefin merkezinden daha yukarıdaysa, hedefi aşağı it.
        const movedCenterY = movedRect.top + (movedRect.height / 2);
        const targetCenterY = targetRect.top + (targetRect.height / 2);

        if (movedCenterY < targetCenterY) {
           pushDistance = (movedRect.bottom + margin) - targetRect.top;
        } else {
           pushDistance = (movedRect.top - margin) - targetRect.bottom; // negatif (yukarı iter)
        }
        
        // Hedef kutuyu it (offset güncelle)
        const targetOffset = this.nodeOffsets.get(targetId) || { x: 0, y: 0 };
        this.nodeOffsets.set(targetId, {
          x: targetOffset.x,
          y: targetOffset.y + pushDistance
        });
        
        // Zincirleme (cascading) itme etkisi: İtilen kutunun başka bir kutuyla çarpışmasını önler.
        // DOM'un güncellenmesi için 50ms bekleyip yeni pozisyonla tekrar çarpışma testi yapıyoruz.
        setTimeout(() => this.resolveCollisions(targetId), 50);
      }
    });

    if (collisionDetected) {
      // Çarpışma çözüldüğü için yeni koordinatlarla tekrar SVG'yi hesapla
      setTimeout(() => this.calculateSvgLines(), 50);
    }
  }

  // YENİ: Kutuları sürüklemek için
  onNodeDragStart(event: MouseEvent, nodeId: string) {
    // Tıklamaların doğru algılanması için her yeni mousedown'da bunu sıfırla
    this.hasNodeMoved = false;

    if ((event.target as HTMLElement).tagName === 'BUTTON') return;
    if ((event.target as HTMLElement).classList.contains('group-icon')) return; // Grup iconunu es geç
    
    // Yalnızca sol tık ile sürükleme
    if (event.button !== 0) return;

    // Akış (flow) seçili değilse (yani genel görünümdeysek) sürüklemeyi engelle
    if (!this.activeFlowId()) return;

    // Pasif (görünür ama akışa dahil olmayan) kutuların sürüklenmesini engelle
    if (!this.isNodeInFlow(nodeId)) return;
    
    // Metin seçimi vb engelleme (istemiyorsan silebilirsin ama sürüklerken faydalı)
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
    
    this.draggingNodeId = nodeId;
    this.dragStartX = event.clientX;
    this.dragStartY = event.clientY;
  }

  getNodeTransform(nodeId: string): string {
    const offset = this.nodeOffsets.get(nodeId);
    if (!offset) return 'translate(0px, 0px)';
    return `translate(${offset.x}px, ${offset.y}px)`;
  }

  hasAnyNodeMoved(): boolean {
    return this.nodeOffsets.size > 0;
  }

  resetNodePositions() {
    this.nodeOffsets.clear();
    
    // Kutuların inline olarak atanmış yüksekliklerini (minHeight) temizle
    const wrapper = this.boardWrapper.nativeElement;
    const allBoxes = wrapper.querySelectorAll('.schema-box');
    allBoxes.forEach((box: Element) => {
      (box as HTMLElement).style.minHeight = '';
    });

    setTimeout(() => this.calculateSvgLines(), 100);
  }

  togglePanelMinimize(event: Event) {
    event.stopPropagation();
    const isMinimized = this.isPanelMinimized();
    
    if (isMinimized) {
      // Kapalıyken açılıyorsa (üçgene tıklandığında) varsayılan boyuta (yaklaşık 5 öğe) dön
      this.panelHeight.set(380); // 380px yaklaşık 5-6 adım eder
      
      // Eğer panel yukarıdaysa (hasMoved) top'ını da düzeltmemiz gerekebilir ama 
      // toggle yaparken top sabit kalır, aşağı doğru açılır. 
      // Ancak kullanıcı tıklamayla açtığında taşmışsa diye kontrol edilebilir.
    }
    
    this.isPanelMinimized.set(!isMinimized);
  }

  onLegendHeaderMouseDown(event: MouseEvent) {
    const target = event.target as HTMLElement;
    if (target.classList.contains('close-btn') || target.closest('.close-btn')) return;
    
    event.preventDefault();
    this.isPanelResizing = false;
    this.panelDragStartY = event.clientY;
    
    const panel = document.querySelector('.flow-legend-panel') as HTMLElement;
    if (!panel) return;
    this.panelStartHeight = panel.getBoundingClientRect().height;
    
    // YENİ: Sürükleme başladığındaki top pozisyonunu sakla
    const startTop = this.panelTop;

    const mouseMoveHandler = (e: MouseEvent) => {
      // dy = startY - currentY. Aşağı çekince currentY büyür, dy negatif olur.
      const dy = this.panelDragStartY - e.clientY; 
      
      if (Math.abs(dy) > 3) {
        this.isPanelResizing = true;
        
        // Kullanıcı aşağı çektiğinde (dy negatif) panelin BÜYÜMESİNİ (aşağı doğru genişlemesini) istiyor.
        // O yüzden panelStartHeight - dy yapıyoruz. 
        let newHeight = this.panelStartHeight - dy;
        
        if (newHeight < 60) {
          newHeight = 60;
        }
        if (newHeight > window.innerHeight * 0.9) {
          newHeight = window.innerHeight * 0.9;
        }
        
        this.panelHeight.set(newHeight);
        
        // Eğer panel minimize ise ve boyutu artırılıyorsa, açık duruma getir
        if (this.isPanelMinimized() && newHeight > 100) {
          this.isPanelMinimized.set(false);
        }
      }
    };

    const mouseUpHandler = (e: MouseEvent) => {
      document.removeEventListener('mousemove', mouseMoveHandler);
      document.removeEventListener('mouseup', mouseUpHandler);
      
      if (!this.isPanelResizing) {
        // Tıklama olarak algıla ve minimize/maximize yap
        this.togglePanelMinimize(e);
      }
    };

    document.addEventListener('mousemove', mouseMoveHandler);
    document.addEventListener('mouseup', mouseUpHandler);
  }

  closeNodeDetails() {
    this.selectedNode.set(null);
  }

  // YENİ: Oklar için benzersiz renk paleti
  private getLineColor(stepIndex: number): string {
    const colors = [
      '#3b82f6', // Mavi
      '#ef4444', // Kırmızı
      '#10b981', // Yeşil
      '#f97316', // Turuncu
      '#8b5cf6', // Mor
      '#06b6d4', // Camgöbeği
      '#ec4899', // Pembe
      '#eab308', // Sarı
      '#6366f1', // İndigo
      '#14b8a6'  // Turkuaz
    ];
    return colors[stepIndex % colors.length];
  }

  private calculateSvgLines() {
    if (!this.boardWrapper?.nativeElement) return;
    
    let activeFlow = this.activeFlowData();
    
    // YENİ: DTO Adını Animasyon Token'ına Aktarma
    if (activeFlow && this.currentStepIndex() >= 0 && this.currentStepIndex() < activeFlow.steps.length) {
      this.currentDtoName.set((activeFlow.steps[this.currentStepIndex()] as any).dtoName || null);
    } else {
      this.currentDtoName.set(null);
    }
    
    // Aktif akışa ait svgLines nesnelerini oluştur (Eskiden hep 10 taneydi, şimdi dinamik)

    const numberOfSteps = activeFlow ? activeFlow.steps.length : 10;
    
    // Eski ok sayısıyla eşleşmiyorsa okları yeniden oluştur (Eğer 8 adımsa 8 ok oluştur vs.)
    if (this.svgLines().length !== numberOfSteps) {
      this.svgLines.set(Array.from({length: numberOfSteps}, (_, i) => ({
        id: String(i + 1),
        x1: 0, y1: 0, x2: 0, y2: 0, midX: 0,
        pathD: '',
        stepIndex: i + 1,
        active: false,
        label: '',
        isReturn: false,
        labelX: 0,
        labelY: 0,
        lineColor: this.getLineColor(i),
        markerEnd: `arrowhead-${this.getLineColor(i).replace('#', '')}`,
        isDefaultBackground: false
      })));
    }
    
    if (!this.boardWrapper) return;
        const wrapper = this.boardWrapper.nativeElement;
    
    // YENİ ÇÖZÜM: SVG overlay, genişliğiyle kutuyu esnetmesin diye ölçümden önce sıfırlıyoruz.
    const svgOverlay = wrapper.querySelector('.schema-svg-overlay');
    if (svgOverlay) {
       svgOverlay.style.width = '100%';
       svgOverlay.style.height = '100%';
    }
    
    this.svgWidth = wrapper.scrollWidth;
    this.svgHeight = wrapper.scrollHeight;
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

    const bgFlow = this.flows()[0];
    let isDrawingBackground = false;

    if (!activeFlow) {
      if (bgFlow) {
        activeFlow = bgFlow;
        isDrawingBackground = true;
      } else {
        this.svgLines.set([]);
        this.groupSvgLines.set([]);
        return;
      }
    }
    
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

    // 2. Global sınırlar
    let globalTop = 99999;
    let globalBottom = 0;
    let globalLeft = 99999;
    let globalRight = 0;
    
    allBoxes.forEach(box => {
      if (box.top < globalTop) globalTop = box.top;
      if (box.bottom > globalBottom) globalBottom = box.bottom;
      if (box.left < globalLeft) globalLeft = box.left;
      if (box.right > globalRight) globalRight = box.right;
    });

    // 3. Kenar Kullanım Sayımlarını Belirle (Okların üst üste binmesini engeller)
    const edgeConnections = new Map<string, { id: number, type: 'from'|'to', oppositeY: number }[]>();
    const stepEdges = new Map<number, { fromEdge: 'left'|'right', toEdge: 'left'|'right' }>();

    interface DrawRoute {
      fromNodeId: string;
      toNodeId: string;
      label: string;
      isReturn: boolean;
      originalIndex: number;
      isParallel: boolean;
    }
    
    const drawRoutes: DrawRoute[] = [];
    activeFlow.steps.forEach((step, i) => {
      drawRoutes.push({
         fromNodeId: step.fromNodeId,
         toNodeId: step.toNodeId,
         label: step.label,
         isReturn: step.isReturn || false,
         originalIndex: i,
         isParallel: false
      });
      if (activeFlow.id === 'genel-mimari-advanced' && i >= 1 && i <= 4) {
         let pFromId = ''; let pToId = ''; let pLabel = '';
         if (i === 1) { pFromId = 'gateway-node'; pToId = 'crud-service'; pLabel = 'Özel Alana Yönlendirme'; }
         if (i === 2) { pFromId = 'crud-service'; pToId = 'crud-db'; pLabel = 'Özel Alan DB İşlemi'; }
         if (i === 3) { pFromId = 'crud-db'; pToId = 'crud-service'; pLabel = 'Özel Alan Dönüşü'; }
         if (i === 4) { pFromId = 'crud-service'; pToId = 'gateway-node'; pLabel = 'Özel Alan Sonucu'; }
         
         drawRoutes.push({
            fromNodeId: pFromId,
            toNodeId: pToId,
            label: pLabel,
            isReturn: (i === 3 || i === 4),
            originalIndex: i,
            isParallel: true
         });
      }
    });

    drawRoutes.forEach((step, loopIndex) => {
      const i = step.originalIndex;
      const elFrom = document.getElementById(step.fromNodeId);
      const elTo = document.getElementById(step.toNodeId);
      if (!elFrom || !elTo) return;

      const from = getOffset(elFrom);
      const to = getOffset(elTo);
      const dx = to.centerX - from.centerX;
      const dy = to.centerY - from.centerY;
      
      const isSameColumn = Math.abs(dx) < 200;
      const isAdjacent = !isSameColumn;
      const isReturn = step.isReturn || false;
      const goingRight = dx > 0;

      let fromEdge: 'left' | 'right' = 'right';
      let toEdge: 'left' | 'right' = 'left';

      if (isSameColumn) {
        if (isReturn) {
          fromEdge = 'left';
          toEdge = 'left';
        } else {
          fromEdge = 'right';
          toEdge = 'right';
        }
      } else if (isAdjacent && Math.abs(dy) < 150) {
        fromEdge = goingRight ? 'right' : 'left';
        toEdge = goingRight ? 'left' : 'right';
      } else {
        fromEdge = goingRight ? 'right' : 'left';
        toEdge = goingRight ? 'left' : 'right';
      }

      stepEdges.set(loopIndex, { fromEdge, toEdge });

      const fromKey = `${step.fromNodeId}-${fromEdge}`;
      const toKey = `${step.toNodeId}-${toEdge}`;
      
      if (!edgeConnections.has(fromKey)) edgeConnections.set(fromKey, []);
      edgeConnections.get(fromKey)!.push({ id: loopIndex, type: 'from', oppositeY: to.centerY });

      if (!edgeConnections.has(toKey)) edgeConnections.set(toKey, []);
      edgeConnections.get(toKey)!.push({ id: loopIndex, type: 'to', oppositeY: from.centerY });
    });

    // Düğümleri (çizgilerin sırasını) karşı taraftaki kutunun Y koordinatına göre sırala ki oklar çapraz kesişmesin!
    edgeConnections.forEach((connections) => {
      connections.sort((a, b) => a.oppositeY - b.oppositeY);
    });

    // 4. Kutu Boylarını (min-height) Kenardaki Gerçek Ok Sayısına Göre Büyüt
    // Bu sayede oklar hiçbir zaman kutunun dışına (havaya) taşmaz!
    allBoxEls.forEach((el: Element) => {
      const htmlEl = el as HTMLElement;
      const id = htmlEl.id;
      if (id) {
        const leftTotal = edgeConnections.get(`${id}-left`)?.length || 0;
        const rightTotal = edgeConnections.get(`${id}-right`)?.length || 0;
        const maxConns = Math.max(leftTotal, rightTotal);
        // Her bağlantı 36px mesafe gerektirir
        const reqHeight = Math.max(60, maxConns * 36 + 20); 
        htmlEl.style.minHeight = `${reqHeight}px`;
      }
    });

    // 5. Boylar olası bir şekilde büyüdüğü için koordinatları TAZELİYORUZ
    allBoxes.length = 0;
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

    // Global sınırları tekrar hesapla
    globalTop = 99999;
    globalBottom = 0;
    globalLeft = 99999;
    globalRight = 0;
    
    allBoxes.forEach(box => {
      if (box.top < globalTop) globalTop = box.top;
      if (box.bottom > globalBottom) globalBottom = box.bottom;
      if (box.left < globalLeft) globalLeft = box.left;
      if (box.right > globalRight) globalRight = box.right;
    });

    const pairCount = new Map<string, number>();

    const newLines: SvgLine[] = [];
    
    // Global yatay koridor kullanım sayaçları (üst üste binmeyi engeller)
    let topCorridorCount = 0;
    let bottomCorridorCount = 0;

    drawRoutes.forEach((step, loopIndex) => {
      const i = step.originalIndex;
      const edges = stepEdges.get(loopIndex);
      if (!edges) return;

      const elFrom = document.getElementById(step.fromNodeId);
      const elTo = document.getElementById(step.toNodeId);

      if (!elFrom || !elTo) return;

      const from = getOffset(elFrom);
      const to = getOffset(elTo);

      const fromKey = `${step.fromNodeId}-${edges.fromEdge}`;
      const toKey = `${step.toNodeId}-${edges.toEdge}`;
      
      const fromList = edgeConnections.get(fromKey) || [];
      const fromIdx = fromList.findIndex(c => c.id === loopIndex && c.type === 'from') + 1 || 1;
      const fromTotal = fromList.length || 1;

      const toList = edgeConnections.get(toKey) || [];
      const toIdx = toList.findIndex(c => c.id === loopIndex && c.type === 'to') + 1 || 1;
      const toTotal = toList.length || 1;

      const pairKey = `${step.fromNodeId}>${step.toNodeId}`;
      const pairIdx = (pairCount.get(pairKey) || 0);
      pairCount.set(pairKey, pairIdx + 1);

      // Jitter: aynı çiftten giden çoklu okları birbirinden ayır
      const jitter = pairIdx * 20;

      // Kutunun KENARINDAKİ bağlantı noktalarını SABİT aralıklarla dağıt (Yatay çizgilerin ve ok uçlarının üst üste binmesini tamamen engeller!)
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

      let x1: number, y1: number, x2: number, y2: number;
      let pathD: string;
      let labelX: number, labelY: number;
      let labelAlign: 'center' | 'left' | 'right' = 'center';

      // Aynı kutu kontrolü
      const sameBox = Math.abs(dx) < 10 && Math.abs(dy) < 10;
      if (sameBox) return;

      if (activeFlow.id === 'register-flow' && loopIndex === 8) {
         // Step 9 (Identity -> Gateway): Ekran boyutuna göre duyarlı çizim
         const dx9 = to.centerX - from.centerX;
         const isSameCol9 = Math.abs(dx9) < 200;
         
         if (isSameCol9) {
            // Alt alta iseler (mobil/küçük ekran wrap durumu): Aşağıdan yukarıya düz dikey çizgi
            x1 = from.centerX;
            y1 = from.top - 5;
            x2 = to.centerX;
            y2 = to.bottom + 15; // Ok ucu Gateway'in altında tam görünsün
            
            pathD = `M ${x1} ${y1} L ${x2} ${y2}`;
            labelX = x1 + 20; // Çizginin sağ tarafı
            labelY = ((y1 + y2) / 2) - 45; // Step 2 (kırmızı) ile çakışmayı önlemek için yukarı
            labelAlign = 'left'; // Sola hizalı ki metin sağa doğru aksın
         } else {
            // Yan yana iseler (geniş ekran)
            x1 = from.left;
            y1 = from.centerY + 20; 
            x2 = to.right + 10; 
            y2 = to.centerY + 20; 
            
            let customMidX = (x1 + x2) / 2;
            pathD = `M ${x1} ${y1} L ${customMidX} ${y1} L ${customMidX} ${y2} L ${x2} ${y2}`;
            labelX = customMidX;
            labelY = ((y1 + y2) / 2) - 15;
            labelAlign = 'center';
         }
      } else {

      // ── ORTOGONAL (GUTTER) ROUTING ALGORİTMASI ──
      // Kutu içinden geçmeleri %100 engellemek için sadece YAN kenarları kullanıyoruz.

      const isSameColumn = Math.abs(dx) < 200;
      const isAdjacent = !isSameColumn;
      const isReturn = step.isReturn || false;

      if (isDrawingBackground) {
        // ARKA PLAN (Genel Mimari): Her zaman dümdüz çizgiler (yataysa yatay, eğikse çapraz)
        // Kesişmeyi ve uçların birbirine girmesini önlemek için:
        // 1. "fixedY1" ve "fixedY2" kullanarak Kimlik ve Özel Alan bağlantılarını Gateway'in üst ve alt kısımlarına dağıtıyoruz.
        // 2. Gidiş ve dönüş çizgilerini birbirinden ayırmak için (yOffset) uyguluyoruz.
        
        // Kullanıcının çizdiği okları tam olarak kopyalamak ve ok başlarının çakışmasını
        // %100 önlemek için manuel, paralel ve eşit aralıklı koordinatlar kullanıyoruz.
        
        let yOffset1 = 0;
        let yOffset2 = 0;

        const isTargetAbove = goingRight ? (to.centerY < from.centerY - 20) : (from.centerY < to.centerY - 20);
        const isTargetBelow = goingRight ? (to.centerY > from.centerY + 20) : (from.centerY > to.centerY + 20);

        if (isTargetAbove) {
            // Gateway <-> Kimlik
            if (goingRight) {
                // Gateway -> Kimlik
                yOffset1 = -10; // Gateway'in hafif üstünden çık
                yOffset2 = 10;  // Kimlik'in hafif altından gir
            } else {
                // Kimlik -> Gateway
                yOffset1 = -10; // Kimlik'in hafif üstünden çık
                yOffset2 = -30; // Gateway'in en üstünden gir
            }
        } else if (isTargetBelow) {
            // Gateway <-> Özel Alan
            if (goingRight) {
                // Gateway -> Özel Alan
                yOffset1 = 10;  // Gateway'in hafif altından çık
                yOffset2 = -10; // Özel Alan'ın hafif üstünden gir
            } else {
                // Özel Alan -> Gateway
                yOffset1 = 10;  // Özel Alan'ın hafif altından çık
                yOffset2 = 30;  // Gateway'in en altından gir
            }
        } else {
            // Yatay çizgiler (Gateway <-> Client, Kimlik <-> Kimlik DB vb.)
            yOffset1 = goingRight ? -12 : 12;
            yOffset2 = goingRight ? -12 : 12;
        }

        x1 = goingRight ? from.right : from.left;
        y1 = from.centerY + yOffset1;
        x2 = goingRight ? to.left : to.right;
        y2 = to.centerY + yOffset2;
        
        pathD = `M ${x1} ${y1} L ${x2} ${y2}`;
        labelX = (x1 + x2) / 2;
        labelY = (y1 + y2) / 2;
        labelAlign = 'center';
      } else {
        // AKTİF AKIŞ YOL HARİTASI (Asla Bozulmamalı)
        // 1. Aynı Kolon veya Alt Alta (dx küçük)
        if (isSameColumn) {
          if (isReturn) {
            // Sol taraftan bracket ([) çiz
            x1 = from.left;
            y1 = fixedY1;
            x2 = to.left;
            y2 = fixedY2;
            
            let corridorOffset = (loopIndex % 6) * 16;
            let gutterX = Math.min(from.left, to.left) - 40 - corridorOffset;
            
            if (activeFlow.id === 'genel-mimari-advanced' && step.isParallel) {
               gutterX -= 30; // Paralel geri dönüş okunu biraz daha sola it
            }
            
            pathD = `M ${x1} ${y1} L ${gutterX} ${y1} L ${gutterX} ${y2} L ${x2} ${y2}`;
            labelX = gutterX;
            labelY = (y1 + y2) / 2;
            labelAlign = 'right';
          } else {
            // Sağ taraftan bracket (]) çiz
            x1 = from.right;
            y1 = fixedY1;
            x2 = to.right;
            y2 = fixedY2;
            
            let corridorOffset = (loopIndex % 6) * 16;
            let gutterX = Math.max(from.right, to.right) + 40 + corridorOffset;
            
            pathD = `M ${x1} ${y1} L ${gutterX} ${y1} L ${gutterX} ${y2} L ${x2} ${y2}`;
            labelX = gutterX;
            labelY = (y1 + y2) / 2;
            labelAlign = 'left';
          }
  
        // 1. Uzak Sütun Atlamaları (Geri Dönüşler - Gateway atlama vb.)
        } else if (Math.abs(dx) > 400 && isReturn && from.left > to.right) {
          x1 = from.left;
          y1 = fixedY1;
          x2 = to.right;
          y2 = fixedY2;
          
          let bottomY = Math.max(from.bottom, to.bottom) + 40;
          pathD = `M ${x1} ${y1} L ${x1 - 30} ${y1} L ${x1 - 30} ${bottomY} L ${x2 + 30} ${bottomY} L ${x2 + 30} ${y2} L ${x2} ${y2}`;
          labelX = (x1 + x2) / 2;
          labelY = bottomY;
          labelAlign = 'center';
          
        // 2. Yan Yana Kolonlar (Yatay Bağlantı)
        } else if (isAdjacent && Math.abs(dy) < 150) {
          let yOffset = goingRight ? -15 : 15;
          let gap = 20;
          
          // Sadece kayıt kısmında okların arasını hafif daha aç ki yazılar üst üste binmesin
          // Ancak okların kutuya denk gelmesi için gap = 28 olarak sınırlandırdık
          if (activeFlow.id === 'register-flow' && 
             ((step.fromNodeId === 'identity-service' && step.toNodeId === 'identity-db') ||
              (step.fromNodeId === 'identity-db' && step.toNodeId === 'identity-service'))) {
             
             // 6 okun birbirine girmemesi için baştakiler yukarıdan U çiziyor,
             // sondakiler aşağıdan U çiziyor, ortadakiler düz geçiyor.
             if (loopIndex === 2) { yOffset = -45; }       // Step 3 (Üstten dış U)
             else if (loopIndex === 3) { yOffset = -30; }  // Step 4 (Üstten iç U)
             else if (loopIndex === 4) { yOffset = -5; }   // Step 5 (Orta üst düz)
             else if (loopIndex === 5) { yOffset = 20; }   // Step 6 (Orta alt düz)
             else if (loopIndex === 6) { yOffset = 40; }   // Step 7 (Alttan iç U)
             else if (loopIndex === 7) { yOffset = 55; }   // Step 8 (Alttan dış U)
             else { yOffset = goingRight ? -12 : 12; } // Fallback
          }
          else if (activeFlow.id === 'crud-flow' && 
             ((step.fromNodeId === 'identity-service' && step.toNodeId === 'identity-db') ||
              (step.fromNodeId === 'identity-db' && step.toNodeId === 'identity-service') ||
              (step.fromNodeId === 'crud-service' && step.toNodeId === 'crud-db') ||
              (step.fromNodeId === 'crud-db' && step.toNodeId === 'crud-service'))) {
             
             // Kullanıcı CRUD akışında da okların net bir şekilde yukarıdan aşağıya (Top-to-Bottom)
             // inmesini istedi. İndexlere göre manuel olarak en üstten en alta diziyoruz.
             if (loopIndex === 2) { yOffset = -22; }       // Step 3 (Identity -> DB, Üst)
             else if (loopIndex === 3) { yOffset = 22; }   // Step 4 (DB -> Identity, Alt)
             else if (loopIndex === 5) { yOffset = -22; }  // Step 6 (Crud -> DB, Üst)
             else if (loopIndex === 6) { yOffset = 22; }   // Step 7 (DB -> Crud, Alt)
             else { yOffset = goingRight ? -14 : 14; }
          }
          else if (activeFlow.id === 'register-flow') {
             if (loopIndex === 0) { yOffset = -30; }      // Step 1
             else if (loopIndex === 9) { yOffset = -25; } // Step 10 (Epey yukarı çekildi)
             else {
                 yOffset = goingRight ? -12 : 12;
                 let shiftMultiplier = pairIdx;
                 yOffset += (goingRight ? -28 : 28) * shiftMultiplier;
             }
          }
          else {
             // Diğer yerler için standart hesap
             let shiftMultiplier = pairIdx;
             yOffset += (goingRight ? -gap : gap) * shiftMultiplier;
          }
          
          let adjFixedY1 = from.centerY + yOffset;
          let adjFixedY2 = to.centerY + yOffset;
  
          x1 = goingRight ? from.right : from.left;
          y1 = adjFixedY1;
          x2 = goingRight ? to.left : to.right;
          y2 = adjFixedY2;
          
          const midX = (from.centerX + to.centerX) / 2;
          
          if (activeFlow.id === 'register-flow' && (loopIndex === 2 || loopIndex === 3)) {
             // Step 3 ve Step 4 üstten U çizerek geçsin
             let topY = Math.min(from.top, to.top) - (loopIndex === 2 ? 65 : 30);
             let dirOffset = goingRight ? 15 : -15; 
             pathD = `M ${x1} ${adjFixedY1} L ${x1 + dirOffset} ${adjFixedY1} L ${x1 + dirOffset} ${topY} L ${x2 - dirOffset} ${topY} L ${x2 - dirOffset} ${adjFixedY2} L ${x2} ${adjFixedY2}`;
             labelX = midX;
             labelY = topY - 10;
          } else if (activeFlow.id === 'register-flow' && (loopIndex === 6 || loopIndex === 7)) {
             // Step 7 ve Step 8 alttan U çizerek geçsin
             let bottomY = Math.max(from.bottom, to.bottom) + (loopIndex === 7 ? 65 : 30);
             let dirOffset = goingRight ? 15 : -15; 
             pathD = `M ${x1} ${adjFixedY1} L ${x1 + dirOffset} ${adjFixedY1} L ${x1 + dirOffset} ${bottomY} L ${x2 - dirOffset} ${bottomY} L ${x2 - dirOffset} ${adjFixedY2} L ${x2} ${adjFixedY2}`;
             labelX = midX;
             labelY = bottomY - 10;
          } else {
             pathD = `M ${x1} ${adjFixedY1} L ${midX} ${adjFixedY1} L ${midX} ${adjFixedY2} L ${x2} ${adjFixedY2}`;
             labelX = midX;
             labelY = adjFixedY1 - 10;
          }
          
        // 3. Uzak Kolonlar veya Çapraz/Wrap bağlantılar (Satır atlayanlar)
        } else {
          let adjFixedY1 = fixedY1;
          let adjFixedY2 = fixedY2;
  
          x1 = goingRight ? from.right : from.left;
          y1 = adjFixedY1;
          x2 = goingRight ? to.left : to.right;
          y2 = adjFixedY2;
          
          let laneOffset = ((loopIndex % 4) - 1.5) * 16;
          let midX = ((from.centerX + to.centerX) / 2) + laneOffset;
          pathD = `M ${x1} ${y1} L ${midX} ${y1} L ${midX} ${y2} L ${x2} ${y2}`;
          labelX = midX;
          labelY = (y1 + y2) / 2;
          labelAlign = 'left';
        }
      }
      } // End of else block for manual override

      // 3. Adım: Hangi okun hangi renk olacağını ve dönüş mü gidiş mi olduğunu belirle
      let lineColor = this.getLineColor(i);
      let markerEnd = `arrowhead-${lineColor.replace('#', '')}`;

      if (isDrawingBackground || i <= this.currentStepIndex() || this.isAnimationFinished()) {
        
        // Zıplamayı (Jump) önlemek için: Önceki okun bittiği yer ile bu okun başladığı yeri birleştir.
        let tokenPathD = pathD;
        if (i > 0) {
          let prevStep = newLines.find(l => l.stepIndex === i && (step.isParallel ? !!l.parallelTokenPathD : !l.parallelTokenPathD));
          
          if (step.isParallel && i === 1) {
             prevStep = newLines.find(l => l.stepIndex === i && !l.parallelTokenPathD);
          }
          
          if (prevStep) {
             tokenPathD = pathD.replace(`M ${x1} ${y1}`, `M ${prevStep.x2} ${prevStep.y2} L ${x1} ${y1}`);
          }
        }

        const isParallelActive = !isDrawingBackground && (i === this.currentStepIndex() && !this.isAnimationFinished());
        const activeStatus = isDrawingBackground ? false : (i === this.currentStepIndex() && !this.isAnimationFinished());
        const shouldDraw = isDrawingBackground || i <= this.currentStepIndex() || this.isAnimationFinished();

        if (shouldDraw) {
          const idSuffix = step.isParallel ? 'parallel-' : '';
          const lColor = isDrawingBackground ? '#94a3b8' : (step.isParallel ? this.getLineColor(i + 3) : lineColor);
          const mEnd = isDrawingBackground ? 'arrowhead' : `arrowhead-${lColor.replace('#', '')}`;
          
          let finalLabel = '';
          if (!isDrawingBackground) {
             let labelDataStr = this.currentDataToken || 'Veri';
             if (labelDataStr.includes('\n')) {
                labelDataStr = labelDataStr.split('\n')[0].replace('Ad: ', '').trim();
             }
             if (labelDataStr.includes(' (')) {
                labelDataStr = labelDataStr.split(' (')[0].trim();
             }
             finalLabel = step.label ? step.label.replace(/{DATA}/g, labelDataStr) : '';
          }

          newLines.push({
            id: `${idSuffix}${step.fromNodeId}-${step.toNodeId}-${i}`, 
            x1, y1, x2, y2, midX: labelX, labelX, labelY,
            pathD,
            tokenPathD: isDrawingBackground ? pathD : tokenPathD,
            label: finalLabel,
            subLabel: isDrawingBackground ? '' : (step as any).subLabel,
            active: activeStatus,
            isReturn: step.isReturn || false,
            isDefaultBackground: isDrawingBackground,
            stepIndex: i + 1,
            lineColor: lColor,
            markerEnd: mEnd,
            parallelTokenPathD: step.isParallel ? pathD : undefined,
            labelAlign
          });
        }
      }
    });

    // YENİ: Etiket (Label) Çakışmalarını Önleme Algoritması
    // Etiketlerin üst üste binmemesi için Y ekseninde itme uygular
    for (let i = 0; i < newLines.length; i++) {
      for (let j = i + 1; j < newLines.length; j++) {
        const lineA = newLines[i];
        const lineB = newLines[j];
        
        const dx = Math.abs(lineA.labelX - lineB.labelX);
        const dy = Math.abs(lineA.labelY - lineB.labelY);
        
        // Genişlik ~150px, Yükseklik ~40px kabul edelim
        if (dx < 150 && dy < 40) {
          // Çakışma var, lineB'yi itelim. Eğer A, B'nin üstündeyse B'yi aşağı it, değilse yukarı it.
          if (lineA.labelY <= lineB.labelY) {
            lineB.labelY += (40 - dy) + 5;
          } else {
            lineB.labelY -= (40 - dy) + 5;
          }
        }
      }
    }

    this.svgLines.set(newLines);

    // ==========================================
    // YENİ: Grup Hiyerarşisi Çizgilerini Hesapla
    // ==========================================
    const newGroupLines: {path: string}[] = [];
    const groupEls = wrapper.querySelectorAll('.schema-box.is-group:not(.hidden-node)');
    
    groupEls.forEach((groupEl: Element) => {
      const container = groupEl.nextElementSibling;
      if (container && container.classList.contains('group-children-container')) {
        const pOffset = getOffset(groupEl as HTMLElement);
        const startX = pOffset.left + 12; // Parent'ın solundan 12px içeride
        const startY = pOffset.bottom;
        
        const children = container.querySelectorAll('.child-box:not(.hidden-node)');
        children.forEach((childEl: Element) => {
          const cOffset = getOffset(childEl as HTMLElement);
          
          // Düz inip sağa dönen (L şeklinde) path
          // Parent bottom -> Child Center Y -> Child Left Edge
          const path = `M ${startX} ${startY} L ${startX} ${cOffset.centerY} L ${cOffset.left} ${cOffset.centerY}`;
          newGroupLines.push({ path });
        });
      }
    });

    this.groupSvgLines.set(newGroupLines);
  }
}
 
 
