import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';

if ('SpeechRecognition' in window === false && 'webkitSpeechRecognition' in window) {
  window.SpeechRecognition = window.webkitSpeechRecognition || window.SpeechRecognition;
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);


