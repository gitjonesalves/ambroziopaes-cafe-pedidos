// Fallback de variáveis de ambiente para GitHub Pages
// Use isso se não conseguir configurar .env
// IMPORTANTE: Não coloque valores reais aqui! Use para desenvolvimento apenas

window.ENV = {
  FIREBASE_API_KEY: 'YOUR_API_KEY_HERE', // ← MUDE AQUI
  FIREBASE_AUTH_DOMAIN: 'ambroziopaes.firebaseapp.com',
  FIREBASE_DB_URL: 'https://ambroziopaes-default-rtdb.firebaseio.com',
  FIREBASE_PROJECT_ID: 'ambroziopaes',
  FIREBASE_STORAGE_BUCKET: 'ambroziopaes.firebasestorage.app',
  FIREBASE_MESSAGING_ID: '237755790666',
  FIREBASE_APP_ID: '1:237755790666:web:5bc2ffabf6631e6a2dfdb3',
  FIREBASE_MEASUREMENT_ID: 'G-RJ478LM1V8',
  APP_NAME: 'Ambrózio Paes',
  APP_VERSION: '2.0.0',
  SESSION_TIMEOUT: 10800000, // 3 horas
  DEBUG: false
};

console.log('🔧 Environment config carregado');