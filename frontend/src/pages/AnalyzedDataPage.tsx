import { useState, useEffect } from 'react'
import { useCarContext } from '@/contexts/CarContext'
import { 
  telemetryApi, 
  type VehicleTelemetry, 
  type DrivingReport, 
  type InsuranceSummary, 
  type ResellerSummary 
} from '@/services/api'

export default function AnalyzedDataPage() {
  const { selectedCarId, selectedCar } = useCarContext()
  const [blockchainData, setBlockchainData] = useState<VehicleTelemetry[]>([])
  const [drivingReport, setDrivingReport] = useState<DrivingReport | null>(null)
  const [insuranceSummary, setInsuranceSummary] = useState<InsuranceSummary | null>(null)
  const [resellerSummary, setResellerSummary] = useState<ResellerSummary | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'blockchain' | 'driving' | 'insurance' | 'reseller'>('blockchain')

  // Get user role from selected car
  const userRole = selectedCar?.roleCode || ''
  const isViewer = userRole === 'VIEWER'

  const fetchBlockchainData = async (carId: number) => {
    try {
      setIsLoading(true)
      setError(null)
      
      console.log('Fetching telemetry data for car ID:', carId)
      
      // Note: This uses database telemetry, not blockchain
      // The blockchain stores vehicle registration metadata
      setBlockchainData([])

      // Calculate date range for reports (last 30 days)
      const endDate = new Date()
      const startDate = new Date()
      startDate.setDate(startDate.getDate() - 30)

      // Fetch reports based on role
      if (!isViewer) {
        try {
          const report = await telemetryApi.getDrivingReport(carId, startDate, endDate)
          setDrivingReport(report)
        } catch (err) {
          console.error('Failed to fetch driving report:', err)
        }
      }

      try {
        const insurance = await telemetryApi.getInsuranceSummary(carId, startDate, endDate)
        setInsuranceSummary(insurance)
      } catch (err) {
        console.error('Failed to fetch insurance summary:', err)
      }

      try {
        const reseller = await telemetryApi.getResellerSummary(carId, startDate, endDate)
        setResellerSummary(reseller)
      } catch (err) {
        console.error('Failed to fetch reseller summary:', err)
      }
    } catch (err) {
      console.error('Failed to fetch blockchain data:', err)
      const errorMsg = err instanceof Error ? err.message : 'Failed to fetch data'
      console.error('Error details:', errorMsg)
      setError(errorMsg)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (selectedCarId) {
      fetchBlockchainData(selectedCarId)
    } else {
      setBlockchainData([])
      setDrivingReport(null)
      setInsuranceSummary(null)
      setResellerSummary(null)
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

  const exportToJSON = (data: any, filename: string) => {
    const jsonContent = JSON.stringify(data, null, 2)
    const blob = new Blob([jsonContent], { type: 'application/json' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `${selectedCar.brand}_${selectedCar.model}_${filename}.json`
    link.click()
  }

  const getRiskLevelColor = (level: string) => {
    switch (level) {
      case 'VeryLow':
        return 'text-green-600 bg-green-100'
      case 'Low':
        return 'text-green-500 bg-green-50'
      case 'Moderate':
        return 'text-yellow-600 bg-yellow-100'
      case 'High':
        return 'text-orange-600 bg-orange-100'
      case 'VeryHigh':
        return 'text-red-600 bg-red-100'
      default:
        return 'text-gray-600 bg-gray-100'
    }
  }

  const getWearLevelColor = (level: string) => {
    switch (level) {
      case 'Low':
        return 'text-green-600'
      case 'Moderate':
        return 'text-yellow-600'
      case 'High':
        return 'text-orange-600'
      case 'Severe':
        return 'text-red-600'
      default:
        return 'text-gray-600'
    }
  }

  return (
    <div>
      <main className="p-6">
        {/* Car Info Header */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900">
            Blockchain telemetrija: {selectedCar.brand} {selectedCar.model}
          </h2>
          <p className="text-gray-600">
            Numurzīme: {selectedCar.licensePlate} | Loma: {userRole}
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800">Kļūda: {error}</p>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="mb-6 border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('blockchain')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'blockchain'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Blockchain dati ({blockchainData.length})
            </button>
            {!isViewer && (
              <button
                onClick={() => setActiveTab('driving')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'driving'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Braukšanas atskaite
              </button>
            )}
            <button
              onClick={() => setActiveTab('insurance')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'insurance'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Apdrošināšanas atskaite
            </button>
            <button
              onClick={() => setActiveTab('reseller')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'reseller'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Pārdevēja atskaite
            </button>
          </nav>
        </div>

        {isLoading ? (
          <div className="text-center py-12">
            <p className="text-gray-600">Ielādē datus no blockchain...</p>
          </div>
        ) : (
          <>
            {/* Blockchain Data Tab */}
            {activeTab === 'blockchain' && (
              <div>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
                  <h3 className="text-lg font-semibold text-blue-900 mb-2">ℹ️ Blockchain arhitektūra</h3>
                  <p className="text-sm text-blue-800">
                    Šajā projektā blockchain tīkls (Hyperledger Fabric) glabā transportlīdzekļu reģistrācijas metadatus un piekļuves kontroli.
                    Telemetrijas dati tiek glabāti MySQL datubāzē labākai veiktspējai un vaicājumu efektivitātei.
                  </p>
                  <p className="text-sm text-blue-800 mt-2">
                    Blockchain stāvoklis: <span className="font-semibold text-green-700">✓ Aktīvs</span> (Kanāls: mychannel, Chaincode: vehicle)
                  </p>
                </div>

                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Pieejamās funkcijas</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="border rounded-lg p-4">
                      <h4 className="font-semibold text-gray-900 mb-2">🚗 Transportlīdzekļu reģistrācija</h4>
                      <p className="text-sm text-gray-600">Nemainīga reģistrācijas vēsture blockchain tīklā</p>
                    </div>
                    <div className="border rounded-lg p-4">
                      <h4 className="font-semibold text-gray-900 mb-2">🔐 Piekļuves kontrole</h4>
                      <p className="text-sm text-gray-600">Decentralizēta piekļuves tiesību pārvaldība</p>
                    </div>
                    <div className="border rounded-lg p-4">
                      <h4 className="font-semibold text-gray-900 mb-2">📊 Telemetrijas analīze</h4>
                      <p className="text-sm text-gray-600">Skatiet zemāk esošajās cilnēs (kad ir pieejami dati)</p>
                    </div>
                    <div className="border rounded-lg p-4">
                      <h4 className="font-semibold text-gray-900 mb-2">📝 Audita žurnāls</h4>
                      <p className="text-sm text-gray-600">Pilnīga izmaiņu vēsture blockchain ledger'ī</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Driving Report Tab */}
            {activeTab === 'driving' && !isViewer && !drivingReport && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-yellow-900 mb-2">⚠️ Nav pieejamu datu</h3>
                <p className="text-sm text-yellow-800">
                  Šim auto nav pietiekami daudz telemetrijas datu, lai ģenerētu braukšanas atskaiti.
                  Pievienojiet telemetrijas datus, lai redzētu detalizētu analīzi.
                </p>
              </div>
            )}
            {activeTab === 'driving' && !isViewer && drivingReport && (
              <div className="space-y-6">
                {/* Overview Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-white rounded-lg shadow p-6">
                    <h3 className="text-sm font-medium text-gray-600 mb-2">Braukšanas rezultāts</h3>
                    <p className="text-3xl font-bold text-blue-600">{drivingReport.overallDrivingScore.toFixed(1)}</p>
                    <p className="text-xs text-gray-500 mt-1">no 100</p>
                  </div>
                  <div className="bg-white rounded-lg shadow p-6">
                    <h3 className="text-sm font-medium text-gray-600 mb-2">Kopējais attālums</h3>
                    <p className="text-2xl font-bold text-gray-900">
                      {drivingReport.basicStatistics.totalDistance.toFixed(1)} km
                    </p>
                  </div>
                  <div className="bg-white rounded-lg shadow p-6">
                    <h3 className="text-sm font-medium text-gray-600 mb-2">Vidējais ātrums</h3>
                    <p className="text-2xl font-bold text-gray-900">
                      {drivingReport.basicStatistics.averageSpeed.toFixed(1)} km/h
                    </p>
                  </div>
                </div>

                {/* Risk Assessment */}
                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Riska novērtējums</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Riska līmenis</p>
                      <span className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${getRiskLevelColor(drivingReport.riskAssessment.overallRiskLevel)}`}>
                        {drivingReport.riskAssessment.overallRiskLevel}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Apdrošināšanas koeficients</p>
                      <p className="text-lg font-semibold text-gray-900">
                        {drivingReport.riskAssessment.insurancePremiumMultiplier.toFixed(2)}x
                      </p>
                    </div>
                  </div>
                </div>

                {/* Vehicle Wear */}
                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Transportlīdzekļa nolietojums</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Bremzes</p>
                      <p className={`text-lg font-semibold ${getWearLevelColor(drivingReport.vehicleWearEstimate.brakeWearLevel)}`}>
                        {drivingReport.vehicleWearEstimate.brakeWearLevel}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Motors</p>
                      <p className={`text-lg font-semibold ${getWearLevelColor(drivingReport.vehicleWearEstimate.engineWearLevel)}`}>
                        {drivingReport.vehicleWearEstimate.engineWearLevel}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Riepas</p>
                      <p className={`text-lg font-semibold ${getWearLevelColor(drivingReport.vehicleWearEstimate.tireWearLevel)}`}>
                        {drivingReport.vehicleWearEstimate.tireWearLevel}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Recommendations */}
                {drivingReport.recommendations.length > 0 && (
                  <div className="bg-white rounded-lg shadow p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Ieteikumi</h3>
                    <ul className="list-disc list-inside space-y-2">
                      {drivingReport.recommendations.map((rec, index) => (
                        <li key={index} className="text-sm text-gray-700">{rec}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {/* Insurance Summary Tab */}
            {activeTab === 'insurance' && !insuranceSummary && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-yellow-900 mb-2">⚠️ Nav pieejamu datu</h3>
                <p className="text-sm text-yellow-800">
                  Nav pietiekami daudz telemetrijas datu, lai ģenerētu apdrošināšanas kopsavilkumu.
                </p>
              </div>
            )}
            {activeTab === 'insurance' && insuranceSummary && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-white rounded-lg shadow p-6">
                    <h3 className="text-sm font-medium text-gray-600 mb-2">Braukšanas rezultāts</h3>
                    <p className="text-3xl font-bold text-blue-600">{insuranceSummary.drivingScore.toFixed(1)}</p>
                  </div> 
                  <div className="bg-white rounded-lg shadow p-6">
                    <h3 className="text-sm font-medium text-gray-600 mb-2">Drošības incidenti</h3>
                    <p className="text-3xl font-bold text-orange-600">{insuranceSummary.safetyIncidents}</p>
                  </div>
                  <div className="bg-white rounded-lg shadow p-6">
                    <h3 className="text-sm font-medium text-gray-600 mb-2">Prēmijas koeficients</h3>
                    <p className="text-3xl font-bold text-gray-900">
                      {insuranceSummary.recommendedPremiumMultiplier.toFixed(2)}x
                    </p>
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Detalizēta informācija</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Riska līmenis</span>
                      <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getRiskLevelColor(insuranceSummary.riskLevel)}`}>
                        {insuranceSummary.riskLevel}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Kopējais attālums</span>
                      <span className="text-sm font-semibold text-gray-900">{insuranceSummary.totalDistance.toFixed(1)} km</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Vienmērīga braukšana</span>
                      <span className="text-sm font-semibold text-gray-900">{insuranceSummary.smoothDrivingPercentage.toFixed(1)}%</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Reseller Summary Tab */}
            {activeTab === 'reseller' && !resellerSummary && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-yellow-900 mb-2">⚠️ Nav pieejamu datu</h3>
                <p className="text-sm text-yellow-800">
                  Nav pietiekami daudz telemetrijas datu, lai ģenerētu pārdevēja kopsavilkumu.
                </p>
              </div>
            )}
            {activeTab === 'reseller' && resellerSummary && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-white rounded-lg shadow p-6">
                    <h3 className="text-sm font-medium text-gray-600 mb-2">Braukšanas rezultāts</h3>
                    <p className="text-3xl font-bold text-blue-600">{resellerSummary.drivingScore.toFixed(1)}</p>
                  </div>
                  <div className="bg-white rounded-lg shadow p-6">
                    <h3 className="text-sm font-medium text-gray-600 mb-2">Stāvokļa novērtējums</h3>
                    <p className="text-2xl font-bold text-gray-900">{resellerSummary.vehicleConditionRating}</p>
                  </div>
                  <div className="bg-white rounded-lg shadow p-6">
                    <h3 className="text-sm font-medium text-gray-600 mb-2">Apkopes izmaksas</h3>
                    <p className="text-2xl font-bold text-gray-900">€{resellerSummary.estimatedMaintenanceCost.toFixed(2)}</p>
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Komponenšu stāvoklis</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Bremzes</p>
                      <p className={`text-lg font-semibold ${getWearLevelColor(resellerSummary.brakeCondition)}`}>
                        {resellerSummary.brakeCondition}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Motors</p>
                      <p className={`text-lg font-semibold ${getWearLevelColor(resellerSummary.engineCondition)}`}>
                        {resellerSummary.engineCondition}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Riepas</p>
                      <p className={`text-lg font-semibold ${getWearLevelColor(resellerSummary.tireCondition)}`}>
                        {resellerSummary.tireCondition}
                      </p>
                    </div>
                  </div>
                </div>

                {resellerSummary.recommendedActions.length > 0 && (
                  <div className="bg-white rounded-lg shadow p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Ieteiktās darbības</h3>
                    <ul className="list-disc list-inside space-y-2">
                      {resellerSummary.recommendedActions.map((action, index) => (
                        <li key={index} className="text-sm text-gray-700">{action}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  )
}
