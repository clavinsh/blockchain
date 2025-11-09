export default function CarManagerPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <h1 className="text-2xl font-bold text-gray-900">Auto pārvaldnieks</h1>
            <nav className="flex space-x-6">
              <a href="/dashboard" className="text-gray-600 hover:text-gray-900">Dashboard</a>
              <a href="/analyzed-data" className="text-gray-600 hover:text-gray-900">Analizētie dati</a>
              <a href="/car-manager" className="text-blue-600 font-medium">Auto pārvaldnieks</a>
              <a href="/reports" className="text-gray-600 hover:text-gray-900">Mani atskaites</a>
            </nav>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* My Cars Section */}
        <div className="mb-8 bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Manas mašīnas</h2>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Car 1 */}
              <div className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-gray-900">BMW X5</h3>
                  <span className="text-sm text-gray-500">ABC-123</span>
                </div>
                <div className="space-y-2 text-sm text-gray-600">
                  <div>VIN: WBAFR9C50DD123456</div>
                  <div>Reģistrēta: 2024-01-15</div>
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                    <span>Aktīva</span>
                  </div>
                </div>
                <button className="mt-3 w-full bg-blue-600 text-white py-2 px-4 rounded-md text-sm hover:bg-blue-700">
                  Pārvaldīt piekļuvi
                </button>
              </div>

              {/* Car 2 */}
              <div className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-gray-900">Audi A4</h3>
                  <span className="text-sm text-gray-500">DEF-456</span>
                </div>
                <div className="space-y-2 text-sm text-gray-600">
                  <div>VIN: WAUZZZF4XHA789012</div>
                  <div>Reģistrēta: 2024-02-20</div>
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                    <span>Aktīva</span>
                  </div>
                </div>
                <button className="mt-3 w-full bg-blue-600 text-white py-2 px-4 rounded-md text-sm hover:bg-blue-700">
                  Pārvaldīt piekļuvi
                </button>
              </div>

              {/* Add new car */}
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 flex flex-col items-center justify-center text-gray-500">
                <div className="text-2xl mb-2">+</div>
                <div className="text-sm text-center">
                  <div>Pievienot jaunu auto</div>
                  <button className="mt-2 text-blue-600 hover:text-blue-500">
                    Reģistrēt aparātu
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Access Management Section */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Piekļuves pārvaldība</h2>
            <p className="text-sm text-gray-600 mt-1">
              Norādiet, kuriem lietotājiem (apdrošinātājiem) ir piekļuve jūsu auto datiem
            </p>
          </div>
          
          <div className="p-6">
            {/* Car Selection */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Izvēlieties auto:
              </label>
              <select className="border border-gray-300 rounded-md px-3 py-2 w-full md:w-auto">
                <option value="">Izvēlieties auto</option>
                <option value="car1">BMW X5 (ABC-123)</option>
                <option value="car2">Audi A4 (DEF-456)</option>
              </select>
            </div>

            {/* Current Access */}
            <div className="mb-6">
              <h3 className="text-md font-semibold text-gray-900 mb-3">Pašreizējā piekļuve</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                      <span className="text-blue-600 font-semibold text-sm">IF</span>
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">IF Apdrošināšana</div>
                      <div className="text-sm text-gray-600">Pilna piekļuve datiem</div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
                      Aktīva
                    </span>
                    <button className="text-red-600 hover:text-red-800 text-sm">
                      Noņemt
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center mr-3">
                      <span className="text-green-600 font-semibold text-sm">BT</span>
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">Baltijas Apdrošināšana</div>
                      <div className="text-sm text-gray-600">Ierobežota piekļuve</div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs font-medium rounded-full">
                      Gaidošs
                    </span>
                    <button className="text-blue-600 hover:text-blue-800 text-sm">
                      Apstiprināt
                    </button>
                    <button className="text-red-600 hover:text-red-800 text-sm">
                      Noraidīt
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Add New Access */}
            <div>
              <h3 className="text-md font-semibold text-gray-900 mb-3">Pievienot jaunu piekļuvi</h3>
              <div className="flex space-x-4">
                <input
                  type="email"
                  placeholder="Apdrošinātāja e-pasts"
                  className="flex-1 border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <select className="border border-gray-300 rounded-md px-3 py-2">
                  <option value="full">Pilna piekļuve</option>
                  <option value="limited">Ierobežota piekļuve</option>
                  <option value="basic">Pamata dati</option>
                </select>
                <button className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">
                  Pievienot
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Lietotājs saņems uzaicinājumu un varēs pieprasīt piekļuvi jūsu auto datiem
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}