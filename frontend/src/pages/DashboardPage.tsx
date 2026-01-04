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
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Select a car</h2>
          <p className="text-gray-600">Please select a car from the top menu to see its data.</p>
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
    <div className="w-full">
      {/* Car Info Header */}
      <div className="mb-4 sm:mb-6">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
          {selectedCar.brand} {selectedCar.model} ({selectedCar.year})
        </h2>
        <p className="text-sm sm:text-base text-gray-600">
          License Plate: {selectedCar.licensePlate}
        </p>
      </div>

      {/* Main content */}
      <main>
        <div className="grid grid-cols-1 xl:grid-cols-2 2xl:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
          {/* Live Data Card */}
          <div className="bg-white rounded-lg shadow p-4 sm:p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Current Data</h3>
            {isLoading ? (
              <div className="text-gray-500 text-center py-4">
                Loading data...
              </div>
            ) : parsedLatestData ? (
              <div className="space-y-3">
                {Object.entries(parsedLatestData)
                  .filter(([key]) => key !== 'SensorDataId')
                  .slice(0, 5)
                  .map(([key, value]) => {
                    const fieldNames: Record<string, string> = {
                      VehicleId: 'Vehicle ID',
                      Timestamp: 'Time',
                      Latitude: 'Latitude',
                      Longitude: 'Longitude',
                      Altitude: 'Altitude',
                      Speed: 'Speed',
                      FuelLevel: 'Fuel Level',
                      EngineTemp: 'Engine Temperature',
                      BrakeFluidLevel: 'Brake Fluid Level',
                      TirePressure: 'Tire Pressure',
                      BatteryVoltage: 'Battery Voltage'
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
                  Last update: {latestData?.insertTime ? new Date(latestData.insertTime).toLocaleString('lv-LV', { timeZone: 'Europe/Riga', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' }) : 'Unknown'}
                </div>
              </div>
            ) : (
              <div className="text-gray-500 text-center py-4">
                No data available
              </div>
            )}
          </div>

          {/* System Status Card */}
          <div className="bg-white rounded-lg shadow p-4 sm:p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">System Status</h3>
            <div className="space-y-3">
              <div className="flex items-center">
                <div className={`w-3 h-3 ${carDataList.length > 0 ? 'bg-green-500' : 'bg-red-500'} rounded-full mr-3`}></div>
                <span className="text-sm sm:text-base text-gray-700">Sensors: {carDataList.length > 0 ? 'Active' : 'Not active'}</span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 bg-green-500 rounded-full mr-3"></div>
                <span className="text-sm sm:text-base text-gray-700">Blockchain: Synchronized</span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 bg-blue-500 rounded-full mr-3"></div>
                <span className="text-sm sm:text-base text-gray-700">Data records: {carDataList.length}</span>
              </div>
            </div>
          </div>

          {/* Quick Stats Card */}
          <div className="bg-white rounded-lg shadow p-4 sm:p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Car Info</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Year:</span>
                <span className="font-medium">{selectedCar.year}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Color:</span>
                <span className="font-medium">{selectedCar.color || 'Not specified'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">VIN:</span>
                <span className="font-medium text-xs">{selectedCar.vin || 'Not specified'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Live Data Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden w-full">
          <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-200">
            <h3 className="text-base sm:text-lg font-semibold text-gray-900">Historical Data</h3>
          </div>
          <div className="overflow-x-auto w-full">
            <table className="w-full table-auto divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/3 md:w-1/4">Time</th>
                  <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Data (JSON)</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {carDataList.length > 0 ? (
                  carDataList
                    .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
                    .map((item) => (
                      <tr key={item.id}>
                        <td className="px-3 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm text-gray-900 w-1/3 md:w-1/4">
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
                        <td className="px-3 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm text-gray-900 max-w-0">
                          <pre className="text-xs whitespace-pre-wrap break-all overflow-auto">{item.carData}</pre>
                        </td>
                      </tr>
                    ))
                ) : (
                  <tr>
                    <td colSpan={2} className="px-6 py-8 text-center text-sm text-gray-500">
                      {isLoading ? 'Loading data...' : 'No data available'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          {/* Pagination Controls */}
          {carDataList.length > itemsPerPage && (
            <div className="px-3 sm:px-6 py-3 sm:py-4 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="text-xs sm:text-sm text-gray-700">
                Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, carDataList.length)} of {carDataList.length} records
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="px-2 sm:px-3 py-1 text-xs sm:text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  ← Previous
                </button>
                <span className="px-2 sm:px-3 py-1 text-xs sm:text-sm text-gray-700">
                  Page {currentPage} of {Math.ceil(carDataList.length / itemsPerPage)}
                </span>
                <button
                  onClick={() => setCurrentPage(p => Math.min(Math.ceil(carDataList.length / itemsPerPage), p + 1))}
                  disabled={currentPage >= Math.ceil(carDataList.length / itemsPerPage)}
                  className="px-2 sm:px-3 py-1 text-xs sm:text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next →
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
