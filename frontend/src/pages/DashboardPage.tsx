import { useState, useEffect } from 'react'
import { useCarContext } from '@/contexts/CarContext'
import { carApi, type CarDataItem } from '@/services/api'
import { telemetryApiReport } from '@/services/api'
import { MapContainer, Popup, TileLayer, Polyline, useMap, CircleMarker } from 'react-leaflet'


export default function DashboardPage() {
  const { selectedCarId, selectedCar } = useCarContext()
  const [routeData, setRouteData] = useState<any>(null)
  const [carDataList, setCarDataList] = useState<CarDataItem[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10
  const [routeDataError, setRouteDataError] = useState<string | null>(null)

  const [routeFromDate, setRouteFromDate] = useState<string>("")
  const [routeToDate, setRouteToDate] = useState<string>("")

  const translateError = (msg?: string) => {
    if (msg?.includes('No route data found for the specified period')) return 'Nav maršruta datu norādītajā periodā'
    if (msg?.includes('invalid date')) return 'Nederīgs datums'
    return 'Notikusi kļūda'
  }

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

  const fetchCarRouteData = async (carId: number, fromIso: string, toIso: string) => {
    try {
      setIsLoading(true)
      const response = await telemetryApiReport.getRouteData(carId, new Date(fromIso), new Date(toIso))
      if (response) {
        setRouteData(response)
        setRouteDataError(null)
      }
    } catch (error) {
      setRouteDataError(translateError((error as Error).message))
      setRouteData(null)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (selectedCarId) {
      fetchCarRouteData(selectedCarId, routeFromDate, routeToDate)
    } else {
      setRouteData(null)
    }
  }, [selectedCarId, routeFromDate, routeToDate])

  function RouteLayer({ points }: { points: any[] }) {

    const map = useMap()

    useEffect(() => {
      if (!points || points.length === 0) return
      const latlngs = points.map(p => [Number(p.latitude), Number(p.longitude)]) as [number, number][]
      map.fitBounds(latlngs, { padding: [40, 40] })
    }, [points, map])

    return (
      <>
        <Polyline positions={points.map(p => [Number(p.latitude), Number(p.longitude)])} pathOptions={{ color: 'blue' }} />
        {points.map((p, i) => (
          <CircleMarker
            key={i}
            center={[Number(p.latitude), Number(p.longitude)]}
            radius={2}
            pathOptions={{ color: 'blue', fillColor: 'blue', fillOpacity: 0.9 }}
            eventHandlers={{
              mouseover: (e) => { (e.target as any).openPopup(); },
              mouseout: (e) => { (e.target as any).closePopup(); },
            }}
          >
            <Popup>
              <div className="text-sm space-y-1">
                <div>{new Date(p.timestamp).toLocaleString()}</div>
                <div>Ātrums: {p.speedKmh ?? p.speed ?? '-'} km/h</div>
                <div>Augstums: {p.altitude ?? '-'} m</div>
              </div>
            </Popup>
          </CircleMarker>
        ))}
      </>
    )
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

        {/* Route Map Component */}
        <div className="mt-8 bg-white rounded-lg shadow p-6">
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Maršruta karte</h3>
            <p className="text-gray-400 text-sm">
              Izvēlieties sākuma un beigu datumu un laiku, lai skatītu mašīnas maršrutu šajā periodā.
            </p>
          </div>
          {/* Date/time controls for route */}
          <div className="mb-4 flex flex-wrap items-end gap-3">
            <label className="text-sm">
              <div className="text-xs text-gray-600">Sākuma datums un laiks</div>
              <input type="hidden" id="timezone" name="timezone" value="-08:00" />
              <input
                type="datetime-local"
                value={routeFromDate}
                onChange={(e) => setRouteFromDate(e.target.value)}
                className="border px-2 py-1 rounded"
              />
            </label>
            <label className="text-sm">
              <div className="text-xs text-gray-600">Beigu datums un laiks</div>
              <input
                type="datetime-local"
                value={routeToDate}
                onChange={(e) => setRouteToDate(e.target.value)}
                className="border px-2 py-1 rounded"
              />
            </label>
            <div className="text-sm text-gray-500 ml-2">{routeData?.points?.length ?? 0} mērījumi</div>
            <div className="text-sm text-red-500 ml-2">{routeDataError}</div>
          </div>
          {/* Map for route */}
          <div id="map">
            <MapContainer
              center={
                routeData?.points && routeData.points.length > 0
                  ? [Number(routeData.points[0].latitude), Number(routeData.points[0].longitude)]
                  : [56.9496, 24.1052]               
                }
              zoom={13}
              scrollWheelZoom={true}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              {routeData?.points && routeData.points.length > 0 && (
                <RouteLayer points={routeData.points} />
              )}
            </MapContainer>
          </div>
        </div>
      </main>
    </div>
  )
}
