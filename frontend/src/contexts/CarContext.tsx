import { createContext, useContext, useState, type ReactNode } from 'react'
import type { UserCar } from '@/services/api'

interface CarContextType {
  selectedCarId: number | null
  setSelectedCarId: (carId: number | null) => void
  userCars: UserCar[]
  setUserCars: (cars: UserCar[]) => void
  selectedCar: UserCar | null
}

const CarContext = createContext<CarContextType | undefined>(undefined)

export function CarProvider({ children }: { children: ReactNode }) {
  const [selectedCarId, setSelectedCarId] = useState<number | null>(null)
  const [userCars, setUserCars] = useState<UserCar[]>([])

  const selectedCar = userCars.find(car => car.carId === selectedCarId) || null

  return (
    <CarContext.Provider
      value={{
        selectedCarId,
        setSelectedCarId,
        userCars,
        setUserCars,
        selectedCar
      }}
    >
      {children}
    </CarContext.Provider>
  )
}

export function useCarContext() {
  const context = useContext(CarContext)
  if (context === undefined) {
    throw new Error('useCarContext must be used within a CarProvider')
  }
  return context
}
