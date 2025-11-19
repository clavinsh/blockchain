import './App.css'
import { AppRouter } from './router'
import { CarProvider } from './contexts/CarContext'

function App() {
  return (
    <CarProvider>
      <AppRouter />
    </CarProvider>
  )
}

export default App
