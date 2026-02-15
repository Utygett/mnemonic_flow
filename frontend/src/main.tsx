import { createRoot } from 'react-dom/client'
import App from './app/App.tsx'

import './shared/theme/theme.css'
import './app/styles/globals.css'
import './app/styles/components.css'
import 'katex/dist/katex.min.css'

createRoot(document.getElementById('root')!).render(<App />)
