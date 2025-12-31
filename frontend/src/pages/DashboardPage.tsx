import { useState, useEffect } from 'react'
import { useCarContext } from '@/contexts/CarContext'
import { carApi, type CarDataItem } from '@/services/api'

export default function DashboardPage() {
  const { selectedCarId, selectedCar } = useCarContext()
  const [carDataList, setCarDataList] = useState<CarDataItem[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  const fetchCarData = async (carId: number) => {
    try {
      setIsLoading(true)
      const response = await carApi.getCarData(carId, 20)

      if (response.success && response.data) {
        setCarDataList(response.data)
      }
    } catch (error) {
      console.error('Failed to fetch car data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (selectedCarId) {
      fetchCarData(selectedCarId)
      setCurrentPage(1)
    } else {
      setCarDataList([])
      setCurrentPage(1)
    }
  }, [selectedCarId])

  if (!selectedCarId || !selectedCar) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Izvēlieties auto</h2>
          <p className="text-gray-600">Lūdzu, izvēlieties auto no augšējās izvēlnes, lai redzētu tā datus.</p>
        </div>
      </div>
    )
  }

  const latestData = carDataList.length > 0 ? carDataList[0] : null
  let parsedLatestData: any = null

  if (latestData) {
    try {
      parsedLatestData = JSON.parse(latestData.carData)
    } catch (e) {
      console.error('Failed to parse car data:', e)
    }
  }

  return (
    <div>
      {/* Car Info Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">
          {selectedCar.brand} {selectedCar.model} ({selectedCar.year})
        </h2>
        <p className="text-gray-600">
          Numurzīme: {selectedCar.licensePlate}
        </p>
      </div>

      {/* Main content */}
      <main>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {/* Live Data Card */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Aktuālie dati</h3>
            {isLoading ? (
              <div className="text-gray-500 text-center py-4">
                Ielādē datus...
              </div>
            ) : parsedLatestData ? (
              <div className="space-y-3">
                {Object.entries(parsedLatestData)
                  .filter(([key]) => key !== 'SensorDataId')
                  .slice(0, 5)
                  .map(([key, value]) => {
                    const fieldNames: Record<string, string> = {
                      VehicleId: 'Mašīnas ID',
                      Timestamp: 'Laiks',
                      Latitude: 'Platums',
                      Longitude: 'Garums',
                      Altitude: 'Augstums',
                      Speed: 'Ātrums',
                      FuelLevel: 'Degvielas līmenis',
                      EngineTemp: 'Dzinēja temperatūra',
                      BrakeFluidLevel: 'Bremžu šķidruma līmenis',
                      TirePressure: 'Riepu spiediens',
                      BatteryVoltage: 'Akumulatora spriegums'
                    }
                    const latvianKey = fieldNames[key] || key
                    
                    let displayValue = String(value)
                    if (key === 'Timestamp' && typeof value === 'string') {
                      try {
                        displayValue = new Date(value).toLocaleString('lv-LV', { 
                          timeZone: 'Europe/Riga',
                          year: 'numeric',
                          month: '2-digit',
                          day: '2-digit',
                          hour: '2-digit',
                          minute: '2-digit',
                          second: '2-digit'
                        })
                      } catch (e) {
                        displayValue = String(value)
                      }
                    }
                    
                    return (
                      <div key={key} className="flex justify-between">
                        <span className="text-gray-600">{latvianKey}:</span>
                        <span className="font-medium">{displayValue}</span>
                      </div>
                    )
                  })}
                <div className="text-xs text-gray-500 mt-4">
                  Pēdējā atjaunināšana: {latestData?.insertTime ? new Date(latestData.insertTime).toLocaleString('lv-LV', { timeZone: 'Europe/Riga', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' }) : 'Nav zināms'}
                </div>
              </div>
            ) : (
              <div className="text-gray-500 text-center py-4">
                Nav pieejamu datu
              </div>
            )}
          </div>

          {/* System Status Card */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Sistēmas statuss</h3>
            <div className="space-y-3">
              <div className="flex items-center">
                <div className={`w-3 h-3 ${carDataList.length > 0 ? 'bg-green-500' : 'bg-red-500'} rounded-full mr-3`}></div>
                <span className="text-gray-700">Sensori: {carDataList.length > 0 ? 'Aktīvi' : 'Nav aktīvi'}</span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 bg-green-500 rounded-full mr-3"></div>
                <span className="text-gray-700">Blockchain: Sinhronizēts</span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 bg-blue-500 rounded-full mr-3"></div>
                <span className="text-gray-700">Datu ieraksti: {carDataList.length}</span>
              </div>
            </div>
          </div>

          {/* Quick Stats Card */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Mašīnas info</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Gads:</span>
                <span className="font-medium">{selectedCar.year}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Krāsa:</span>
                <span className="font-medium">{selectedCar.color || 'Nav norādīta'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">VIN:</span>
                <span className="font-medium text-xs">{selectedCar.vin || 'Nav norādīts'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Live Data Table */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Vēsturiskie dati</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Laiks</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Dati (JSON)</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {carDataList.length > 0 ? (
                  carDataList
                    .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
                    .map((item) => (
                      <tr key={item.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {item.insertTime ? new Date(item.insertTime).toLocaleString('lv-LV', { 
                            timeZone: 'Europe/Riga',
                            year: 'numeric',
                            month: '2-digit',
                            day: '2-digit',
                            hour: '2-digit',
                            minute: '2-digit',
                            second: '2-digit'
                          }) : '-'}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          <pre className="text-xs overflow-x-auto">{item.carData}</pre>
                        </td>
                      </tr>
                    ))
                ) : (
                  <tr>
                    <td colSpan={2} className="px-6 py-8 text-center text-sm text-gray-500">
                      {isLoading ? 'Ielādē datus...' : 'Nav pieejamu datu'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          {/* Pagination Controls */}
          {carDataList.length > itemsPerPage && (
            <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
              <div className="text-sm text-gray-700">
                Rāda {((currentPage - 1) * itemsPerPage) + 1} līdz {Math.min(currentPage * itemsPerPage, carDataList.length)} no {carDataList.length} ierakstiem
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  ← Iepriekšējā
                </button>
                <span className="px-3 py-1 text-sm text-gray-700">
                  Lapa {currentPage} no {Math.ceil(carDataList.length / itemsPerPage)}
                </span>
                <button
                  onClick={() => setCurrentPage(p => Math.min(Math.ceil(carDataList.length / itemsPerPage), p + 1))}
                  disabled={currentPage >= Math.ceil(carDataList.length / itemsPerPage)}
                  className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Nākamā →
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
