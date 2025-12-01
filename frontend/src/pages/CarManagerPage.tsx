import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { useCarContext } from '@/contexts/CarContext'
import { inviteApi, carApi, type InviteResponse, type CarUser } from '@/services/api'

export default function CarManagerPage() {
  const { userCars, selectedCarId, setSelectedCarId } = useCarContext()
  const [newInviteEmail, setNewInviteEmail] = useState('')
  const [newInviteRole, setNewInviteRole] = useState<'OWNER' | 'DRIVER'>('DRIVER')
  const [sentInvites, setSentInvites] = useState<InviteResponse[]>([])
  const [carUsers, setCarUsers] = useState<CarUser[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const selectedCar = userCars.find(car => car.carId === selectedCarId)

  // Check if current user is an OWNER of the selected car
  const isOwner = selectedCar?.roleCode === 'OWNER'
  const canInviteUsers = isOwner

  const loadSentInvites = async () => {
    if (!selectedCarId) return

    try {
      const invites = await inviteApi.getSentInvites()
      const carInvites = invites.filter(invite => invite.carId === selectedCarId)
      setSentInvites(carInvites)
    } catch (err) {
      console.error('Failed to load sent invites:', err)
    }
  }

  const loadCarUsers = async () => {
    if (!selectedCarId) return

    try {
      const users = await carApi.getCarUsers(selectedCarId)
      setCarUsers(users)
    } catch (err) {
      console.error('Failed to load car users:', err)
    }
  }

  useEffect(() => {
    if (selectedCarId) {
      loadSentInvites()
      loadCarUsers()
    }
  }, [selectedCarId])

  const handleInvite = async () => {
    if (!selectedCarId || !newInviteEmail) return

    setIsLoading(true)

    try {
      const response = await inviteApi.createInvite({
        carId: selectedCarId,
        invitedUserEmail: newInviteEmail,
        roleCode: newInviteRole,
      })

      if (response.success) {
        alert(`Uzaicinājums nosūtīts lietotājam ${newInviteEmail}!`)
        setNewInviteEmail('')
        loadSentInvites()
      }
    } catch (err: any) {
      alert(err.message || 'Neizdevās nosūtīt uzaicinājumu')
    } finally {
      setIsLoading(false)
    }
  }

  const handleCancelInvite = async (inviteId: number) => {
    if (!confirm('Vai tiešām vēlaties atcelt šo uzaicinājumu?')) return

    try {
      await inviteApi.cancelInvite(inviteId)
      alert('Uzaicinājums atcelts')
      loadSentInvites()
    } catch (err: any) {
      alert(err.message || 'Neizdevās atcelt uzaicinājumu')
    }
  }

  const handleRemoveUser = async (userCarId: number, username: string) => {
    if (!confirm(`Vai tiešām vēlaties noņemt lietotāja "${username}" piekļuvi šai mašīnai?`)) return

    if (!selectedCarId) return

    try {
      await carApi.removeCarUser(selectedCarId, userCarId)
      alert('Lietotāja piekļuve noņemta')
      loadCarUsers()
    } catch (err: any) {
      alert(err.message || 'Neizdevās noņemt lietotāja piekļuvi')
    }
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
                      onChange={(e) => setNewInviteRole(e.target.value as 'OWNER' | 'DRIVER')}
                      className="border border-gray-300 rounded-md px-3 py-2"
                    >
                      <option value="OWNER">Īpašnieks</option>
                      <option value="DRIVER">Vadītājs</option>
                    </select>
                    <Button
                      onClick={handleInvite}
                      disabled={!newInviteEmail || isLoading}
                    >
                      {isLoading ? 'Sūta...' : 'Uzaicināt'}
                    </Button>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    Lietotājs saņems uzaicinājumu un varēs pieņemt vai noraidīt piekļuvi
                  </p>
                </div>
              )}

              {/* Current Users */}
              <div className="mb-6">
                <h3 className="text-md font-semibold text-gray-900 mb-3">Pašreizējie lietotāji</h3>
                <div className="space-y-3">
                  {carUsers.length === 0 ? (
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                      <p className="text-sm text-gray-600">
                        Nav lietotāju ar piekļuvi šai mašīnai.
                      </p>
                    </div>
                  ) : (
                    carUsers.map((user) => (
                      <div key={user.id} className="bg-white border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2">
                              <span className="font-medium text-gray-900">
                                {user.username} ({user.email})
                              </span>
                              <span className={`px-2 py-1 text-xs rounded-full ${
                                user.roleCode === 'OWNER' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'
                              }`}>
                                {user.roleCode === 'OWNER' ? 'Īpašnieks' : 'Vadītājs'}
                              </span>
                            </div>
                            <div className="text-sm text-gray-600 mt-1">
                              {user.firstName && user.lastName && `${user.firstName} ${user.lastName} • `}
                              Pievienots: {user.assignedAt ? new Date(user.assignedAt).toLocaleDateString('lv-LV') : 'Nav zināms'}
                            </div>
                          </div>
                          {isOwner && (
                            <Button
                              onClick={() => handleRemoveUser(user.id, user.username)}
                              variant="outline"
                              size="sm"
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              Noņemt
                            </Button>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Sent Invites */}
              <div className="mb-6">
                <h3 className="text-md font-semibold text-gray-900 mb-3">Nosūtītie uzaicinājumi</h3>
                <div className="space-y-3">
                  {sentInvites.length === 0 ? (
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                      <p className="text-sm text-gray-600">
                        Nav nosūtītu uzaicinājumu šai mašīnai.
                      </p>
                    </div>
                  ) : (
                    sentInvites.map((invite) => (
                      <div key={invite.inviteId} className="bg-white border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2">
                              <span className="font-medium text-gray-900">{invite.invitedEmail}</span>
                              <span className={`px-2 py-1 text-xs rounded-full ${
                                invite.inviteStatus === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                                invite.inviteStatus === 'ACCEPTED' ? 'bg-green-100 text-green-800' :
                                invite.inviteStatus === 'DECLINED' ? 'bg-red-100 text-red-800' :
                                'bg-gray-100 text-gray-800'
                              }`}>
                                {invite.inviteStatus === 'PENDING' ? 'Gaida' :
                                 invite.inviteStatus === 'ACCEPTED' ? 'Pieņemts' :
                                 invite.inviteStatus === 'DECLINED' ? 'Noraidīts' :
                                 'Atcelts'}
                              </span>
                            </div>
                            <div className="text-sm text-gray-600 mt-1">
                              Loma: {invite.roleCode === 'OWNER' ? 'Īpašnieks' : 'Vadītājs'} •
                              Nosūtīts: {invite.createdAt ? new Date(invite.createdAt).toLocaleDateString('lv-LV') : 'Nav zināms'}
                            </div>
                          </div>
                          {invite.inviteStatus === 'PENDING' && isOwner && (
                            <Button
                              onClick={() => handleCancelInvite(invite.inviteId)}
                              variant="outline"
                              size="sm"
                            >
                              Atcelt
                            </Button>
                          )}
                        </div>
                      </div>
                    ))
                  )}
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
