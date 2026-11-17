import React from 'react';
import {createRoot} from 'react-dom/client';
import App from './App';
import './styles.css';

// Remove o cache antigo de notícias que também podia armazenar respostas de
// consultas editoriais. O novo Service Worker não armazena respostas da API.
if('caches' in window){
  void window.caches.delete('radar-public-news').catch(()=>undefined);
}
createRoot(document.getElementById('root')!).render(
  <React.StrictMode><App/></React.StrictMode>
);
