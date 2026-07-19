if('serviceWorker' in navigator) {window.addEventListener('load', () => {navigator.serviceWorker.register('/Wohnung/sw.js', { scope: '/Wohnung/' })})}
