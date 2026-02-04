import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import petFavicon from './components/Anzhay/pet.png'
import { WalletContextProvider } from './context/WalletContextProvider.jsx'

const favicon = document.querySelector('#favicon')
if (favicon) favicon.href = petFavicon

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <WalletContextProvider>
      <App />
    </WalletContextProvider>
  </React.StrictMode>,
)
