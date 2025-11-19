import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { useCarContext } from '@/contexts/CarContext'

export default function CarManagerPage() {
  const { userCars, selectedCarId, setSelectedCarId } = useCarContext()
  const [newInviteEmail, setNewInviteEmail] = useState('')
  const [newInviteRole, setNewInviteRole] = useState<'OWNER' | 'VIEWER'>('VIEWER')

  const selectedCar = userCars.find(car => car.carId === selectedCarId)

  // For now, we'll assume all users have viewer access since we don't have role in Users2Car yet
  // You can add a Role field to Users2Car table later
  const canInviteUsers = true // Can be updated when role system is implemented

  const handleInvite = () => {
    // TODO: Implement API call to send invite
    console.log('Sending invite to:', newInviteEmail, 'with role:', newInviteRole, 'for car:', selectedCarId)
    alert(`Uzaicinājuma funkcionalitāte tiks pievienota nākotnē.\nE-pasts: ${newInviteEmail}\nLoma: ${newInviteRole}`)
    setNewInviteEmail('')
  }

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
                    className={`border rounded-lg p-4 cursor-pointer transition-colors ${selectedCarId === car.carId
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
                      <div>VIN: {car.vin || 'Nav norādīts'}</div>
                      <div>Gads: {car.year}</div>
                      <div>Krāsa: {car.color || 'Nav norādīta'}</div>
                      <div>Nobraukums: {car.mileage.toLocaleString()} km</div>
                      <div className="flex items-center justify-between pt-2">
                        <span className="text-xs text-gray-500">
                          Pievienots: {car.assignedAt ? new Date(car.assignedAt).toLocaleDateString('lv-LV') : 'Nav zināms'}
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
        {selectedCarId && selectedCar && (
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Piekļuves pārvaldība</h2>
              <p className="text-sm text-gray-600 mt-1">
                Pārvaldīt lietotājus, kuriem ir piekļuve auto: {selectedCar.brand} {selectedCar.model} ({selectedCar.licensePlate})
              </p>
            </div>

            <div className="p-6">
              {/* Add New Access */}
              {canInviteUsers && (
                <div className="mb-6">
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
                      <option value="OWNER">Īpašnieks</option>
                      <option value="VIEWER">Skatītājs</option>
                    </select>
                    <Button
                      onClick={handleInvite}
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

              {/* Current Users List */}
              <div className="mb-6">
                <h3 className="text-md font-semibold text-gray-900 mb-3">Pašreizējie lietotāji</h3>
                <div className="space-y-3">
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                    <p className="text-sm text-gray-600">
                      Lietotāju pārvaldības funkcionalitāte tiks pievienota nākotnē.
                    </p>
                    {/* <p className="text-sm text-gray-600 mt-2">
                      Lai to īstenotu, ir nepieciešams:
                    </p>
                    <ul className="list-disc list-inside text-sm text-gray-600 mt-2 space-y-1">
                      <li>Pievienot Role lauku Users2Car tabulā</li>
                      <li>Izveidot API endpoint lietotāju uzaicinājumiem</li>
                      <li>Izveidot API endpoint esošo lietotāju sarakstam</li>
                      <li>Izveidot paziņojumu sistēmu uzaicinājumiem</li>
                    </ul> */}
                  </div>
                </div>
              </div>

              {/* Car Details */}
              <div>
                <h3 className="text-md font-semibold text-gray-900 mb-3">Mašīnas detaļas</h3>
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-2">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-sm font-medium text-gray-600">Marka:</span>
                      <p className="text-sm text-gray-900">{selectedCar.brand}</p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-600">Modelis:</span>
                      <p className="text-sm text-gray-900">{selectedCar.model}</p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-600">Gads:</span>
                      <p className="text-sm text-gray-900">{selectedCar.year}</p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-600">Numurzīme:</span>
                      <p className="text-sm text-gray-900">{selectedCar.licensePlate}</p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-600">VIN:</span>
                      <p className="text-sm text-gray-900">{selectedCar.vin || 'Nav norādīts'}</p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-600">Krāsa:</span>
                      <p className="text-sm text-gray-900">{selectedCar.color || 'Nav norādīta'}</p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-600">Nobraukums:</span>
                      <p className="text-sm text-gray-900">{selectedCar.mileage.toLocaleString()} km</p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-600">Pievienots:</span>
                      <p className="text-sm text-gray-900">
                        {selectedCar.assignedAt ? new Date(selectedCar.assignedAt).toLocaleDateString('lv-LV') : 'Nav zināms'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
