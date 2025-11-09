export default function AnalyzedDataPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <h1 className="text-2xl font-bold text-gray-900">Analizētie dati</h1>
            <nav className="flex space-x-6">
              <a href="/dashboard" className="text-gray-600 hover:text-gray-900">Dashboard</a>
              <a href="/analyzed-data" className="text-blue-600 font-medium">Analizētie dati</a>
              <a href="/car-manager" className="text-gray-600 hover:text-gray-900">Auto pārvaldnieks</a>
              <a href="/reports" className="text-gray-600 hover:text-gray-900">Mani atskaites</a>
            </nav>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
            <div className="flex items-center space-x-2">
              <label htmlFor="dateFrom" className="text-sm text-gray-600">No:</label>
              <input type="date" id="dateFrom" className="border border-gray-300 rounded-md px-3 py-2 text-sm" />
              <label htmlFor="dateTo" className="text-sm text-gray-600">Līdz:</label>
              <input type="date" id="dateTo" className="border border-gray-300 rounded-md px-3 py-2 text-sm" />
            </div>
          </div>
        </div>

        {/* Analysis charts section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Ātruma analīze</h3>
            <div className="h-64 bg-gray-100 rounded-lg flex items-center justify-center">
              <span className="text-gray-500">Ātruma grafiks (Chart.js/Recharts)</span>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Degvielas patēriņš</h3>
            <div className="h-64 bg-gray-100 rounded-lg flex items-center justify-center">
              <span className="text-gray-500">Degvielas grafiks</span>
            </div>
          </div>
        </div>

        {/* Analyzed data table */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
            <h3 className="text-lg font-semibold text-gray-900">Apstrādātie dati</h3>
            <div className="flex space-x-2">
              <select className="border border-gray-300 rounded-md px-3 py-2 text-sm">
                <option value="all">Visi dati</option>
                <option value="speed">Ātruma dati</option>
                <option value="fuel">Degvielas dati</option>
                <option value="temperature">Temperatūras dati</option>
              </select>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Datums</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vid. ātrums</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Max ātrums</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nobraukums</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Degvielas patēriņš</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Drošības rezultāts</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                <tr>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">2024-11-08</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">78 km/h</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">125 km/h</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">234 km</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">7.2 L/100km</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                      Labs (8.5/10)
                    </span>
                  </td>
                </tr>
                <tr>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">2024-11-07</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">82 km/h</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">140 km/h</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">189 km</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">7.8 L/100km</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
                      Vidējs (6.8/10)
                    </span>
                  </td>
                </tr>
                <tr>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">2024-11-06</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">75 km/h</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">118 km/h</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">156 km</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">6.9 L/100km</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                      Labs (9.2/10)
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}