importScripts('https://www.gstatic.com/firebasejs/10.12.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.1/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyArjKxUfvehNSA-GLXuuiOpChe55c4MQDE",
  authDomain: "studysync-prod-acfc6.firebaseapp.com",
  projectId: "studysync-prod-acfc6",
  messagingSenderId: "372359765372",
  appId: "1:372359765372:web:bb5252996a4c98597758f9",
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage(({notification}) => {
  self.registration.showNotification(notification.title, {
    body: notification.body,
    icon: '/icon.png'
  });
});
