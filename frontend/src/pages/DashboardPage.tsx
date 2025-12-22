import { useState, useEffect } from 'react'
import { useCarContext } from '@/contexts/CarContext'
import { carApi, type CarDataItem } from '@/services/api'

export default function DashboardPage() {
  const { selectedCarId, selectedCar } = useCarContext()
  const [carDataList, setCarDataList] = useState<CarDataItem[]>([])
  const [isLoading, setIsLoading] = useState(false)

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
    } else {
      setCarDataList([])
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
                {Object.entries(parsedLatestData).slice(0, 5).map(([key, value]) => (
                  <div key={key} className="flex justify-between">
                    <span className="text-gray-600 capitalize">{key}:</span>
                    <span className="font-medium">{String(value)}</span>
                  </div>
                ))}
                <div className="text-xs text-gray-500 mt-4">
                  Pēdējā atjaunināšana: {latestData?.insertTime ? new Date(latestData.insertTime).toLocaleString('lv-LV') : 'Nav zināms'}
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
                  carDataList.map((item) => (
                    <tr key={item.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {item.insertTime ? new Date(item.insertTime).toLocaleString('lv-LV') : '-'}
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
        </div>
      </main>
    </div>
  )
}
