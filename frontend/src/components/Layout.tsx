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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

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
    { path: '/dashboard', label: 'Dashboard', icon: '📊' },
    { path: '/analyzed-data', label: 'Analyzed Data', icon: '📈' },
    { path: '/car-manager', label: 'Car Manager', icon: '🚗' },
    { path: '/invitations', label: 'Invitations', icon: '✉️' },
    { path: '/system-info', label: 'System Info', icon: '⚙️' }
  ]

  return (
    <div className="min-h-screen bg-gray-50 overflow-x-hidden">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="w-full px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 sm:gap-0 py-2 sm:py-0 sm:h-16">
            {/* Logo/Title */}
            <div className="flex items-center justify-between w-full sm:w-auto">
              <h1 className="text-xl font-bold text-gray-900">
                Blockchain Auto Monitorings
              </h1>
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="lg:hidden p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  {mobileMenuOpen ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  )}
                </svg>
              </button>
            </div>

            {/* Car Selector */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-4 w-full sm:w-auto">
              <select
                value={selectedCarId || ''}
                onChange={(e) => setSelectedCarId(Number(e.target.value))}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-full sm:w-auto"
                disabled={isLoadingCars}
              >
                <option value="">
                  {isLoadingCars ? 'Loading...' : userCars.length === 0 ? 'No cars available' : 'Select a car'}
                </option>
                {userCars.map((car) => (
                  <option key={car.carId} value={car.carId}>
                    {car.brand} {car.model} ({car.licensePlate})
                  </option>
                ))}
              </select>

              {/* User Menu */}
              <div className="flex items-center justify-between sm:justify-end gap-3 sm:gap-4 w-full sm:w-auto">
                <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 rounded-md border border-gray-200">
                  <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  <span className="text-sm font-medium text-gray-700">
                    {user?.username || 'User'}
                  </span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleLogout}
                  className="hover:bg-red-50 hover:border-red-300 hover:text-red-700"
                >
                  Logout
                </Button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Navigation Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-white border-b shadow-sm">
          <nav className="px-4 py-2">
            <ul className="space-y-1">
              {navigationItems.map((item) => (
                <li key={item.path}>
                  <Link
                    to={item.path}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center space-x-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${location.pathname === item.path
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
          </nav>
        </div>
      )}

      <div className="flex overflow-hidden">
        {/* Sidebar Navigation */}
        <aside className="hidden lg:block w-64 flex-shrink-0">
          <nav className="sticky top-0 bg-white shadow-sm h-screen overflow-y-auto">
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
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-4 sm:p-6 w-full min-w-0 overflow-x-hidden">
          {children}
        </main>
      </div>
    </div>
  )
}