import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { inviteApi, carApi, type InviteResponse } from '@/services/api'
import { useCarContext } from '@/contexts/CarContext'

export default function InvitationsPage() {
  const [receivedInvites, setReceivedInvites] = useState<InviteResponse[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const { setUserCars } = useCarContext()

  // Helper function for role display
  const getRoleLabel = (roleCode: string) => {
    switch (roleCode) {
      case 'OWNER':
        return 'Īpašnieks'
      case 'DRIVER':
        return 'Vadītājs'
      case 'VIEWER':
        return 'Skatītājs'
      default:
        return roleCode
    }
  }

  const getRoleDescription = (roleCode: string) => {
    switch (roleCode) {
      case 'OWNER':
        return 'Kā īpašnieks jūs varēsit pilnībā pārvaldīt šo mašīnu un uzaicināt citus lietotājus.'
      case 'DRIVER':
        return 'Kā vadītājs jūs varēsit skatīt mašīnas datus un informāciju.'
      case 'VIEWER':
        return 'Kā skatītājs jūs varēsit skatīt mašīnas datus un statistiku, bet ne braukšanas atskaites.'
      default:
        return 'Jums būs piekļuve šai mašīnai.'
    }
  }

  const loadReceivedInvites = async () => {
    setIsLoading(true)
    try {
      const invites = await inviteApi.getReceivedInvites()
      setReceivedInvites(invites)
    } catch (err) {
      console.error('Failed to load invites:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const refreshCarList = async () => {
    try {
      const response = await carApi.getUserCars()
      if (response.success && response.cars) {
        setUserCars(response.cars)
      }
    } catch (err) {
      console.error('Failed to refresh car list:', err)
    }
  }

  useEffect(() => {
    loadReceivedInvites()
  }, [])

  const handleAccept = async (inviteId: number) => {
    try {
      const response = await inviteApi.acceptInvite(inviteId)
      if (response.success) {
        alert('Uzaicinājums pieņemts! Tagad jums ir piekļuve šai mašīnai.')
        loadReceivedInvites()
        // Refresh the cars list
        await refreshCarList()
      }
    } catch (err: any) {
      alert(err.message || 'Neizdevās pieņemt uzaicinājumu')
    }
  }

  const handleDecline = async (inviteId: number) => {
    if (!confirm('Vai tiešām vēlaties noraidīt šo uzaicinājumu?')) return

    try {
      const response = await inviteApi.declineInvite(inviteId)
      if (response.success) {
        alert('Uzaicinājums noraidīts')
        loadReceivedInvites()
      }
    } catch (err: any) {
      alert(err.message || 'Neizdevās noraidīt uzaicinājumu')
    }
  }

  return (
    <div>
      <main className="p-6">
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Mani uzaicinājumi</h2>
            <p className="text-sm text-gray-600 mt-1">
              Uzaicinājumi no citiem lietotājiem piekļuvei viņu mašīnām
            </p>
          </div>

          <div className="p-6">
            {isLoading ? (
              <div className="text-center py-8 text-gray-500">
                <p>Ielādē uzaicinājumus...</p>
              </div>
            ) : receivedInvites.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p>Jums nav jaunu uzaicinājumu.</p>
                <p className="text-sm mt-2">Kad kāds jūs uzaicinās, uzaicinājums parādīsies šeit.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {receivedInvites.map((invite) => (
                  <div key={invite.inviteId} className="bg-white border border-gray-200 rounded-lg p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <h3 className="text-lg font-semibold text-gray-900">
                            {invite.carBrand} {invite.carModel} ({invite.carYear})
                          </h3>
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            invite.inviteStatus === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {invite.inviteStatus === 'PENDING' ? 'Gaida' : invite.inviteStatus}
                          </span>
                        </div>

                        <div className="space-y-1 text-sm text-gray-600">
                          <p>
                            <span className="font-medium">No:</span> {invite.inviterUsername} ({invite.inviterEmail})
                          </p>
                          <p>
                            <span className="font-medium">Loma:</span> {getRoleLabel(invite.roleCode)}
                          </p>
                          <p>
                            <span className="font-medium">Nosūtīts:</span> {invite.createdAt ? new Date(invite.createdAt).toLocaleDateString('lv-LV', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            }) : 'Nav zināms'}
                          </p>
                        </div>

                        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
                          <p className="text-sm text-blue-800">
                            {getRoleDescription(invite.roleCode)}
                          </p>
                        </div>
                      </div>
                    </div>

                    {invite.inviteStatus === 'PENDING' && (
                      <div className="flex space-x-3 mt-4 pt-4 border-t border-gray-200">
                        <Button
                          onClick={() => handleAccept(invite.inviteId)}
                          className="flex-1"
                        >
                          Pieņemt
                        </Button>
                        <Button
                          onClick={() => handleDecline(invite.inviteId)}
                          variant="outline"
                          className="flex-1"
                        >
                          Noraidīt
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
