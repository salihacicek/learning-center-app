import { ChildNode, Layer, FlowPath } from '../microservices-learning.component';

export const MICROSERVICES_LAYERS: Layer[] = [
  {
    id: 'layer-client',
    title: '1. İSTEMCİ',
    nodes: [
      { id: 'client', name: 'Kullanıcı İstemcisi', type: 'component', desc: 'Web Tarayıcı, Mobil Uygulama vb.' }
    ]
  },
  {
    id: 'layer-gateway',
    title: '2. API AĞ GEÇİDİ',
    nodes: [
      { id: 'gateway', name: 'API Gateway', type: 'gateway', desc: 'Gelen tüm istekleri karşılar ve ilgili servise yönlendirir' }
    ]
  },
  {
    id: 'layer-services',
    title: '3. MİKROSERVİSLER (İş Mantığı)',
    nodes: [
      { id: 'microservices', name: 'Servis Ağı', type: 'service-be', desc: 'Auth, Blog, Profil gibi tüm iç servisler' }
    ]
  },
  {
    id: 'layer-data',
    title: '4. VERİTABANI',
    nodes: [
      { id: 'db-main', name: 'Merkezi Veritabanı', type: 'db', desc: 'Tüm servislerin bağlandığı tek veritabanı' }
    ]
  }
];

export const MICROSERVICES_FLOWS: FlowPath[] = [
  {
    id: 'genel-mimari',
    name: 'Genel Mimari',
    steps: [
      { fromNodeId: 'client', toNodeId: 'gateway', label: '1. İstemciden İstek Gelir' },
      { fromNodeId: 'gateway', toNodeId: 'microservices', label: '2. Gateway İsteği İlgili Servise Yönlendirir' },
      { fromNodeId: 'microservices', toNodeId: 'db-main', label: '3. Servis Veritabanına Gider' },
      { fromNodeId: 'db-main', toNodeId: 'microservices', label: '4. Veri Döndürülür', isReturn: true },
      { fromNodeId: 'microservices', toNodeId: 'gateway', label: '5. Servis Yanıtı Gateway\'e İletilir', isReturn: true },
      { fromNodeId: 'gateway', toNodeId: 'client', label: '6. İstemciye Sonuç Dönülür', isReturn: true }
    ]
  },
  {
    id: 'giris-yap',
    name: 'Giriş Yapma Akışı',
    steps: [
      { fromNodeId: 'client', toNodeId: 'gateway', label: '1. {DATA} giriş isteği gönderir (POST /login)' },
      { fromNodeId: 'gateway', toNodeId: 'microservices', label: '2. Auth Servisine Yönlendir' },
      { fromNodeId: 'microservices', toNodeId: 'db-main', label: '3. DB\'de {DATA} aranır' },
      { fromNodeId: 'db-main', toNodeId: 'microservices', label: '4. {DATA} bulundu', isReturn: true },
      { fromNodeId: 'microservices', toNodeId: 'gateway', label: '5. Token ({DATA}) oluşturuldu', isReturn: true },
      { fromNodeId: 'gateway', toNodeId: 'client', label: '6. {DATA} için giriş başarılı', isReturn: true }
    ]
  },
  {
    id: 'profil-duzenle',
    name: 'Profil Düzenleme Akışı',
    steps: [
      { fromNodeId: 'client', toNodeId: 'gateway', label: '1. "{DATA}" ekleme/düzenleme isteği gönderilir' },
      { fromNodeId: 'gateway', toNodeId: 'microservices', label: '2. İşlem Servisine Yönlendirilir' },
      { fromNodeId: 'microservices', toNodeId: 'db-main', label: '3. "{DATA}" veritabanına kaydedilir' },
      { fromNodeId: 'db-main', toNodeId: 'microservices', label: '4. "{DATA}" kaydedildi', isReturn: true },
      { fromNodeId: 'microservices', toNodeId: 'gateway', label: '5. İşlem onaylanır', isReturn: true },
      { fromNodeId: 'gateway', toNodeId: 'client', label: '6. "{DATA}" işlemi tamamlandı', isReturn: true }
    ]
  }
];
