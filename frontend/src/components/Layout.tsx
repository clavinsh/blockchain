import { useState, useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { carApi, tokenManager } from '@/services/api'
import { useCarContext } from '@/contexts/CarContext'

interface LayoutProps {
  children: React.ReactNode
}

export default function Layout({ children }: LayoutProps) {
  const location = useLocation()
  const navigate = useNavigate()
  const { selectedCarId, setSelectedCarId, userCars, setUserCars } = useCarContext()
  const [isLoadingCars, setIsLoadingCars] = useState(true)
  const [user] = useState(tokenManager.getUser())

  const loadUserCars = async () => {
    try {
      setIsLoadingCars(true)
      const response = await carApi.getUserCars()

      if (response.success && response.cars) {
        setUserCars(response.cars)

        // Auto-select first car if available
        if (response.cars.length > 0 && !selectedCarId) {
          setSelectedCarId(response.cars[0].carId)
        }
      }
    } catch (error) {
      console.error('Failed to load user cars:', error)

      // If unauthorized, redirect to login
      if (error instanceof Error && error.message.includes('authentication')) {
        handleLogout()
      }
    } finally {
      setIsLoadingCars(false)
    }
  }

  useEffect(() => {
    loadUserCars()
  }, [])

  const handleLogout = () => {
    tokenManager.logout()
    navigate('/login')
  }

  const navigationItems = [
    { path: '/dashboard', label: 'Galvenā panelis', icon: '📊' },
    { path: '/analyzed-data', label: 'Analizētie dati', icon: '📈' },
    { path: '/car-manager', label: 'Mašīnu pārvaldība', icon: '🚗' }
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
                value={selectedCarId || ''}
                onChange={(e) => setSelectedCarId(Number(e.target.value))}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={isLoadingCars}
              >
                <option value="">
                  {isLoadingCars ? 'Ielādē...' : userCars.length === 0 ? 'Nav pieejamu auto' : 'Izvēlieties auto'}
                </option>
                {userCars.map((car) => (
                  <option key={car.carId} value={car.carId}>
                    {car.brand} {car.model} ({car.licensePlate})
                  </option>
                ))}
              </select>

              {/* User Menu */}
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-700">
                  {user?.username || 'Lietotājs'}
                </span>
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
                    className={`flex items-center space-x-3 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${location.pathname === item.path
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