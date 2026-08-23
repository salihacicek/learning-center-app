import { Layer, FlowPath } from '../microservices-learning.component';

export const ADVANCED_LAYERS: Layer[] = [
  {
    id: 'frontend-layer',
    title: 'Frontend (Ön Yüz)',
    nodes: [
      { id: 'client-node', name: 'Client (İstemci)', type: 'component', actionName: 'Kullanıcı Arayüzü', desc: 'Kullanıcının tıkladığı web veya mobil uygulama.' }
    ]
  },
  {
    id: 'gateway-layer',
    title: 'Backend - Giriş Kapısı',
    nodes: [
      { 
        id: 'gateway-node', name: 'API Gateway', type: 'gateway', desc: 'İsteklerin geldiği ilk nokta. Gelen isteği doğru servise yönlendirir.' 
      }
    ]
  },
  {
    id: 'services-layer',
    title: 'Backend - Mikroservisler',
    nodes: [
      { id: 'identity-service', name: 'Kimlik Servisi', type: 'service-be', desc: 'Kullanıcı giriş (Authentication) ve yetki (Authorization) işlemlerini yapar.' },
      { id: 'crud-service', name: 'Özel Alan Servisi', type: 'service-be', desc: 'Sisteme özel veri ekleme, okuma, silme (CRUD) işlemlerini yapar.' }
    ]
  },
  {
    id: 'db-layer',
    title: 'Veritabanı (Database)',
    nodes: [
      { id: 'identity-db', name: 'Kimlik Veri Tabanı', type: 'db', desc: 'Sadece kullanıcılara ait verileri tutar.' },
      { id: 'crud-db', name: 'Özel Alan Veri Tabanı', type: 'db', desc: 'Sadece özel alanla ilgili verileri tutar.' }
    ]
  }
];

export const ADVANCED_FLOWS: FlowPath[] = [
  {
    id: 'genel-mimari-advanced',
    name: 'Gelişmiş Mimari Genel Yapı',
    steps: [
      { fromNodeId: 'client-node', toNodeId: 'gateway-node', label: '1. İstemciden İstek Gelir' },
      { fromNodeId: 'gateway-node', toNodeId: 'identity-service', label: '2. Kimlik/Oturum Kontrolü' },
      { fromNodeId: 'identity-service', toNodeId: 'identity-db', label: '3. Kimlik DB Sorgusu' },
      { fromNodeId: 'gateway-node', toNodeId: 'crud-service', label: '4. Veri (CRUD) İşlemleri' },
      { fromNodeId: 'crud-service', toNodeId: 'crud-db', label: '5. Özel Alan DB Kaydı' }
    ]
  },
  {
    id: 'login-flow',
    name: '1. Kullanıcı Giriş Akışı (Authentication - Kimlik Doğrulama)',
    steps: [
      { fromNodeId: 'client-node', toNodeId: 'gateway-node', label: '1. {DATA} giriş bilgilerini (LoginDTO) gönderir' },
      { fromNodeId: 'gateway-node', toNodeId: 'identity-service', label: '2. Gateway, LoginDTO\'yu Kimlik Servisine yönlendirir' },
      { fromNodeId: 'identity-service', toNodeId: 'identity-db', label: '3. Authentication: DB\'de şifre doğrulaması yapılır' },
      { fromNodeId: 'identity-db', toNodeId: 'identity-service', label: '4. {DATA} bulundu ve kimlik doğrulandı', isReturn: true },
      { fromNodeId: 'identity-service', toNodeId: 'gateway-node', label: '5. Authorization: Yetkileri içeren Token üretildi', isReturn: true },
      { fromNodeId: 'gateway-node', toNodeId: 'client-node', label: '6. {DATA} girişi başarılı, Token (AuthResponseDTO) istemciye iletildi', isReturn: true }
    ]
  },
  {
    id: 'crud-flow',
    name: '2. Veri Ekleme Akışı (Authorization - Yetkilendirme İşlemi)',
    steps: [
      { fromNodeId: 'client-node', toNodeId: 'gateway-node', label: '1. "{DATA}" ekleme isteği (CreateDTO ve Token) gönderilir' },
      { fromNodeId: 'gateway-node', toNodeId: 'crud-service', label: '2. Gateway, Token yetkisini onaylar ve CreateDTO\'yu servise iletir' },
      { fromNodeId: 'crud-service', toNodeId: 'crud-db', label: '3. Özel Alan Servisi yetkili işlemi DB\'ye yazar' },
      { fromNodeId: 'crud-db', toNodeId: 'crud-service', label: '4. "{DATA}" başarıyla kaydedildi', isReturn: true },
      { fromNodeId: 'crud-service', toNodeId: 'gateway-node', label: '5. İşlem onaylanır', isReturn: true },
      { fromNodeId: 'gateway-node', toNodeId: 'client-node', label: '6. "{DATA}" işlemi tamamlandı (SuccessResponseDTO döndü)', isReturn: true }
    ]
  },
  {
    id: 'register-flow',
    name: '3. Kullanıcı Kayıt Akışı (Kayıt Kontrol ve Temel Atma)',
    steps: [
      { fromNodeId: 'client-node', toNodeId: 'gateway-node', label: '1. {DATA} kayıt bilgilerini (RegisterDTO) gönderir' },
      { fromNodeId: 'gateway-node', toNodeId: 'identity-service', label: '2. Gateway, RegisterDTO\'yu Kimlik Servisine iletir' },
      { fromNodeId: 'identity-service', toNodeId: 'identity-db', label: '3. Kayıt bilgileri kontrol edilir (Kullanıcı mevcut mu?)' },
      { fromNodeId: 'identity-db', toNodeId: 'identity-service', label: '4. Başarılı. Authentication (Kimlik Doğrulama) hesabı açıldı', isReturn: true },
      { fromNodeId: 'identity-service', toNodeId: 'gateway-node', label: '5. Authorization (Yetkilendirme) için varsayılan roller atandı', isReturn: true },
      { fromNodeId: 'gateway-node', toNodeId: 'client-node', label: '6. {DATA} kaydı tamamlandı (UserResponseDTO döndü)', isReturn: true }
    ]
  }
];