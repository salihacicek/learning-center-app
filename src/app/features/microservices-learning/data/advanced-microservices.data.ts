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
      { fromNodeId: 'client-node', toNodeId: 'gateway-node', label: '1. Çoklu Kullanıcı İstekleri Gelir' },
      { fromNodeId: 'gateway-node', toNodeId: 'identity-service', parallelNodeFrom: 'gateway-node', parallelNodeTo: 'crud-service', label: '2. Gateway İstekleri Dağıtır' },
      { fromNodeId: 'identity-service', toNodeId: 'identity-db', parallelNodeFrom: 'crud-service', parallelNodeTo: 'crud-db', label: '3. Servisler Veritabanlarına Bağlanır' },
      { fromNodeId: 'identity-db', toNodeId: 'identity-service', parallelNodeFrom: 'crud-db', parallelNodeTo: 'crud-service', label: '4. İşlemler Gerçekleşir', isReturn: true },
      { fromNodeId: 'identity-service', toNodeId: 'gateway-node', parallelNodeFrom: 'crud-service', parallelNodeTo: 'gateway-node', label: '5. Sonuçlar Gateway\'de Toplanır', isReturn: true },
      { fromNodeId: 'gateway-node', toNodeId: 'client-node', label: '6. Yanıtlar Kullanıcıya İletilir', isReturn: true }
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
    name: '2. CRUD İşlemi Akışı (Authorization - Yetkilendirme İşlemi)',
    steps: [
      { fromNodeId: 'client-node', toNodeId: 'gateway-node', label: '1. "{DATA}" isteği (Token ile birlikte) gönderilir' },
      { fromNodeId: 'gateway-node', toNodeId: 'identity-service', label: '2. Gateway, Token\'ı doğrulamak için Kimlik Servisine sorar' },
      { fromNodeId: 'identity-service', toNodeId: 'identity-db', label: '3. Kimlik Servisi yetki ve oturum durumunu DB\'den kontrol eder' },
      { fromNodeId: 'identity-db', toNodeId: 'identity-service', label: '4. DB onayı: Kullanıcı aktif ve yetkili', isReturn: true },
      { fromNodeId: 'identity-service', toNodeId: 'gateway-node', label: '5. Kimlik Servisi yetkiyi Gateway\'e bildirir', isReturn: true },
      { fromNodeId: 'gateway-node', toNodeId: 'crud-service', label: '6. Yetki onaylandıktan sonra istek Özel Alan Servisine iletilir' },
      { fromNodeId: 'crud-service', toNodeId: 'crud-db', label: '7. Özel Alan Servisi "{DATA}" işlemini DB\'de uygular' },
      { fromNodeId: 'crud-db', toNodeId: 'crud-service', label: '8. "{DATA}" işlemi DB\'de başarıyla tamamlandı', isReturn: true },
      { fromNodeId: 'crud-service', toNodeId: 'gateway-node', label: '9. İşlem sonucu Gateway\'e iletilir', isReturn: true },
      { fromNodeId: 'gateway-node', toNodeId: 'client-node', label: '10. "{DATA}" işlemi tamamlandı (200 OK döndü)', isReturn: true }
    ]
  },
  {
    id: 'register-flow',
    name: '3. Kullanıcı Kayıt Akışı (Kayıt Kontrol ve Temel Atma)',
    steps: [
      { fromNodeId: 'client-node', toNodeId: 'gateway-node', label: '1. "{DATA}" kayıt bilgilerini (RegisterDTO) gönderir' },
      { fromNodeId: 'gateway-node', toNodeId: 'identity-service', label: '2. Gateway, Kayıt isteğini Kimlik Servisine iletir' },
      { fromNodeId: 'identity-service', toNodeId: 'identity-db', label: '3. "{DATA}" için kullanıcı varlığı kontrol edilir' },
      { fromNodeId: 'identity-db', toNodeId: 'identity-service', label: '4. Başarılı: "{DATA}" için Kimlik (Authentication) oluşturuldu', isReturn: true },
      { fromNodeId: 'identity-service', toNodeId: 'gateway-node', label: '5. "{DATA}" için varsayılan yetkiler (Authorization) atandı', isReturn: true },
      { fromNodeId: 'gateway-node', toNodeId: 'client-node', label: '6. "{DATA}" kaydı tamamlandı (201 Created)', isReturn: true }
    ]
  }
];