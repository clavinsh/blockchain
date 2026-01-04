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
        alert(`Invitation sent to user ${newInviteEmail}!`)
        setNewInviteEmail('')
        loadSentInvites()
      }
    } catch (err: any) {
      alert(err.message || 'Failed to send invitation')
    } finally {
      setIsLoading(false)
    }
  }

  const handleCancelInvite = async (inviteId: number) => {
    if (!confirm('Are you sure you want to cancel this invitation?')) return

    try {
      await inviteApi.cancelInvite(inviteId)
      alert('Invitation canceled')
      loadSentInvites()
    } catch (err: any) {
      alert(err.message || 'Failed to cancel invitation')
    }
  }

  const validateForm = () => {
    const errors: {[key: string]: string} = {}

    // Brand validation
    if (!newCarData.brand.trim()) {
      errors.brand = 'Brand is required'
    } else if (newCarData.brand.length < 2) {
      errors.brand = 'Brand must be at least 2 characters long'
    }

    // Model validation
    if (!newCarData.model.trim()) {
      errors.model = 'Model is required'
    } else if (newCarData.model.length < 1) {
      errors.model = 'Model must be at least 1 character long'
    }

    // Year validation
    const currentYear = new Date().getFullYear()
    if (newCarData.year < 1900 || newCarData.year > currentYear + 1) {
      errors.year = `Year must be between 1900 and ${currentYear + 1}`
    }

    // License plate validation (Latvian format)
    if (newCarData.licensePlate && newCarData.licensePlate.trim()) {
      const licensePlatePattern = /^[A-Z]{1,2}-\d{1,4}$/
      if (!licensePlatePattern.test(newCarData.licensePlate.toUpperCase())) {
        errors.licensePlate = 'License plate must be in format: LV-1234 or A-123'
      }
    }

    // VIN validation
    if (newCarData.vin && newCarData.vin.trim()) {
      const vinPattern = /^[A-HJ-NPR-Z0-9]{17}$/
      if (!vinPattern.test(newCarData.vin.toUpperCase())) {
        errors.vin = 'VIN code must be exactly 17 characters (without I, O, Q)'
      }
    }

    // Color validation
    if (newCarData.color && newCarData.color.length < 2) {
      errors.color = 'Color must be at least 2 characters long'
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
          alert(`Car "${newCarData.brand} ${newCarData.model}" updated successfully!`)
          
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
          alert(`Car "${newCarData.brand} ${newCarData.model}" created successfully!`)
          
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
      let errorMessage = editingCar ? 'Failed to update car' : 'Failed to create car'
      
      // The API now returns specific error messages, so we can use them directly
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
      alert('Please enter the new owner\'s email address')
      return
    }

    if (!confirm(`Are you sure you want to transfer ownership to user "${transferOwnerEmail}"? This action is irreversible.`)) {
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
      alert(err.message || 'Failed to transfer ownership')
    } finally {
      setIsTransferring(false)
    }
  }

  const handleChangeUserRole = async (userId: number, newRole: string) => {
    if (!selectedCarId) return

    const oldRole = carUsers.find(user => user.userId === userId)?.roleCode
    if (!oldRole || oldRole === newRole) return

    if (!confirm(`Are you sure you want to change user role from "${getRoleDisplayName(oldRole)}" to "${getRoleDisplayName(newRole)}"?`)) {
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
      alert(err.message || 'Failed to change user role')
    } finally {
      setIsChangingRole(prev => ({ ...prev, [userId]: false }))
    }
  }

  const handleRemoveUserAccess = async (userId: number) => {
    if (!selectedCarId) return

    const user = carUsers.find(u => u.userId === userId)
    if (!user) return

    if (!confirm(`Are you sure you want to remove user "${user.email}" access to this car?`)) {
      return
    }

    try {
      const response = await carApi.removeUserAccess(selectedCarId, userId)
      
      if (response.success) {
        alert(response.message)
        
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
            alert('Your access to this car has been removed. You will be redirected to your car list.')
          }
        }
      }
    } catch (err: any) {
      alert(err.message || 'Failed to remove user access')
    }
  }

  const handleDeleteCar = async (car: UserCar) => {
    if (!confirm(`Are you sure you want to delete car "${car.brand} ${car.model} (${car.licensePlate})"?\n\nThis action is irreversible and will delete all data associated with this car, including user access and invitations.`)) {
      return
    }

    try {
      const success = await deleteCar(car.carId)
      
      if (success) {
        alert('Car successfully deleted')
        // Update cars list by removing the deleted car
        setUserCars(userCars.filter(c => c.carId !== car.carId))
        // Clear selection if the deleted car was selected
        if (selectedCarId === car.carId) {
          setSelectedCarId(null)
        }
      }
    } catch (err: any) {
      alert(err.message || 'Failed to delete car')
    }
  }

  const getRoleDisplayName = (role: string): string => {
    switch (role) {
      case 'OWNER': return 'Owner'
      case 'DRIVER': return 'Driver'
      case 'VIEWER': return 'Viewer'
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
    <div className="w-full">
      <main className="p-4 sm:p-6">
        {/* Create/Edit Car Section */}
        <div className="mb-8 bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">
                {editingCar ? 'Edit Car' : 'Add New Car'}
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
                {showCreateForm ? 'Close' : 'Add Car'}
              </Button>
            </div>
          </div>
          
          {showCreateForm && (
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Brand *
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
                    Model *
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
                    Year
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
                    License Plate
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
                    placeholder="17 characters (without I, O, Q)"
                    maxLength={17}
                  />
                  {validationErrors.vin && (
                    <p className="mt-1 text-sm text-red-600">{validationErrors.vin}</p>
                  )}
                  {!validationErrors.vin && newCarData.vin && (
                    <p className="mt-1 text-sm text-gray-500">{newCarData.vin.length}/17 characters</p>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Color
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
                    placeholder="Black, White, Silver..."
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
                  Cancel
                </Button>
                <Button
                  onClick={handleSaveCar}
                  disabled={isCreatingCar || !newCarData.brand.trim() || !newCarData.model.trim()}
                >
                  {isCreatingCar 
                    ? (editingCar ? 'Updating...' : 'Creating...')
                    : (editingCar ? 'Update Car' : 'Create Car')
                  }
                </Button>
              </div>
              
              <p className="text-xs text-gray-500 mt-3">
                * Required fields: Brand and Model. By {editingCar ? 'updating' : 'creating'} a car you {editingCar ? 'maintain' : 'automatically become'} its {editingCar ? 'current role' : 'owner'}.
              </p>
            </div>
          )}
        </div>

        {/* My Cars Section */}
        <div className="mb-8 bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">My Cars</h2>
          </div>
          <div className="p-6">
            {userCars.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p>You don't have access to any cars.</p>
                <p className="text-sm mt-2">Ask another user to invite you.</p>
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
                        <div>VIN: {car.vin || 'Not specified'}</div>
                        <div>Year: {car.year}</div>
                        <div>Color: {car.color || 'Not specified'}</div>
                      </div>
                    </div>
                    <div className="pt-3 mt-3 border-t border-gray-100 space-y-2">
                      <span className="text-xs text-gray-500 block">
                        Added: {car.assignedAt ? new Date(car.assignedAt).toLocaleDateString('en-US') : 'Unknown'}
                      </span>
                      {car.roleCode === 'OWNER' && (
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleEditCar(car)
                            }}
                          >
                            Edit
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleDeleteCar(car)
                            }}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            Delete
                          </Button>
                        </div>
                      )}
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
              <h2 className="text-lg font-semibold text-gray-900">Access Management</h2>
              <p className="text-sm text-gray-600 mt-1">
                Manage users who have access to car: {selectedCar.brand} {selectedCar.model} ({selectedCar.licensePlate})
              </p>
            </div>

            <div className="p-6">
              {/* Add New Access */}
              {canInviteUsers && (
                <div className="mb-6 space-y-6">
                  {/* Invite User Section */}
                  <div>
                    <h3 className="text-md font-semibold text-gray-900 mb-3">Invite User</h3>
                    <div className="flex flex-col sm:flex-row gap-2 sm:space-x-4 sm:gap-0">
                      <input
                        type="email"
                        placeholder="User's email"
                        value={newInviteEmail}
                        onChange={(e) => setNewInviteEmail(e.target.value)}
                        className="flex-1 border border-blue-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                      <select
                        value={newInviteRole}
                        onChange={(e) => setNewInviteRole(e.target.value as 'OWNER' | 'DRIVER' | 'VIEWER')}
                        className="border border-blue-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-full sm:w-auto"
                      >
                        <option value="DRIVER">Driver</option>
                        <option value="VIEWER">Viewer</option>
                      </select>
                      <Button
                        onClick={handleInvite}
                        disabled={!newInviteEmail || isLoading}
                        className="bg-blue-600 hover:bg-blue-700 text-white w-full sm:w-auto"
                      >
                        {isLoading ? 'Sending...' : 'Invite'}
                      </Button>
                    </div>
                    <div className="mt-2 text-xs text-gray-500 space-y-1">
                      <p><strong>Driver:</strong> Can use the car and view driving data</p>
                      <p><strong>Viewer:</strong> Can only view car information (without driving data)</p>
                      <p className="text-yellow-700"><strong>Note:</strong> Owner role can only be assigned through ownership transfer</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Current Users */}
              <div className="mb-6">
                <h3 className="text-md font-semibold text-gray-900 mb-3">Current Users</h3>
                <div className="space-y-3">
                  {carUsers.length === 0 ? (
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                      <p className="text-sm text-gray-600">
                        No users have access to this car.
                      </p>
                    </div>
                  ) : (
                    carUsers.map((user) => (
                      <div key={user.id} className="bg-white border border-gray-200 rounded-lg p-3 sm:p-4">
                        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                              <span className="font-medium text-gray-900 text-sm break-words">
                                {user.username} ({user.email})
                              </span>
                              <span className={`px-2 py-1 text-xs rounded-full whitespace-nowrap inline-block w-fit ${
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
                              Added: {user.assignedAt ? new Date(user.assignedAt).toLocaleDateString('en-US') : 'Unknown'}
                            </div>
                            
                            {/* Role Management - Only show if not OWNER (OWNER requires ownership transfer) */}
                            {canInviteUsers && user.roleCode !== 'OWNER' && (
                              <div className="flex flex-col sm:flex-row sm:items-center gap-2 mt-2">
                                <span className="text-xs text-gray-500">Change role:</span>
                                <div className="flex items-center gap-2 flex-wrap">
                                  <select
                                    value={roleChanges[user.userId] || user.roleCode}
                                    onChange={(e) => setRoleChanges(prev => ({ ...prev, [user.userId]: e.target.value }))}
                                    className="text-xs border border-gray-300 rounded px-2 py-1 flex-shrink-0"
                                    disabled={isChangingRole[user.userId]}
                                  >
                                  {getRoleOptions(user.roleCode).map(role => (
                                    <option key={role} value={role}>
                                      {getRoleDisplayName(role)}
                                    </option>
                                  ))}\n                                </select>
                                {roleChanges[user.userId] && roleChanges[user.userId] !== user.roleCode && (
                                  <div className="flex gap-1">
                                    <Button
                                      onClick={() => handleChangeUserRole(user.userId, roleChanges[user.userId])}
                                      size="sm"
                                      className="text-xs px-2 py-1 h-6 bg-blue-600 hover:bg-blue-700 text-white border border-blue-600 hover:border-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
                                      disabled={isChangingRole[user.userId]}
                                    >
                                      {isChangingRole[user.userId] ? 'Changing...' : 'Change'}
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
                                      Cancel
                                    </Button>
                                  </div>
                                )}
                                </div>
                              </div>
                            )}
                          </div>
                          
                          {/* Remove User - Only for non-OWNER */}
                          {canInviteUsers && user.roleCode !== 'OWNER' && (
                            <Button
                              onClick={() => handleRemoveUserAccess(user.userId)}
                              variant="outline"
                              size="sm"
                              className="text-red-600 hover:text-red-700 hover:bg-red-50 w-full sm:w-auto whitespace-nowrap"
                            >
                              Remove
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
                <h3 className="text-md font-semibold text-gray-900 mb-3">Sent Invitations</h3>
                <div className="space-y-3">
                  {sentInvites.length === 0 ? (
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                      <p className="text-sm text-gray-600">
                        No invitations sent for this car.
                      </p>
                    </div>
                  ) : (
                    sentInvites.map((invite) => (
                      <div key={invite.inviteId} className="bg-white border border-gray-200 rounded-lg p-3 sm:p-4">
                        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                              <span className="font-medium text-gray-900 text-sm break-words">{invite.invitedEmail}</span>
                              <span className={`px-2 py-1 text-xs rounded-full whitespace-nowrap inline-block w-fit ${
                                invite.inviteStatus === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                                invite.inviteStatus === 'ACCEPTED' ? 'bg-green-100 text-green-800' :
                                invite.inviteStatus === 'DECLINED' ? 'bg-red-100 text-red-800' :
                                'bg-gray-100 text-gray-800'
                              }`}>
                                {invite.inviteStatus === 'PENDING' ? 'Pending' :
                                 invite.inviteStatus === 'ACCEPTED' ? 'Accepted' :
                                 invite.inviteStatus === 'DECLINED' ? 'Declined' :
                                 'Canceled'}
                              </span>
                            </div>
                            <div className="text-sm text-gray-600 mt-1">
                              Role: {getRoleDisplayName(invite.roleCode)} •
                              Sent: {invite.createdAt ? new Date(invite.createdAt).toLocaleDateString('en-US') : 'Unknown'}
                            </div>
                          </div>
                          {invite.inviteStatus === 'PENDING' && canInviteUsers && (
                            <Button
                              onClick={() => handleCancelInvite(invite.inviteId)}
                              variant="outline"
                              size="sm"
                              className="w-full sm:w-auto"
                            >
                              Cancel
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
                  <h3 className="text-md font-semibold text-gray-900 mb-3">Transfer Ownership</h3>
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <div className="mb-4">
                      <p className="text-sm text-yellow-800 mb-2">
                        <strong>Warning:</strong> By transferring ownership, you will lose your Owner status. 
                        This action is irreversible.
                      </p>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-2 sm:space-x-4 sm:gap-0">
                      <input
                        type="email"
                        placeholder="New owner's email"
                        value={transferOwnerEmail}
                        onChange={(e) => setTransferOwnerEmail(e.target.value)}
                        className="flex-1 border border-yellow-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
                        disabled={isTransferring}
                      />
                      <Button
                        onClick={handleTransferOwnership}
                        disabled={!transferOwnerEmail.trim() || isTransferring}
                        className="bg-yellow-600 hover:bg-yellow-700 text-white w-full sm:w-auto whitespace-nowrap"
                      >
                        {isTransferring ? 'Transferring...' : 'Transfer Ownership'}
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {/* Car Details */}
              <div>
                <h3 className="text-md font-semibold text-gray-900 mb-3">Car Details</h3>
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <span className="text-sm font-medium text-gray-600">Brand:</span>
                      <p className="text-sm text-gray-900">{selectedCar.brand}</p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-600">Model:</span>
                      <p className="text-sm text-gray-900">{selectedCar.model}</p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-600">Year:</span>
                      <p className="text-sm text-gray-900">{selectedCar.year}</p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-600">License Plate:</span>
                      <p className="text-sm text-gray-900">{selectedCar.licensePlate}</p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-600">VIN:</span>
                      <p className="text-sm text-gray-900 break-all">{selectedCar.vin || 'Not specified'}</p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-600">Color:</span>
                      <p className="text-sm text-gray-900">{selectedCar.color || 'Not specified'}</p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-600">Added:</span>
                      <p className="text-sm text-gray-900">
                        {selectedCar.assignedAt ? new Date(selectedCar.assignedAt).toLocaleDateString('en-US') : 'Unknown'}
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
