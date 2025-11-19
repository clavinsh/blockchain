import { useState } from 'react'
import { Button } from '@/components/ui/button'

interface UserCar {
  carId: number
  brand: string
  model: string
  year: number
  licensePlate: string
  vin: string
  role: 'MASTER_OWNER' | 'OWNER' | 'VIEWER'
  assignedAt: string
}

export default function CarManagerPage() {
  const [userCars] = useState<UserCar[]>([])
  const [selectedCarId, setSelectedCarId] = useState<number | null>(null)
  const [newInviteEmail, setNewInviteEmail] = useState('')
  const [newInviteRole, setNewInviteRole] = useState<'OWNER' | 'VIEWER'>('VIEWER')

  // TODO: Load user's cars from API
  // TODO: Load car users when car is selected
  
  const selectedCar = userCars.find(car => car.carId === selectedCarId)
  const canInviteUsers = selectedCar?.role === 'MASTER_OWNER' || selectedCar?.role === 'OWNER'

  return (
    <div>
      <main className="p-6">
        {/* My Cars Section */}
        <div className="mb-8 bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Manas mašīnas</h2>
          </div>
          <div className="p-6">
            {userCars.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p>Jums nav piekļuves nevienai mašīnai.</p>
                <p className="text-sm mt-2">Lūdziet citam lietotājam jūs uzaicināt.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {userCars.map((car) => (
                  <div 
                    key={car.carId}
                    className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                      selectedCarId === car.carId 
                        ? 'border-blue-500 bg-blue-50' 
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => setSelectedCarId(car.carId)}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-semibold text-gray-900">{car.brand} {car.model}</h3>
                      <span className="text-sm text-gray-500">{car.licensePlate}</span>
                    </div>
                    <div className="space-y-2 text-sm text-gray-600">
                      <div>VIN: {car.vin}</div>
                      <div>Gads: {car.year}</div>
                      <div className="flex items-center justify-between">
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          car.role === 'MASTER_OWNER' ? 'bg-purple-100 text-purple-800' :
                          car.role === 'OWNER' ? 'bg-blue-100 text-blue-800' :
                          'bg-green-100 text-green-800'
                        }`}>
                          {car.role === 'MASTER_OWNER' ? 'Galvenais īpašnieks' :
                           car.role === 'OWNER' ? 'Īpašnieks' : 'Skatītājs'}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Access Management Section */}
        {selectedCarId && (
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Piekļuves pārvaldība</h2>
              <p className="text-sm text-gray-600 mt-1">
                Pārvaldīt lietotājus, kuriem ir piekļuve auto: {selectedCar?.brand} {selectedCar?.model} ({selectedCar?.licensePlate})
              </p>
            </div>
            
            <div className="p-6">

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
              {canInviteUsers && (
                <div>
                  <h3 className="text-md font-semibold text-gray-900 mb-3">Uzaicināt jaunu lietotāju</h3>
                  <div className="flex space-x-4">
                    <input
                      type="email"
                      placeholder="Lietotāja e-pasts"
                      value={newInviteEmail}
                      onChange={(e) => setNewInviteEmail(e.target.value)}
                      className="flex-1 border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                    <select 
                      value={newInviteRole} 
                      onChange={(e) => setNewInviteRole(e.target.value as 'OWNER' | 'VIEWER')}
                      className="border border-gray-300 rounded-md px-3 py-2"
                    >
                      {selectedCar?.role === 'MASTER_OWNER' && (
                        <option value="OWNER">Īpašnieks</option>
                      )}
                      <option value="VIEWER">Skatītājs</option>
                    </select>
                    <Button 
                      onClick={() => {
                        // TODO: Send invite API call
                        console.log('Sending invite to:', newInviteEmail, 'with role:', newInviteRole)
                        setNewInviteEmail('')
                      }}
                      disabled={!newInviteEmail}
                    >
                      Uzaicināt
                    </Button>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    Lietotājs saņems uzaicinājumu un varēs pieņemt vai noraidīt piekļuvi
                  </p>
                </div>
              )}

              {/* Current Users List - TODO: Implement */}
              <div className="mb-6">
                <h3 className="text-md font-semibold text-gray-900 mb-3">Pašreizējie lietotāji</h3>
                <div className="text-gray-500 text-sm">
                  Lietotāju saraksts tiks pievienots pēc API integrācijas.
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}