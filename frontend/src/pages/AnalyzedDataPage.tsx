import { useState, useEffect } from 'react'
import { useCarContext } from '@/contexts/CarContext'
import { carApi, type CarDataItem } from '@/services/api'

export default function AnalyzedDataPage() {
  const { selectedCarId, selectedCar } = useCarContext()
  const [carDataList, setCarDataList] = useState<CarDataItem[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const fetchCarData = async (carId: number) => {
    try {
      setIsLoading(true)
      const response = await carApi.getCarData(carId, 100) // Fetch more data for analysis

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
          <p className="text-gray-600">Lūdzu, izvēlieties auto no augšējās izvēlnes, lai redzētu tā analizētos datus.</p>
        </div>
      </div>
    )
  }

  const exportToCSV = () => {
    const headers = ['Laiks', 'Dati']
    const rows = carDataList.map(item => [
      item.insertTime ? new Date(item.insertTime).toISOString() : '',
      item.carData
    ])

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `${selectedCar.brand}_${selectedCar.model}_${selectedCar.licensePlate}_data.csv`
    link.click()
  }

  const exportToJSON = () => {
    const jsonContent = JSON.stringify(carDataList, null, 2)
    const blob = new Blob([jsonContent], { type: 'application/json' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `${selectedCar.brand}_${selectedCar.model}_${selectedCar.licensePlate}_data.json`
    link.click()
  }

  return (
    <div>
      <main className="p-6">
        {/* Car Info Header */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900">
            Analizētie dati: {selectedCar.brand} {selectedCar.model}
          </h2>
          <p className="text-gray-600">
            Numurzīme: {selectedCar.licensePlate} | Ierakstu skaits: {carDataList.length}
          </p>
        </div>

        {/* Export section */}
        <div className="mb-6 bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Datu eksports</h2>
          <div className="flex space-x-4">
            <button
              onClick={exportToCSV}
              disabled={carDataList.length === 0}
              className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              Eksportēt CSV
            </button>
            <button
              onClick={exportToJSON}
              disabled={carDataList.length === 0}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              Eksportēt JSON
            </button>
          </div>
          <p className="text-sm text-gray-500 mt-2">
            Eksportēt visus {carDataList.length} ierakstus no datubāzes
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-sm font-medium text-gray-600 mb-2">Kopējie ieraksti</h3>
            <p className="text-3xl font-bold text-gray-900">{carDataList.length}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-sm font-medium text-gray-600 mb-2">Vecākais ieraksts</h3>
            <p className="text-lg font-semibold text-gray-900">
              {carDataList.length > 0 && carDataList[carDataList.length - 1].insertTime
                ? new Date(carDataList[carDataList.length - 1].insertTime!).toLocaleDateString('lv-LV')
                : 'Nav datu'}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-sm font-medium text-gray-600 mb-2">Jaunākais ieraksts</h3>
            <p className="text-lg font-semibold text-gray-900">
              {carDataList.length > 0 && carDataList[0].insertTime
                ? new Date(carDataList[0].insertTime!).toLocaleDateString('lv-LV')
                : 'Nav datu'}
            </p>
          </div>
        </div>

        {/* Analyzed data table */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Visi dati</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Laiks</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Dati (JSON)</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {isLoading ? (
                  <tr>
                    <td colSpan={3} className="px-6 py-8 text-center text-sm text-gray-500">
                      Ielādē datus...
                    </td>
                  </tr>
                ) : carDataList.length > 0 ? (
                  carDataList.map((data) => (
                    <tr key={data.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{data.id}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {data.insertTime ? new Date(data.insertTime).toLocaleString('lv-LV') : '-'}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        <pre className="text-xs overflow-x-auto max-w-2xl">{data.carData}</pre>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={3} className="px-6 py-8 text-center text-sm text-gray-500">
                      Nav pieejamu datu
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
