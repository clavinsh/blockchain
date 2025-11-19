import { useState, useEffect } from 'react'

interface CarData {
  speed: number
  engineTemp: number
  fuelLevel: number
  lastUpdate: string
}

export default function DashboardPage() {
  const [carData, setCarData] = useState<CarData | null>(null)
  const [selectedCarId] = useState<number | null>(null)
  
  // TODO: Get selectedCarId from Layout component context
  // TODO: Fetch real car data from CarDataCache table
  
  useEffect(() => {
    if (selectedCarId) {
      // TODO: Fetch car data from API
      // fetchCarData(selectedCarId)
      
      setCarData({
        speed: 85,
        engineTemp: 92,
        fuelLevel: 67,
        lastUpdate: new Date().toLocaleTimeString('lv-LV')
      })
    }
  }, [selectedCarId])

  if (!selectedCarId) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Izvēlieties auto</h2>
          <p className="text-gray-600">Lūdzu, izvēlieties auto no augšējās izvēlnes, lai redzētu tā datus.</p>
        </div>
      </div>
    )
  }

  return (
    <div>

      {/* Main content */}
      <main className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {/* Live Data Card */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Aktuālie dati</h3>
            {carData ? (
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Ātrums:</span>
                  <span className="font-medium">{carData.speed} km/h</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Dzinēja temp.:</span>
                  <span className="font-medium">{carData.engineTemp}°C</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Degvielas līmenis:</span>
                  <span className="font-medium">{carData.fuelLevel}%</span>
                </div>
                <div className="text-xs text-gray-500 mt-4">
                  Pēdējā atjaunināšana: {carData.lastUpdate}
                </div>
              </div>
            ) : (
              <div className="text-gray-500 text-center py-4">
                Ielādē datus...
              </div>
            )}
          </div>

          {/* System Status Card */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Sistēmas statuss</h3>
            <div className="space-y-3">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-green-500 rounded-full mr-3"></div>
                <span className="text-gray-700">Sensori: Aktīvi</span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 bg-green-500 rounded-full mr-3"></div>
                <span className="text-gray-700">Blockchain: Sinhronizēts</span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 bg-yellow-500 rounded-full mr-3"></div>
                <span className="text-gray-700">Kešatmiņa: 89% aizpildīta</span>
              </div>
            </div>
          </div>

          {/* Quick Stats Card */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Statistika</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Šodien nobraukts:</span>
                <span className="font-medium">127 km</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Vidējais ātrums:</span>
                <span className="font-medium">78 km/h</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Degvielas patēriņš:</span>
                <span className="font-medium">7.2 L/100km</span>
              </div>
            </div>
          </div>
        </div>

        {/* Live Data Table */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Tiešraides dati (atjauninās ik pa 15 min)</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Laiks</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ātrums</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Dzinēja temp.</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Degviela</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">GPS</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                <tr>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">14:30:15</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">87 km/h</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">91°C</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">68%</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">56.9677, 24.1056</td>
                </tr>
                <tr>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">14:15:15</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">82 km/h</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">89°C</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">69%</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">56.9723, 24.1089</td>
                </tr>
                <tr>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">14:00:15</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">75 km/h</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">87°C</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">71%</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">56.9812, 24.1123</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  )
}