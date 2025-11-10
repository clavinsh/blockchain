export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header with car selection */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
              <div className="ml-8">
                <select className="border border-gray-300 rounded-md px-3 py-2 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">Izvēlieties auto</option>
                  <option value="car1">BMW X5 (ABC-123)</option>
                  <option value="car2">Audi A4 (DEF-456)</option>
                  <option value="car3">Mercedes C-Class (GHI-789)</option>
                </select>
              </div>
            </div>
            <nav className="flex space-x-6">
              <a href="/dashboard" className="text-blue-600 font-medium">Dashboard</a>
              <a href="/analyzed-data" className="text-gray-600 hover:text-gray-900">Analizētie dati</a>
              <a href="/car-manager" className="text-gray-600 hover:text-gray-900">Auto pārvaldnieks</a>
              <a href="/reports" className="text-gray-600 hover:text-gray-900">Mani atskaites</a>
            </nav>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {/* Live Data Card */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Aktuālie dati</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Ātrums:</span>
                <span className="font-medium">85 km/h</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Dzinēja temp.:</span>
                <span className="font-medium">92°C</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Degvielas līmenis:</span>
                <span className="font-medium">67%</span>
              </div>
              <div className="text-xs text-gray-500 mt-4">
                Pēdējā atjaunināšana: 14:32
              </div>
            </div>
          </div>

          {/* System Status Card */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Sistēmas statuss</h3>
            <div className="space-y-3">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-green-500 rounded-full mr-3"></div>
                <span className="text-gray-700">Sensori: Aktīvi</span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 bg-green-500 rounded-full mr-3"></div>
                <span className="text-gray-700">Blockchain: Sinhronizēts</span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 bg-yellow-500 rounded-full mr-3"></div>
                <span className="text-gray-700">Kešatmiņa: 89% aizpildīta</span>
              </div>
            </div>
          </div>

          {/* Quick Stats Card */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Statistika</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Šodien nobraukts:</span>
                <span className="font-medium">127 km</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Vidējais ātrums:</span>
                <span className="font-medium">78 km/h</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Degvielas patēriņš:</span>
                <span className="font-medium">7.2 L/100km</span>
              </div>
            </div>
          </div>
        </div>

        {/* Live Data Table */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Tiešraides dati (atjauninās ik pa 15 min)</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Laiks</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ātrums</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Dzinēja temp.</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Degviela</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">GPS</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                <tr>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">14:30:15</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">87 km/h</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">91°C</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">68%</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">56.9677, 24.1056</td>
                </tr>
                <tr>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">14:15:15</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">82 km/h</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">89°C</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">69%</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">56.9723, 24.1089</td>
                </tr>
                <tr>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">14:00:15</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">75 km/h</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">87°C</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">71%</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">56.9812, 24.1123</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}