import { useState, useEffect } from 'react'

interface AnalyzedData {
  date: string
  avgSpeed: number
  maxSpeed: number
  distance: number
  fuelConsumption: number
  safetyScore: number
}

export default function AnalyzedDataPage() {
  const [selectedCarId] = useState<number | null>(null)
  const [analyzedData, setAnalyzedData] = useState<AnalyzedData[]>([])

  // TODO: Get selectedCarId from Layout component context
  // TODO: Fetch analyzed data from API
  useEffect(() => {
    if (selectedCarId) {
      // TODO: Fetch analyzed data from API
      setAnalyzedData([
        {
          date: '2024-11-08',
          avgSpeed: 78,
          maxSpeed: 125,
          distance: 234,
          fuelConsumption: 7.2,
          safetyScore: 8.5
        }
      ])
    }
  }, [selectedCarId])

  if (!selectedCarId) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Izvēlieties auto</h2>
          <p className="text-gray-600">Lūdzu, izvēlieties auto no augšējās izvēlnes, lai redzētu tā analizētos datus.</p>
        </div>
      </div>
    )
  }

  return (
    <div>
      <main className="p-6">
        {/* Export section */}
        <div className="mb-6 bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Datu eksports</h2>
          <div className="flex space-x-4">
            <button className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors">
              Eksportēt XLSX
            </button>
            <button className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors">
              Eksportēt CSV
            </button>
          </div>
        </div>

        {/* Analyzed data table */}
        {analyzedData.length > 0 && (
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Analizētie dati</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Datums</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Vid. ātrums</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Max ātrums</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Attālums</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Degv. patēriņš</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Drošības rezultāts</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {analyzedData.map((data, index) => (
                    <tr key={index}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{data.date}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{data.avgSpeed} km/h</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{data.maxSpeed} km/h</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{data.distance} km</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{data.fuelConsumption} L/100km</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{data.safetyScore}/10</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}