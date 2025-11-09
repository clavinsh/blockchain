import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'

interface LayoutProps {
  children: React.ReactNode
}

export default function Layout({ children }: LayoutProps) {
  const location = useLocation()
  const navigate = useNavigate()
  const [selectedCar, setSelectedCar] = useState('Mana mašīna #1')

  const handleLogout = () => {
    // TODO: Implement logout logic
    navigate('/login')
  }

  const navigationItems = [
    { path: '/dashboard', label: 'Galvenā panelis', icon: '📊' },
    { path: '/analyzed-data', label: 'Analizētie dati', icon: '📈' },
    { path: '/car-manager', label: 'Mašīnu pārvaldība', icon: '🚗' },
    { path: '/reports', label: 'Manas atskaites', icon: '📋' }
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo/Title */}
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-gray-900">
                Blockchain Auto Monitorings
              </h1>
            </div>

            {/* Car Selector */}
            <div className="flex items-center space-x-4">
              <select 
                value={selectedCar}
                onChange={(e) => setSelectedCar(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="Mana mašīna #1">Mana mašīna #1</option>
                <option value="Mana mašīna #2">Mana mašīna #2</option>
                <option value="BMW X5">BMW X5 - Shared</option>
              </select>

              {/* User Menu */}
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-700">Jānis Bērziņš</span>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={handleLogout}
                >
                  Iziet
                </Button>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar Navigation */}
        <nav className="w-64 bg-white shadow-sm h-[calc(100vh-4rem)] overflow-y-auto">
          <div className="p-6">
            <ul className="space-y-2">
              {navigationItems.map((item) => (
                <li key={item.path}>
                  <Link
                    to={item.path}
                    className={`flex items-center space-x-3 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      location.pathname === item.path
                        ? 'bg-blue-100 text-blue-700'
                        : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                    }`}
                  >
                    <span>{item.icon}</span>
                    <span>{item.label}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </nav>

        {/* Main Content */}
        <main className="flex-1 p-6">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}