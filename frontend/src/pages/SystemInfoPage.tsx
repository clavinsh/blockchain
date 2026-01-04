import { useState, useEffect } from 'react'
import { useCarContext } from '@/contexts/CarContext'
import { telemetryApi, type VehicleTelemetry } from '@/services/api'

export default function SystemInfoPage() {
  const { selectedCarId } = useCarContext()
  const [blockchainData, setBlockchainData] = useState<VehicleTelemetry[]>([])

  useEffect(() => {
    const fetchTelemetryData = async () => {
      if (selectedCarId) {
        try {
          const telemetryData = await telemetryApi.getBlockchainTelemetry(selectedCarId)
          setBlockchainData(telemetryData)
        } catch (err) {
          console.error('Failed to fetch telemetry cache data:', err)
          setBlockchainData([])
        }
      } else {
        setBlockchainData([])
      }
    }

    fetchTelemetryData()
  }, [selectedCarId])

  const exportToJSON = (data: any, filename: string) => {
    const jsonContent = JSON.stringify(data, null, 2)
    const blob = new Blob([jsonContent], { type: 'application/json' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `${filename}.json`
    link.click()
  }

  return (
    <div>
      <main className="p-6">
        {/* Page Header */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900">System Information</h2>
          <p className="text-gray-600">
            Blockchain network status, architecture, and system capabilities
          </p>
        </div>

        <div className="space-y-6">
          {/* Export Button */}
          {selectedCarId && blockchainData.length > 0 ? (
            <div className="flex justify-center sm:justify-end mb-4">
              <button
                onClick={() => exportToJSON(blockchainData, 'system_telemetry')}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Export Telemetry JSON
              </button>
            </div>
          ) : null}

          {/* System Status */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4 sm:p-6">
            <h3 className="text-lg sm:text-xl font-bold text-blue-900 mb-4">System Status</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
              <div className="bg-white rounded-lg p-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-600">Blockchain Network</span>
                  <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold">
                    ✓ Active
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-2">Hyperledger Fabric 2.5</p>
              </div>
              <div className="bg-white rounded-lg p-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-600">Database</span>
                  <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold">
                    ✓ Connected
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-2">MySQL 8.0</p>
              </div>
              <div className="bg-white rounded-lg p-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-600">Telemetry Records</span>
                  <span className="text-lg font-bold text-blue-600">
                    {selectedCarId ? blockchainData.length : '-'}
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  {selectedCarId ? 'Cached for selected car' : 'Select a car to view'}
                </p>
              </div>
              <div className="bg-white rounded-lg p-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-600">API Gateway</span>
                  <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold">
                    ✓ Ready
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-2">Port 3001</p>
              </div>
            </div>
          </div>

          {/* Blockchain Architecture */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Blockchain Architecture</h3>
            <div className="space-y-3 text-sm text-gray-700">
              <div className="flex items-start">
                <span className="font-semibold min-w-32">Channel:</span>
                <span>mychannel</span>
              </div>
              <div className="flex items-start">
                <span className="font-semibold min-w-32">Chaincode:</span>
                <span>vehicle (version 1.0)</span>
              </div>
              <div className="flex items-start">
                <span className="font-semibold min-w-32">Consensus:</span>
                <span>Raft (Orderer)</span>
              </div>
              <div className="flex items-start">
                <span className="font-semibold min-w-32">State DB:</span>
                <span>CouchDB 3.3</span>
              </div>
            </div>
          </div>

          {/* Available Functions */}
          <div className="bg-white rounded-lg shadow p-4 sm:p-6">
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-4">Available Functions</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="border-l-4 border-blue-500 bg-blue-50 rounded-r-lg p-4">
                <h4 className="font-semibold text-gray-900 mb-1">Vehicle Registration</h4>
                <p className="text-xs text-gray-600">Immutable registration history on blockchain ledger</p>
              </div>
              <div className="border-l-4 border-green-500 bg-green-50 rounded-r-lg p-4">
                <h4 className="font-semibold text-gray-900 mb-1">Access Control</h4>
                <p className="text-xs text-gray-600">Decentralized user rights management</p>
              </div>
              <div className="border-l-4 border-purple-500 bg-purple-50 rounded-r-lg p-4">
                <h4 className="font-semibold text-gray-900 mb-1">Telemetry Analysis</h4>
                <p className="text-xs text-gray-600">Driving data processing and report generation</p>
              </div>
              <div className="border-l-4 border-orange-500 bg-orange-50 rounded-r-lg p-4">
                <h4 className="font-semibold text-gray-900 mb-1">Audit Log</h4>
                <p className="text-xs text-gray-600">Complete change history with timestamps</p>
              </div>
            </div>
          </div>

          {/* Data Storage Info */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 sm:p-6">
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3">Data Storage</h3>
            <p className="text-sm text-gray-700 mb-3">
              The system uses a hybrid approach for data storage:
            </p>
            <ul className="space-y-2 text-sm text-gray-600">
              <li className="flex items-start">
                <span><strong>Blockchain:</strong> Car registration metadata, ownership, access rights</span>
              </li>
              <li className="flex items-start">
                <span><strong>MySQL:</strong> Telemetry data cached for faster access and analysis</span>
              </li>
              <li className="flex items-start">
                <span><strong>Benefits:</strong> Blockchain security + SQL query speed</span>
              </li>
            </ul>
          </div>
        </div>
      </main>
    </div>
  )
}
