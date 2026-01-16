import { useState, useEffect } from 'react'
import { useCarContext } from '@/contexts/CarContext'
import {
  telemetryApi,
  type DrivingReport,
  type InsuranceSummary,
  type ResellerSummary
} from '@/services/api'
import RouteMap from '@/components/RouteMap'

export default function AnalyzedDataPage() {
  const { selectedCarId, selectedCar } = useCarContext()
  const [drivingReport, setDrivingReport] = useState<DrivingReport | null>(null)
  const [insuranceSummary, setInsuranceSummary] = useState<InsuranceSummary | null>(null)
  const [resellerSummary, setResellerSummary] = useState<ResellerSummary | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Persist map dates across tab switches
  // Default to full year range
  const [mapFromDate, setMapFromDate] = useState<string>('2025-01-01T00:00')
  const [mapToDate, setMapToDate] = useState<string>('2026-12-31T23:59')
  
  // Option 2: Last 7 days
  // const [mapFromDate, setMapFromDate] = useState<string>(() => {
  //   const date = new Date()
  //   date.setDate(date.getDate() - 7)
  //   return date.toISOString().slice(0, 16)
  // })
  // const [mapToDate, setMapToDate] = useState<string>(() => {
  //   return new Date().toISOString().slice(0, 16)
  // })

  // Get user role from selected car
  const userRole = selectedCar?.roleCode || ''
  const isViewer = userRole === 'VIEWER'

  // Set default tab based on role
  const [activeTab, setActiveTab] = useState<'map' | 'driving' | 'insurance' | 'reseller'>(
    isViewer ? 'insurance' : 'driving'
  )

  const fetchBlockchainData = async (carId: number) => {
    try {
      setIsLoading(true)
      setError(null)

      console.log('Fetching telemetry data for car ID:', carId)

      // Calculate date range for reports (all time)
      const endDate = new Date()
      const startDate = new Date(0)

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
      setDrivingReport(null)
      setInsuranceSummary(null)
      setResellerSummary(null)
    }
  }, [selectedCarId])

  if (!selectedCarId || !selectedCar) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Select a car</h2>
          <p className="text-gray-600">Please select a car from the top menu to see its analyzed data.</p>
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

  const translateWearLevel = (level: string) => {
    const translations: Record<string, string> = {
      'Low': 'Low',
      'Moderate': 'Moderate',
      'High': 'High',
      'Severe': 'Severe'
    }
    return translations[level] || level
  }

  const translateRiskLevel = (level: string) => {
    const translations: Record<string, string> = {
      'VeryLow': 'Very Low',
      'Low': 'Low',
      'Moderate': 'Moderate',
      'High': 'High',
      'VeryHigh': 'Very High'
    }
    return translations[level] || level
  }

  const getRoleLabel = (roleCode: string) => {
    switch (roleCode) {
      case 'OWNER':
        return 'Owner'
      case 'DRIVER':
        return 'Driver'
      case 'VIEWER':
        return 'Viewer'
      default:
        return roleCode
    }
  }

  return (
    <div className="w-full">
      <main className="p-4 sm:p-6">
        {/* Car Info Header */}
        <div className="mb-4 sm:mb-6">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
            Blockchain Telemetry: {selectedCar.brand} {selectedCar.model}
          </h2>
          <p className="text-sm sm:text-base text-gray-600">
            License Plate: {selectedCar.licensePlate} | Role: {getRoleLabel(userRole)}
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800">Error: {error}</p>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="mb-6 border-b border-gray-200 overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
          <nav className="-mb-px flex space-x-4 sm:space-x-8">
            {!isViewer && (
              <button
                onClick={() => setActiveTab('driving')}
                className={`py-3 sm:py-4 px-2 sm:px-1 border-b-2 font-medium text-xs sm:text-sm whitespace-nowrap ${activeTab === 'driving'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
              >
                Driving Report
              </button>
            )}
            <button
              onClick={() => setActiveTab('insurance')}
              className={`py-3 sm:py-4 px-2 sm:px-1 border-b-2 font-medium text-xs sm:text-sm whitespace-nowrap ${activeTab === 'insurance'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
            >
              Insurance Report
            </button>
            <button
              onClick={() => setActiveTab('reseller')}
              className={`py-3 sm:py-4 px-2 sm:px-1 border-b-2 font-medium text-xs sm:text-sm whitespace-nowrap ${activeTab === 'reseller'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
            >
              Reseller Report
            </button>
            <button
              onClick={() => setActiveTab('map')}
              className={`py-3 sm:py-4 px-2 sm:px-1 border-b-2 font-medium text-xs sm:text-sm whitespace-nowrap ${activeTab === 'map'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
            >
              Route Map
            </button>
          </nav>
        </div>

        {isLoading ? (
          <div className="text-center py-12">
            <p className="text-gray-600">Loading data...</p>
          </div>
        ) : (
          <>
            {/* Driving Report Tab */}
            {activeTab === 'driving' && !isViewer && !drivingReport && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-yellow-900 mb-2">⚠️ No data available</h3>
                <p className="text-sm text-yellow-800">
                  This car does not have enough telemetry data to generate a driving report.
                  Add telemetry data to see detailed analysis.
                </p>
              </div>
            )}
            {activeTab === 'driving' && !isViewer && drivingReport && (
              <div className="space-y-6">
                {/* Export Button */}
                <div className="flex justify-end mb-4">
                  <button
                    onClick={() => exportToJSON(drivingReport, 'driving_report')}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    Export JSON
                  </button>
                </div>
                {/* Report Metadata */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="grid grid-cols-1 gap-3 text-sm">
                    <div className="flex flex-col sm:flex-row sm:items-center">
                      <span className="text-gray-600">Report Generated:</span>
                      <span className="sm:ml-2 font-semibold text-gray-900">
                        {new Date(drivingReport.reportGeneratedAt).toLocaleString()}
                      </span>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-center">
                      <span className="text-gray-600">Analysis Period:</span>
                      <span className="sm:ml-2 font-semibold text-gray-900">
                        {new Date(drivingReport.analysisPeriod.startDate).toLocaleDateString()} - {new Date(drivingReport.analysisPeriod.endDate).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-center">
                      <span className="text-gray-600">Data Points:</span>
                      <span className="sm:ml-2 font-semibold text-gray-900">
                        {drivingReport.basicStatistics.dataPointsAnalyzed.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
                {/* Overview Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                  <div className="bg-white rounded-lg shadow p-4 sm:p-6">
                    <h3 className="text-sm font-medium text-gray-600 mb-2">Driving Score</h3>
                    <p className="text-3xl font-bold text-blue-600">{drivingReport.overallDrivingScore.toFixed(1)}</p>
                    <p className="text-xs text-gray-500 mt-1">out of 100</p>
                  </div>
                  <div className="bg-white rounded-lg shadow p-4 sm:p-6">
                    <h3 className="text-sm font-medium text-gray-600 mb-2">Total Distance</h3>
                    <p className="text-2xl font-bold text-gray-900">
                      {drivingReport.basicStatistics.totalDistance.toFixed(1)} km
                    </p>
                    <p className="text-xs text-gray-500 mt-1">{drivingReport.basicStatistics.numberOfTrips} trips</p>
                  </div>
                  <div className="bg-white rounded-lg shadow p-4 sm:p-6">
                    <h3 className="text-sm font-medium text-gray-600 mb-2">Average Speed</h3>
                    <p className="text-2xl font-bold text-gray-900">
                      {drivingReport.basicStatistics.averageSpeed.toFixed(1)} km/h
                    </p>
                    <p className="text-xs text-gray-500 mt-1">Max: {drivingReport.basicStatistics.maxSpeed.toFixed(0)} km/h</p>
                  </div>
                  <div className="bg-white rounded-lg shadow p-4 sm:p-6">
                    <h3 className="text-sm font-medium text-gray-600 mb-2">Fuel Consumption</h3>
                    <p className="text-2xl font-bold text-gray-900">
                      {drivingReport.basicStatistics.fuelConsumption.toFixed(1)} L
                    </p>
                    <p className="text-xs text-gray-500 mt-1">Total consumed</p>
                  </div>
                </div>

                {/* Additional Statistics */}
                <div className="bg-white rounded-lg shadow p-4 sm:p-6">
                  <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-4">Additional Statistics</h3>
                  <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="text-gray-600">Total Driving Time</p>
                      <p className="font-semibold text-gray-900 mt-1">
                        {(() => {
                          const timeStr = drivingReport.basicStatistics.totalDrivingTime;
                          // Parse TimeSpan format (HH:MM:SS or D.HH:MM:SS)
                          const parts = timeStr.split(':');
                          if (parts.length >= 2) {
                            const hoursStr = parts[0].includes('.') ? parts[0].split('.')[1] : parts[0];
                            const hours = parseInt(hoursStr);
                            const minutes = parseInt(parts[1]);
                            return `${hours}h ${minutes}m`;
                          }
                          return timeStr;
                        })()}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-600">Average RPM</p>
                      <p className="font-semibold text-gray-900 mt-1">{drivingReport.basicStatistics.averageRpm}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Max RPM</p>
                      <p className="font-semibold text-gray-900 mt-1">{drivingReport.basicStatistics.maxRpm}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Smooth Driving</p>
                      <p className="font-semibold text-green-600 mt-1">{drivingReport.drivingBehavior.smoothDrivingPercentage.toFixed(1)}%</p>
                    </div>
                  </div>
                </div>

                {/* Risk Assessment */}
                <div className="bg-white rounded-lg shadow p-4 sm:p-6">
                  <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-4">Risk Assessment</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-4">
                    <div>
                      <p className="text-sm text-gray-600">Risk Level</p>
                      <span className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${getRiskLevelColor(drivingReport.riskAssessment.overallRiskLevel)}`}>
                        {translateRiskLevel(drivingReport.riskAssessment.overallRiskLevel)}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Insurance Coefficient</p>
                      <p className="text-lg font-semibold text-gray-900">
                        {drivingReport.riskAssessment.insurancePremiumMultiplier.toFixed(2)}x
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Accident Risk Score</p>
                      <p className="text-lg font-semibold text-orange-600">
                        {drivingReport.riskAssessment.accidentRiskScore.toFixed(1)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Depreciation Rate</p>
                      <p className="text-lg font-semibold text-gray-900">
                        {(drivingReport.riskAssessment.vehicleDepreciationRate * 100).toFixed(1)}%
                      </p>
                    </div>
                  </div>
                  {drivingReport.riskAssessment.riskFactors.length > 0 && (
                    <div className="mt-4">
                      <h4 className="text-sm font-semibold text-gray-900 mb-2">Risk Factors</h4>
                      <ul className="list-disc list-inside space-y-1">
                        {drivingReport.riskAssessment.riskFactors.map((factor, index) => (
                          <li key={index} className="text-sm text-red-700">{factor}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {drivingReport.riskAssessment.positiveFactors.length > 0 && (
                    <div className="mt-4">
                      <h4 className="text-sm font-semibold text-gray-900 mb-2">Positive Factors</h4>
                      <ul className="list-disc list-inside space-y-1">
                        {drivingReport.riskAssessment.positiveFactors.map((factor, index) => (
                          <li key={index} className="text-sm text-green-700">{factor}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                {/* Vehicle Wear */}
                <div className="bg-white rounded-lg shadow p-4 sm:p-6">
                  <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-4">Vehicle Wear Estimate</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
                    <div>
                      <p className="text-sm text-gray-600">Brakes</p>
                      <p className={`text-lg font-semibold ${getWearLevelColor(drivingReport.vehicleWearEstimate.brakeWearLevel)}`}>
                        {translateWearLevel(drivingReport.vehicleWearEstimate.brakeWearLevel)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Engine</p>
                      <p className={`text-lg font-semibold ${getWearLevelColor(drivingReport.vehicleWearEstimate.engineWearLevel)}`}>
                        {translateWearLevel(drivingReport.vehicleWearEstimate.engineWearLevel)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Tires</p>
                      <p className={`text-lg font-semibold ${getWearLevelColor(drivingReport.vehicleWearEstimate.tireWearLevel)}`}>
                        {translateWearLevel(drivingReport.vehicleWearEstimate.tireWearLevel)}
                      </p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t">
                    <div>
                      <p className="text-sm text-gray-600">Transmission Stress</p>
                      <p className="text-lg font-semibold text-gray-900">
                        {drivingReport.vehicleWearEstimate.transmissionStress.toFixed(1)}%
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Est. Maintenance Cost</p>
                      <p className="text-lg font-semibold text-gray-900">
                        €{drivingReport.vehicleWearEstimate.estimatedMaintenanceCost.toFixed(2)}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Driving Behavior Events */}
                {(drivingReport.drivingBehavior.harshBrakingEvents.length > 0 ||
                  drivingReport.drivingBehavior.harshAccelerationEvents.length > 0 ||
                  drivingReport.drivingBehavior.harshCorneringEvents.length > 0 ||
                  drivingReport.drivingBehavior.speedingEvents.length > 0 ||
                  drivingReport.drivingBehavior.overRevvingEvents.length > 0) && (
                  <div className="bg-white rounded-lg shadow p-4 sm:p-6">
                    <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-4">Driving Behavior Events</h3>
                    <div className="grid grid-cols-2 xl:grid-cols-5 gap-4 text-center">
                      <div className="p-3 bg-red-50 rounded-lg">
                        <p className="text-2xl font-bold text-red-600">{drivingReport.drivingBehavior.harshBrakingEvents.length}</p>
                        <p className="text-xs text-gray-600 mt-1">Harsh Braking</p>
                      </div>
                      <div className="p-3 bg-orange-50 rounded-lg">
                        <p className="text-2xl font-bold text-orange-600">{drivingReport.drivingBehavior.harshAccelerationEvents.length}</p>
                        <p className="text-xs text-gray-600 mt-1">Harsh Acceleration</p>
                      </div>
                      <div className="p-3 bg-yellow-50 rounded-lg">
                        <p className="text-2xl font-bold text-yellow-600">{drivingReport.drivingBehavior.harshCorneringEvents.length}</p>
                        <p className="text-xs text-gray-600 mt-1">Harsh Cornering</p>
                      </div>
                      <div className="p-3 bg-purple-50 rounded-lg">
                        <p className="text-2xl font-bold text-purple-600">{drivingReport.drivingBehavior.speedingEvents.length}</p>
                        <p className="text-xs text-gray-600 mt-1">Speeding</p>
                      </div>
                      <div className="p-3 bg-pink-50 rounded-lg">
                        <p className="text-2xl font-bold text-pink-600">{drivingReport.drivingBehavior.overRevvingEvents.length}</p>
                        <p className="text-xs text-gray-600 mt-1">Over-Revving</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Recommendations */}
                {drivingReport.recommendations.length > 0 && (
                  <div className="bg-white rounded-lg shadow p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Recommendations</h3>
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
                <h3 className="text-lg font-semibold text-yellow-900 mb-2">⚠️ No data available</h3>
                <p className="text-sm text-yellow-800">
                  Not enough telemetry data to generate an insurance summary.
                </p>
              </div>
            )}            {activeTab === 'insurance' && insuranceSummary && (
              <div className="space-y-6">
                {/* Export Button */}
                <div className="flex justify-end mb-4">
                  <button
                    onClick={() => exportToJSON(insuranceSummary, 'insurance_report')}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    Export JSON
                  </button>
                </div>
                {/* Report Metadata */}
                <div className="inline-block bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="text-sm">
                    <span className="text-gray-600">Analysis Period:</span>
                    <span className="ml-2 font-semibold text-gray-900">
                      {new Date(insuranceSummary.analysisPeriod.startDate).toLocaleDateString()} - {new Date(insuranceSummary.analysisPeriod.endDate).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
                  <div className="bg-white rounded-lg shadow p-4 sm:p-6">
                    <h3 className="text-sm font-medium text-gray-600 mb-2">Driving Score</h3>
                    <p className="text-3xl font-bold text-blue-600">{insuranceSummary.drivingScore.toFixed(1)}</p>
                  </div>
                  <div className="bg-white rounded-lg shadow p-4 sm:p-6">
                    <h3 className="text-sm font-medium text-gray-600 mb-2">Safety Incidents</h3>
                    <p className="text-3xl font-bold text-orange-600">{insuranceSummary.safetyIncidents}</p>
                  </div>
                  <div className="bg-white rounded-lg shadow p-4 sm:p-6">
                    <h3 className="text-sm font-medium text-gray-600 mb-2">Premium Coefficient</h3>
                    <p className="text-3xl font-bold text-gray-900">
                      {insuranceSummary.recommendedPremiumMultiplier.toFixed(2)}x
                    </p>
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow p-4 sm:p-6">
                  <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-4">Detailed Information</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Risk Level</span>
                      <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getRiskLevelColor(insuranceSummary.riskLevel)}`}>
                        {translateRiskLevel(insuranceSummary.riskLevel)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Total Distance</span>
                      <span className="text-sm font-semibold text-gray-900">{insuranceSummary.totalDistance.toFixed(1)} km</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Smooth Driving</span>
                      <span className="text-sm font-semibold text-gray-900">{insuranceSummary.smoothDrivingPercentage.toFixed(1)}%</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Reseller Summary Tab */}
            {activeTab === 'reseller' && !resellerSummary && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-yellow-900 mb-2">⚠️ No data available</h3>
                <p className="text-sm text-yellow-800">
                  Not enough telemetry data to generate a reseller summary.
                </p>
              </div>
            )}
            {activeTab === 'reseller' && resellerSummary && (
              <div className="space-y-6">
                {/* Export Button */}
                <div className="flex justify-end mb-4">
                  <button
                    onClick={() => exportToJSON(resellerSummary, 'reseller_report')}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    Export JSON
                  </button>
                </div>
                {/* Report Metadata */}
                <div className="inline-block bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="text-sm">
                    <span className="text-gray-600">Analysis Period:</span>
                    <span className="ml-2 font-semibold text-gray-900">
                      {new Date(resellerSummary.analysisPeriod.startDate).toLocaleDateString()} - {new Date(resellerSummary.analysisPeriod.endDate).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                  <div className="bg-white rounded-lg shadow p-4 sm:p-6">
                    <h3 className="text-sm font-medium text-gray-600 mb-2">Driving Score</h3>
                    <p className="text-3xl font-bold text-blue-600">{resellerSummary.drivingScore.toFixed(1)}</p>
                    <p className="text-xs text-gray-500 mt-1">out of 100</p>
                  </div>
                  <div className="bg-white rounded-lg shadow p-4 sm:p-6">
                    <h3 className="text-sm font-medium text-gray-600 mb-2">Condition Rating</h3>
                    <p className="text-2xl font-bold text-gray-900">{resellerSummary.vehicleConditionRating}</p>
                  </div>
                  <div className="bg-white rounded-lg shadow p-4 sm:p-6">
                    <h3 className="text-sm font-medium text-gray-600 mb-2">Total Distance</h3>
                    <p className="text-2xl font-bold text-gray-900">{resellerSummary.totalDistance.toFixed(1)} km</p>
                  </div>
                  <div className="bg-white rounded-lg shadow p-4 sm:p-6">
                    <h3 className="text-sm font-medium text-gray-600 mb-2">Maintenance Costs</h3>
                    <p className="text-2xl font-bold text-gray-900">€{resellerSummary.estimatedMaintenanceCost.toFixed(2)}</p>
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow p-4 sm:p-6">
                  <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-4">Vehicle Value</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Estimated Depreciation Rate</p>
                      <p className="text-2xl font-semibold text-gray-900 mt-1">
                        {(resellerSummary.estimatedDepreciationRate * 100).toFixed(1)}%
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Condition Rating</p>
                      <p className="text-2xl font-semibold text-gray-900 mt-1">
                        {resellerSummary.vehicleConditionRating}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow p-4 sm:p-6">
                  <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-4">Component Condition</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Brakes</p>
                      <p className={`text-lg font-semibold ${getWearLevelColor(resellerSummary.brakeCondition)}`}>
                        {translateWearLevel(resellerSummary.brakeCondition)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Engine</p>
                      <p className={`text-lg font-semibold ${getWearLevelColor(resellerSummary.engineCondition)}`}>
                        {translateWearLevel(resellerSummary.engineCondition)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Tires</p>
                      <p className={`text-lg font-semibold ${getWearLevelColor(resellerSummary.tireCondition)}`}>
                        {translateWearLevel(resellerSummary.tireCondition)}
                      </p>
                    </div>
                  </div>
                </div>

                {resellerSummary.recommendedActions.length > 0 && (
                  <div className="bg-white rounded-lg shadow p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Recommended Actions</h3>
                    <ul className="list-disc list-inside space-y-2">
                      {resellerSummary.recommendedActions.map((action, index) => (
                        <li key={index} className="text-sm text-gray-700">{action}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
            {activeTab === 'map' && (
              <RouteMap 
                carId={selectedCarId} 
                routeColor="red" 
                fromDate={mapFromDate}
                toDate={mapToDate}
                onFromDateChange={setMapFromDate}
                onToDateChange={setMapToDate}
              />
            )}
          </>
        )}
      </main>
    </div>
  )
}
