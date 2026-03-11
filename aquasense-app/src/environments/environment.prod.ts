export const environment = {
  production: true,
  firebase: {
    apiKey: 'AIzaSyBhWJZVywtMMpsXHNx8fZFAeRkYfuekWIE',
    authDomain: 'devfest-3c6e5.firebaseapp.com',
    databaseURL: 'https://devfest-3c6e5-default-rtdb.firebaseio.com',
    projectId: 'devfest-3c6e5',
    storageBucket: 'devfest-3c6e5.firebasestorage.app',
    messagingSenderId: '1022109317394',
    appId: '1:1022109317394:web:4ea5414cb308381c94dbcb',
    measurementId: 'G-QHWMEF0GV1'
  },
  ngoEmails: [
    'ngo@aquasense.org',
    'monitor@waterwatch.org'
  ],
  thresholds: {
    ph: { min: 6.5, max: 8.5, warningMin: 6.8, warningMax: 8.2 },
    ntu: { max: 5.0, warning: 3.0 },
    temp: { max: 35, warning: 30 },
    light: { min: 10, warning: 20 },
    slopeThreshold: 0.15,
    algaeTemp: 30,
    algaeLight: 60
  }
};
