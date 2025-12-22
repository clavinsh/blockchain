import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { useCarContext } from '@/contexts/CarContext'
import { inviteApi, carApi, deleteCar, type InviteResponse, type CarUser, type CreateCarRequest, type UserCar } from '@/services/api'

export default function CarManagerPage() {
  const { userCars, selectedCarId, setSelectedCarId, setUserCars } = useCarContext()
  const [newInviteEmail, setNewInviteEmail] = useState('')
  const [newInviteRole, setNewInviteRole] = useState<'OWNER' | 'DRIVER' | 'VIEWER'>('DRIVER')
  const [sentInvites, setSentInvites] = useState<InviteResponse[]>([])
  const [carUsers, setCarUsers] = useState<CarUser[]>([])
  const [isLoading, setIsLoading] = useState(false)

  // Car creation state
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [editingCar, setEditingCar] = useState<UserCar | null>(null)
  const [newCarData, setNewCarData] = useState<CreateCarRequest>({
    brand: '',
    model: '',
    year: new Date().getFullYear(),
    licensePlate: '',
    vin: '',
    color: ''
  })
  const [isCreatingCar, setIsCreatingCar] = useState(false)
  const [validationErrors, setValidationErrors] = useState<{[key: string]: string}>({})
  const [transferOwnerEmail, setTransferOwnerEmail] = useState('')
  const [isTransferring, setIsTransferring] = useState(false)
  
  // Role management state
  const [roleChanges, setRoleChanges] = useState<{[userId: number]: string}>({})
  const [isChangingRole, setIsChangingRole] = useState<{[userId: number]: boolean}>({})

  const selectedCar = userCars.find(car => car.carId === selectedCarId)

  // Check if current user is an OWNER of the selected car
  const isOwner = selectedCar?.roleCode === 'OWNER'
  const canInviteUsers = isOwner
  const canTransferOwnership = isOwner

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

  const validateForm = () => {
    const errors: {[key: string]: string} = {}

    // Brand validation
    if (!newCarData.brand.trim()) {
      errors.brand = 'Marka ir obligāta'
    } else if (newCarData.brand.length < 2) {
      errors.brand = 'Markai jābūt vismaz 2 simboli garai'
    }

    // Model validation
    if (!newCarData.model.trim()) {
      errors.model = 'Modelis ir obligāts'
    } else if (newCarData.model.length < 1) {
      errors.model = 'Modelim jābūt vismaz 1 simbols garam'
    }

    // Year validation
    const currentYear = new Date().getFullYear()
    if (newCarData.year < 1900 || newCarData.year > currentYear + 1) {
      errors.year = `Gadam jābūt starp 1900 un ${currentYear + 1}`
    }

    // License plate validation (Latvian format)
    if (newCarData.licensePlate && newCarData.licensePlate.trim()) {
      const licensePlatePattern = /^[A-Z]{1,2}-\d{1,4}$/
      if (!licensePlatePattern.test(newCarData.licensePlate.toUpperCase())) {
        errors.licensePlate = 'Numurzīmei jābūt formātā: LV-1234 vai A-123'
      }
    }

    // VIN validation
    if (newCarData.vin && newCarData.vin.trim()) {
      const vinPattern = /^[A-HJ-NPR-Z0-9]{17}$/
      if (!vinPattern.test(newCarData.vin.toUpperCase())) {
        errors.vin = 'VIN kodam jābūt tieši 17 simboli (bez I, O, Q)'
      }
    }

    // Color validation
    if (newCarData.color && newCarData.color.length < 2) {
      errors.color = 'Krāsai jābūt vismaz 2 simboli garai'
    }

    setValidationErrors(errors)
    return Object.keys(errors).length === 0
  }

  const clearForm = () => {
    setNewCarData({
      brand: '',
      model: '',
      year: new Date().getFullYear(),
      licensePlate: '',
      vin: '',
      color: ''
    })
    setValidationErrors({})
    setEditingCar(null)
  }

  const handleEditCar = (car: UserCar) => {
    setEditingCar(car)
    setNewCarData({
      brand: car.brand,
      model: car.model,
      year: car.year,
      licensePlate: car.licensePlate || '',
      vin: car.vin || '',
      color: car.color || ''
    })
    setValidationErrors({})
    setShowCreateForm(true)
  }

  const handleSaveCar = async () => {
    if (!validateForm()) {
      return
    }

    setIsCreatingCar(true)

    try {
      if (editingCar) {
        // Update existing car
        const response = await carApi.updateCar(editingCar.carId, newCarData)
        
        if (response.success) {
          alert(`Mašīna "${newCarData.brand} ${newCarData.model}" atjaunināta veiksmīgi!`)
          
          // Reset form
          clearForm()
          setShowCreateForm(false)
          
          // Reload user cars to show the updated data
          const userCarsResponse = await carApi.getUserCars()
          if (userCarsResponse.success && userCarsResponse.cars) {
            setUserCars(userCarsResponse.cars)
          }
        }
      } else {
        // Create new car
        const response = await carApi.createCar(newCarData)
        
        if (response.success) {
          alert(`Mašīna "${newCarData.brand} ${newCarData.model}" izveidota veiksmīgi!`)
          
          // Reset form
          clearForm()
          setShowCreateForm(false)
          
          // Reload user cars to show the new one
          const userCarsResponse = await carApi.getUserCars()
          if (userCarsResponse.success && userCarsResponse.cars) {
            setUserCars(userCarsResponse.cars)
          }
        }
      }
    } catch (err: any) {
      let errorMessage = editingCar ? 'Neizdevās atjaunināt mašīnu' : 'Neizdevās izveidot mašīnu'
      
      // The API now returns specific error messages in Latvian, so we can use them directly
      if (err.message) {
        errorMessage = err.message
      }
      
      alert(errorMessage)
    } finally {
      setIsCreatingCar(false)
    }
  }

  const handleTransferOwnership = async () => {
    if (!selectedCarId || !transferOwnerEmail.trim()) {
      alert('Lūdzu ievadiet jauna īpašnieka e-pasta adresi')
      return
    }

    if (!confirm(`Vai tiešām vēlaties nodot īpašumtiesības lietotājam "${transferOwnerEmail}"? Šī darbība ir neatgriezeniska.`)) {
      return
    }

    setIsTransferring(true)
    
    try {
      const response = await carApi.transferOwnership(selectedCarId, transferOwnerEmail)
      
      if (response.success) {
        alert(response.message)
        setTransferOwnerEmail('')
        
        // Reload user cars to reflect the role change
        const userCarsResponse = await carApi.getUserCars()
        if (userCarsResponse.success && userCarsResponse.cars) {
          setUserCars(userCarsResponse.cars)
          
          // Clear selected car if user is no longer OWNER
          const updatedCar = userCarsResponse.cars.find(car => car.carId === selectedCarId)
          if (!updatedCar || updatedCar.roleCode !== 'OWNER') {
            setSelectedCarId(null)
          }
        }
        
        // Reload car users
        loadCarUsers()
      }
    } catch (err: any) {
      alert(err.message || 'Neizdevās nodot īpašumtiesības')
    } finally {
      setIsTransferring(false)
    }
  }

  const handleChangeUserRole = async (userId: number, newRole: string) => {
    if (!selectedCarId) return

    const oldRole = carUsers.find(user => user.userId === userId)?.roleCode
    if (!oldRole || oldRole === newRole) return

    if (!confirm(`Vai tiešām vēlaties mainīt lietotāja lomu no "${getRoleDisplayName(oldRole)}" uz "${getRoleDisplayName(newRole)}"?`)) {
      return
    }

    setIsChangingRole(prev => ({ ...prev, [userId]: true }))
    
    try {
      const response = await carApi.changeUserRole(selectedCarId, userId, newRole)
      
      if (response.success) {
        alert(response.message)
        // Reset local role change
        setRoleChanges(prev => {
          const updated = { ...prev }
          delete updated[userId]
          return updated
        })
        // Reload car users
        loadCarUsers()
      }
    } catch (err: any) {
      alert(err.message || 'Neizdevās mainīt lietotāja lomu')
    } finally {
      setIsChangingRole(prev => ({ ...prev, [userId]: false }))
    }
  }

  const handleRemoveUserAccess = async (userId: number) => {
    if (!selectedCarId) return

    const user = carUsers.find(u => u.userId === userId)
    if (!user) return

    if (!confirm(`Vai tiešām vēlaties noņemt lietotāja "${user.email}" piekļuvi šai mašīnai?`)) {
      return
    }

    try {
      const response = await carApi.removeUserAccess(selectedCarId, userId)
      
      if (response.success) {
        alert(response.message)
        
        // Check if user removed their own access
        const currentUserEmail = user.email // You might want to get this from auth context
        
        // Reload car users first
        loadCarUsers()
        
        // If user removed themselves, refresh the cars list and potentially clear selection
        const userCarsResponse = await carApi.getUserCars()
        if (userCarsResponse.success && userCarsResponse.cars) {
          setUserCars(userCarsResponse.cars)
          
          // If the current car is no longer accessible, clear selection
          const stillHasAccess = userCarsResponse.cars.some(car => car.carId === selectedCarId)
          if (!stillHasAccess) {
            setSelectedCarId(null)
            alert('Jūsu piekļuve šai mašīnai ir noņemta. Jūs tiksiet novirzīts uz savu mašīnu sarakstu.')
          }
        }
      }
    } catch (err: any) {
      alert(err.message || 'Neizdevās noņemt lietotāja piekļuvi')
    }
  }

  const handleDeleteCar = async (car: UserCar) => {
    if (!confirm(`Vai tiešām vēlaties dzēst automašīnu "${car.brand} ${car.model} (${car.licensePlate})"?\n\nŠī darbība ir neatgriezeniska un dzēsīs visus ar šo automašīnu saistītos datus, ieskaitot lietotāju piekļuves un uzaicinājumus.`)) {
      return
    }

    try {
      const success = await deleteCar(car.carId)
      
      if (success) {
        alert('Automašīna veiksmīgi dzēsta')
        // Update cars list by removing the deleted car
        setUserCars(userCars.filter(c => c.carId !== car.carId))
        // Clear selection if the deleted car was selected
        if (selectedCarId === car.carId) {
          setSelectedCarId(null)
        }
      }
    } catch (err: any) {
      alert(err.message || 'Neizdevās dzēst automašīnu')
    }
  }

  const getRoleDisplayName = (role: string): string => {
    switch (role) {
      case 'OWNER': return 'Īpašnieks'
      case 'DRIVER': return 'Vadītājs'
      case 'VIEWER': return 'Apskatītājs'
      default: return role
    }
  }

  const getRoleOptions = (currentRole: string): string[] => {
    // OWNER cannot be changed (use ownership transfer instead)
    if (currentRole === 'OWNER') return []
    
    // Available role options for others (only DRIVER and VIEWER)
    return ['DRIVER', 'VIEWER']
  }

  return (
    <div>
      <main className="p-6">
        {/* Create/Edit Car Section */}
        <div className="mb-8 bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">
                {editingCar ? 'Rediģēt mašīnu' : 'Pievienot jaunu mašīnu'}
              </h2>
              <Button 
                onClick={() => {
                  if (showCreateForm) {
                    clearForm()
                    setShowCreateForm(false)
                  } else {
                    setShowCreateForm(true)
                  }
                }}
                variant="outline"
              >
                {showCreateForm ? 'Aizvērt' : 'Pievienot mašīnu'}
              </Button>
            </div>
          </div>
          
          {showCreateForm && (
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Marka *
                  </label>
                  <input
                    type="text"
                    value={newCarData.brand}
                    onChange={(e) => {
                      setNewCarData({...newCarData, brand: e.target.value})
                      if (validationErrors.brand) {
                        setValidationErrors({...validationErrors, brand: ''})
                      }
                    }}
                    className={`w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      validationErrors.brand 
                        ? 'border-red-300 focus:border-red-500' 
                        : 'border-gray-300 focus:border-blue-500'
                    }`}
                    placeholder="BMW, Audi, Mercedes-Benz..."
                  />
                  {validationErrors.brand && (
                    <p className="mt-1 text-sm text-red-600">{validationErrors.brand}</p>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Modelis *
                  </label>
                  <input
                    type="text"
                    value={newCarData.model}
                    onChange={(e) => {
                      setNewCarData({...newCarData, model: e.target.value})
                      if (validationErrors.model) {
                        setValidationErrors({...validationErrors, model: ''})
                      }
                    }}
                    className={`w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      validationErrors.model 
                        ? 'border-red-300 focus:border-red-500' 
                        : 'border-gray-300 focus:border-blue-500'
                    }`}
                    placeholder="A4, 320d, C220d..."
                  />
                  {validationErrors.model && (
                    <p className="mt-1 text-sm text-red-600">{validationErrors.model}</p>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Gads
                  </label>
                  <input
                    type="number"
                    value={newCarData.year}
                    onChange={(e) => {
                      setNewCarData({...newCarData, year: parseInt(e.target.value) || new Date().getFullYear()})
                      if (validationErrors.year) {
                        setValidationErrors({...validationErrors, year: ''})
                      }
                    }}
                    className={`w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      validationErrors.year 
                        ? 'border-red-300 focus:border-red-500' 
                        : 'border-gray-300 focus:border-blue-500'
                    }`}
                    min="1900"
                    max={new Date().getFullYear() + 1}
                  />
                  {validationErrors.year && (
                    <p className="mt-1 text-sm text-red-600">{validationErrors.year}</p>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Numurzīme
                  </label>
                  <input
                    type="text"
                    value={newCarData.licensePlate}
                    onChange={(e) => {
                      setNewCarData({...newCarData, licensePlate: e.target.value.toUpperCase()})
                      if (validationErrors.licensePlate) {
                        setValidationErrors({...validationErrors, licensePlate: ''})
                      }
                    }}
                    className={`w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      validationErrors.licensePlate 
                        ? 'border-red-300 focus:border-red-500' 
                        : 'border-gray-300 focus:border-blue-500'
                    }`}
                    placeholder="LV-1234"
                  />
                  {validationErrors.licensePlate && (
                    <p className="mt-1 text-sm text-red-600">{validationErrors.licensePlate}</p>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    VIN
                  </label>
                  <input
                    type="text"
                    value={newCarData.vin}
                    onChange={(e) => {
                      setNewCarData({...newCarData, vin: e.target.value.toUpperCase()})
                      if (validationErrors.vin) {
                        setValidationErrors({...validationErrors, vin: ''})
                      }
                    }}
                    className={`w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      validationErrors.vin 
                        ? 'border-red-300 focus:border-red-500' 
                        : 'border-gray-300 focus:border-blue-500'
                    }`}
                    placeholder="17 simboli (bez I, O, Q)"
                    maxLength={17}
                  />
                  {validationErrors.vin && (
                    <p className="mt-1 text-sm text-red-600">{validationErrors.vin}</p>
                  )}
                  {!validationErrors.vin && newCarData.vin && (
                    <p className="mt-1 text-sm text-gray-500">{newCarData.vin.length}/17 simboli</p>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Krāsa
                  </label>
                  <input
                    type="text"
                    value={newCarData.color}
                    onChange={(e) => {
                      setNewCarData({...newCarData, color: e.target.value})
                      if (validationErrors.color) {
                        setValidationErrors({...validationErrors, color: ''})
                      }
                    }}
                    className={`w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      validationErrors.color 
                        ? 'border-red-300 focus:border-red-500' 
                        : 'border-gray-300 focus:border-blue-500'
                    }`}
                    placeholder="Melna, Balta, Sudraba..."
                  />
                  {validationErrors.color && (
                    <p className="mt-1 text-sm text-red-600">{validationErrors.color}</p>
                  )}
                </div>
              </div>
              
              <div className="mt-6 flex justify-end space-x-3">
                <Button
                  variant="outline"
                  onClick={() => {
                    clearForm()
                    setShowCreateForm(false)
                  }}
                  disabled={isCreatingCar}
                >
                  Atcelt
                </Button>
                <Button
                  onClick={handleSaveCar}
                  disabled={isCreatingCar || !newCarData.brand.trim() || !newCarData.model.trim()}
                >
                  {isCreatingCar 
                    ? (editingCar ? 'Atjaunina...' : 'Izveido...')
                    : (editingCar ? 'Atjaunināt mašīnu' : 'Izveidot mašīnu')
                  }
                </Button>
              </div>
              
              <p className="text-xs text-gray-500 mt-3">
                * Obligātie lauki: Marka un Modelis. {editingCar ? 'Atjauninot' : 'Izveidojot'} mašīnu jūs {editingCar ? 'saglabājat' : 'automātiski kļūstat par'} tās {editingCar ? 'pašreizējo lomu' : 'īpašnieku'}.
              </p>
            </div>
          )}
        </div>

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
                    className={`border rounded-lg p-4 transition-colors ${selectedCarId === car.carId
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                      }`}
                  >
                    <div 
                      className="cursor-pointer" 
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
                      </div>
                    </div>
                    <div className="flex items-center justify-between pt-3 mt-3 border-t border-gray-100">
                      <span className="text-xs text-gray-500">
                        Pievienots: {car.assignedAt ? new Date(car.assignedAt).toLocaleDateString('lv-LV') : 'Nav zināms'}
                      </span>
                      <div className="flex space-x-2">
                        {car.roleCode === 'OWNER' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleEditCar(car)
                            }}
                          >
                            Rediģēt
                          </Button>
                        )}
                        {car.roleCode === 'OWNER' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleDeleteCar(car)
                            }}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            Dzēst
                          </Button>
                        )}
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
                <div className="mb-6 space-y-6">
                  {/* Invite User Section */}
                  <div>
                    <h3 className="text-md font-semibold text-gray-900 mb-3">Uzaicināt lietotāju</h3>
                    <div className="flex space-x-4">
                      <input
                        type="email"
                        placeholder="Īpašnieka e-pasts"
                        value={newInviteEmail}
                        onChange={(e) => setNewInviteEmail(e.target.value)}
                        className="flex-1 border border-blue-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                      <select
                        value={newInviteRole}
                        onChange={(e) => setNewInviteRole(e.target.value as 'OWNER' | 'DRIVER' | 'VIEWER')}
                        className="border border-blue-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="DRIVER">Vadītājs</option>
                        <option value="VIEWER">Apskatītājs</option>
                      </select>
                      <Button
                        onClick={handleInvite}
                        disabled={!newInviteEmail || isLoading}
                        className="bg-blue-600 hover:bg-blue-700 text-white"
                      >
                        {isLoading ? 'Sūta...' : 'Uzaicināt'}
                      </Button>
                    </div>
                    <div className="mt-2 text-xs text-gray-500 space-y-1">
                      <p><strong>Vadītājs:</strong> Var izmantot mašīnu un skatīt braukšanas datus</p>
                      <p><strong>Apskatītājs:</strong> Var tikai skatīt mašīnas informāciju (bez braukšanas datiem)</p>
                      <p className="text-yellow-700"><strong>Piezīme:</strong> Īpašnieka lomu var piešķirt tikai caur īpašumtiesību nodošanu</p>
                    </div>
                  </div>
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
                                user.roleCode === 'OWNER' ? 'bg-purple-100 text-purple-800' : 
                                user.roleCode === 'DRIVER' ? 'bg-blue-100 text-blue-800' :
                                user.roleCode === 'VIEWER' ? 'bg-green-100 text-green-800' :
                                'bg-gray-100 text-gray-800'
                              }`}>
                                {getRoleDisplayName(user.roleCode)}
                              </span>
                            </div>
                            <div className="text-sm text-gray-600 mt-1">
                              {user.firstName && user.lastName && `${user.firstName} ${user.lastName} • `}
                              Pievienots: {user.assignedAt ? new Date(user.assignedAt).toLocaleDateString('lv-LV') : 'Nav zināms'}
                            </div>
                            
                            {/* Role Management - Only show if not OWNER (OWNER requires ownership transfer) */}
                            {canInviteUsers && user.roleCode !== 'OWNER' && (
                              <div className="flex items-center space-x-2 mt-2">
                                <span className="text-xs text-gray-500">Mainīt lomu:</span>
                                <select
                                  value={roleChanges[user.userId] || user.roleCode}
                                  onChange={(e) => setRoleChanges(prev => ({ ...prev, [user.userId]: e.target.value }))}
                                  className="text-xs border border-gray-300 rounded px-2 py-1"
                                  disabled={isChangingRole[user.userId]}
                                >
                                  {getRoleOptions(user.roleCode).map(role => (
                                    <option key={role} value={role}>
                                      {getRoleDisplayName(role)}
                                    </option>
                                  ))}
                                </select>
                                {roleChanges[user.userId] && roleChanges[user.userId] !== user.roleCode && (
                                  <div className="flex space-x-1">
                                    <Button
                                      onClick={() => handleChangeUserRole(user.userId, roleChanges[user.userId])}
                                      size="sm"
                                      className="text-xs px-2 py-1 h-6 bg-blue-600 hover:bg-blue-700 text-white border border-blue-600 hover:border-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
                                      disabled={isChangingRole[user.userId]}
                                    >
                                      {isChangingRole[user.userId] ? 'Maina...' : 'Mainīt'}
                                    </Button>
                                    <Button
                                      onClick={() => setRoleChanges(prev => {
                                        const updated = { ...prev }
                                        delete updated[user.userId]
                                        return updated
                                      })}
                                      variant="outline"
                                      size="sm"
                                      className="text-xs px-2 py-1 h-6"
                                      disabled={isChangingRole[user.userId]}
                                    >
                                      Atcelt
                                    </Button>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                          
                          {/* Remove User - Only for non-OWNER */}
                          {canInviteUsers && user.roleCode !== 'OWNER' && (
                            <Button
                              onClick={() => handleRemoveUserAccess(user.userId)}
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
                              Loma: {invite.roleCode === 'OWNER' ? 'Īpašnieks' : 
                                     invite.roleCode === 'DRIVER' ? 'Vadītājs' :
                                     invite.roleCode === 'VIEWER' ? 'Apskatītājs' : invite.roleCode} •
                              Nosūtīts: {invite.createdAt ? new Date(invite.createdAt).toLocaleDateString('lv-LV') : 'Nav zināms'}
                            </div>
                          </div>
                          {invite.inviteStatus === 'PENDING' && canInviteUsers && (
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

              {/* Ownership Transfer - Only for OWNER */}
              {canTransferOwnership && (
                <div className="mb-6">
                  <h3 className="text-md font-semibold text-gray-900 mb-3">Nodot īpašumtiesības</h3>
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <div className="mb-4">
                      <p className="text-sm text-yellow-800 mb-2">
                        <strong>Brīdinājums:</strong> Nododot īpašumtiesības, jūs zaudēsiet Īpašnieka statusu. 
                        Šī darbība ir neatgriezeniska.
                      </p>
                    </div>
                    <div className="flex space-x-4">
                      <input
                        type="email"
                        placeholder="Jauna īpašnieka e-pasts"
                        value={transferOwnerEmail}
                        onChange={(e) => setTransferOwnerEmail(e.target.value)}
                        className="flex-1 border border-yellow-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
                        disabled={isTransferring}
                      />
                      <Button
                        onClick={handleTransferOwnership}
                        disabled={!transferOwnerEmail.trim() || isTransferring}
                        className="bg-yellow-600 hover:bg-yellow-700 text-white"
                      >
                        {isTransferring ? 'Nodod...' : 'Nodot īpašumtiesības'}
                      </Button>
                    </div>
                  </div>
                </div>
              )}

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
