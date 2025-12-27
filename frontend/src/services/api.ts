const API_BASE_URL = 'http://localhost:5000/api';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
}

export interface UserInfo {
  userId: number;
  username: string;
  email: string;
  firstName?: string;
  lastName?: string;
}

export interface LoginResponse {
  success: boolean;
  message: string;
  token?: string;
  user?: UserInfo;
}

export const authApi = {
  login: async (credentials: LoginRequest): Promise<LoginResponse> => {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(credentials),
    });

    if (!response.ok) {
      let errorMessage = 'Neizdevās pieteikties';
      
      try {
        const error = await response.json();
        if (error.message) {
          errorMessage = error.message;
        }
      } catch {
        if (response.status === 401) {
          errorMessage = 'Nepareiza e-pasta adrese vai parole';
        } else if (response.status === 400) {
          errorMessage = 'Nepareizi ievadīti dati';
        } else if (response.status >= 500) {
          errorMessage = 'Servera kļūda. Lūdzu mēģiniet vēlāk';
        } else {
          errorMessage = response.statusText || errorMessage;
        }
      }
      
      throw new Error(errorMessage);
    }

    return response.json();
  },

  register: async (data: RegisterRequest): Promise<LoginResponse> => {
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      let errorMessage = 'Neizdevās reģistrēties';
      
      try {
        const error = await response.json();
        if (error.message) {
          errorMessage = error.message;
        }
      } catch {
        if (response.status === 409) {
          errorMessage = 'Lietotājs ar šādu e-pastu jau eksistē';
        } else if (response.status === 400) {
          errorMessage = 'Nepareizi ievadīti dati';
        } else if (response.status >= 500) {
          errorMessage = 'Servera kļūda. Lūdzu mēģiniet vēlāk';
        } else {
          errorMessage = response.statusText || errorMessage;
        }
      }
      
      throw new Error(errorMessage);
    }

    return response.json();
  },
};

// Token management
export interface UserCar {
  carId: number;
  brand: string;
  model: string;
  year: number;
  licensePlate: string;
  vin?: string;
  color?: string;
  mileage?: number;
  assignedAt?: string;
  roleCode: string;
}

export interface GetUserCarsResponse {
  success: boolean;
  message: string;
  cars?: UserCar[];
}

export interface CarDataItem {
  id: number;
  carId: number;
  carData: string;
  insertTime?: string;
}

export interface GetCarDataResponse {
  success: boolean;
  message: string;
  data?: CarDataItem[];
}

export interface CarUser {
  id: number;
  userId: number;
  username: string;
  email: string;
  firstName?: string;
  lastName?: string;
  roleCode: string;
  assignedAt?: string;
}

export interface CreateCarRequest {
  brand: string;
  model: string;
  year: number;
  licensePlate?: string;
  vin?: string;
  color?: string;
  mileage?: number;
}

export interface CreateCarResponse {
  success: boolean;
  message: string;
  carId?: number;
}

export const carApi = {
  getUserCars: async (): Promise<GetUserCarsResponse> => {
    const token = tokenManager.getToken();

    if (!token) {
      throw new Error('No authentication token found');
    }

    try {
      const response = await fetch(`${API_BASE_URL}/cars`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('API Error Response:', {
          status: response.status,
          statusText: response.statusText,
          body: errorText
        });
        throw new Error(`Neizdevās ielādēt mašīnu sarakstu: ${response.status} ${response.statusText}`);
      }

      return response.json();
    } catch (error) {
      console.error('Fetch error details:', error);
      throw error;
    }
  },

  getCarUsers: async (carId: number): Promise<CarUser[]> => {
    const token = tokenManager.getToken();

    if (!token) {
      throw new Error('No authentication token found');
    }

    const response = await fetch(`${API_BASE_URL}/cars/${carId}/users`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Neizdevās ielādēt mašīnas lietotājus');
    }

    const data = await response.json();
    return data.users;
  },

  removeCarUser: async (carId: number, userCarId: number): Promise<void> => {
    const token = tokenManager.getToken();

    if (!token) {
      throw new Error('No authentication token found');
    }

    const response = await fetch(`${API_BASE_URL}/cars/${carId}/users/${userCarId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Neizdevās noņemt lietotāja piekļuvi');
    }
  },

  getCarById: async (carId: number) => {
    const token = tokenManager.getToken();

    if (!token) {
      throw new Error('No authentication token found');
    }

    const response = await fetch(`${API_BASE_URL}/cars/${carId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Neizdevās ielādēt mašīnas informāciju');
    }

    return response.json();
  },

  getCarData: async (carId: number, limit: number = 20): Promise<GetCarDataResponse> => {
    const token = tokenManager.getToken();

    if (!token) {
      throw new Error('No authentication token found');
    }

    const response = await fetch(`${API_BASE_URL}/cars/${carId}/data?limit=${limit}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Neizdevās ielādēt mašīnas datus');
    }

    return response.json();
  },

  createCar: async (carData: CreateCarRequest): Promise<CreateCarResponse> => {
    const token = tokenManager.getToken();

    if (!token) {
      throw new Error('No authentication token found');
    }

    const response = await fetch(`${API_BASE_URL}/cars`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(carData),
    });

    if (!response.ok) {
      console.error('CreateCar API Error:', {
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries()),
        url: response.url
      });
      
      let errorMessage = 'Neizdevās izveidot mašīnu';
      
      try {
        // Try to parse JSON response first
        const error = await response.json();
        console.error('CreateCar JSON Error:', error);
        if (error.message) {
          errorMessage = error.message;
        }
      } catch (jsonError) {
        console.error('CreateCar JSON Parse Failed:', jsonError);
        // If JSON parsing fails, try to get raw text
        try {
          const errorText = await response.clone().text();
          console.error('CreateCar Raw Error Text:', errorText);
          
          // Handle specific database constraint errors
          if (errorText.includes('VIN') || errorText.includes('vin')) {
            errorMessage = 'Šis VIN kods jau tiek izmantots citai mašīnai';
          } else if (errorText.includes('LicensePlate') || errorText.includes('license') || errorText.includes('numurzīme')) {
            errorMessage = 'Šī numurzīme jau tiek izmantota citai mašīnai';
          } else if (errorText.includes('duplicate') || errorText.includes('UNIQUE constraint')) {
            errorMessage = 'Šie dati jau tiek izmantoti citai mašīnai';
          } else if (response.status === 400) {
            errorMessage = 'Nepareizi ievadīti dati';
          } else if (response.status === 401) {
            errorMessage = 'Nav autorizācijas';
          } else if (response.status === 403) {
            errorMessage = 'Nav atļaujas veikt šo darbību';
          } else if (response.status >= 500) {
            errorMessage = 'Servera kļūda. Lūdzu mēģiniet vēlāk';
          } else {
            errorMessage = response.statusText || errorMessage;
          }
        } catch (textError) {
          console.error('CreateCar Text Parse Failed:', textError);
          // Last fallback
          errorMessage = `HTTP ${response.status}: ${response.statusText || 'Nezināma kļūda'}`;
        }
      }
      
      console.error('CreateCar Final Error Message:', errorMessage);
      throw new Error(errorMessage);
    }

    return response.json();
  },

  updateCar: async (carId: number, carData: CreateCarRequest): Promise<CreateCarResponse> => {
    const token = tokenManager.getToken();

    if (!token) {
      throw new Error('No authentication token found');
    }

    const response = await fetch(`${API_BASE_URL}/cars/${carId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(carData),
    });

    if (!response.ok) {
      console.error('UpdateCar API Error:', {
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries()),
        url: response.url
      });
      
      let errorMessage = 'Neizdevās atjaunināt mašīnu';
      
      try {
        // Try to parse JSON response first
        const error = await response.json();
        console.error('UpdateCar JSON Error:', error);
        if (error.message) {
          errorMessage = error.message;
        }
      } catch (jsonError) {
        console.error('UpdateCar JSON Parse Failed:', jsonError);
        // If JSON parsing fails, try to get raw text
        try {
          const errorText = await response.clone().text();
          console.error('UpdateCar Raw Error Text:', errorText);
          
          // Handle specific database constraint errors
          if (errorText.includes('VIN') || errorText.includes('vin')) {
            errorMessage = 'Šis VIN kods jau tiek izmantots citai mašīnai';
          } else if (errorText.includes('LicensePlate') || errorText.includes('license') || errorText.includes('numurzīme')) {
            errorMessage = 'Šī numurzīme jau tiek izmantota citai mašīnai';
          } else if (errorText.includes('duplicate') || errorText.includes('UNIQUE constraint')) {
            errorMessage = 'Šie dati jau tiek izmantoti citai mašīnai';
          } else if (response.status === 400) {
            errorMessage = 'Nepareizi ievadīti dati';
          } else if (response.status === 401) {
            errorMessage = 'Nav autorizācijas';
          } else if (response.status === 403) {
            errorMessage = 'Nav atļaujas veikt šo darbību';
          } else if (response.status >= 500) {
            errorMessage = 'Servera kļūda. Lūdzu mēģiniet vēlāk';
          } else {
            errorMessage = response.statusText || errorMessage;
          }
        } catch (textError) {
          console.error('UpdateCar Text Parse Failed:', textError);
          // Last fallback
          errorMessage = `HTTP ${response.status}: ${response.statusText || 'Nezināma kļūda'}`;
        }
      }
      
      console.error('UpdateCar Final Error Message:', errorMessage);
      throw new Error(errorMessage);
    }

    return response.json();
  },

  transferOwnership: async (carId: number, newOwnerEmail: string): Promise<TransferOwnershipResponse> => {
    const token = tokenManager.getToken();

    if (!token) {
      throw new Error('No authentication token found');
    }

    const response = await fetch(`${API_BASE_URL}/cars/${carId}/transfer-ownership`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ carId, newOwnerEmail }),
    });

    if (!response.ok) {
      let errorMessage = 'Neizdevās nodot īpašumtiesības';
      
      try {
        const error = await response.json();
        if (error.message) {
          errorMessage = error.message;
        }
      } catch (jsonError) {
        if (response.status === 400) {
          errorMessage = 'Nepareizi ievadīti dati';
        } else if (response.status === 401) {
          errorMessage = 'Nav autorizācijas';
        } else if (response.status === 403) {
          errorMessage = 'Nav atļaujas nodot īpašumtiesības';
        } else if (response.status === 404) {
          errorMessage = 'Lietotājs ar šādu e-pasta adresi neeksistē';
        } else if (response.status >= 500) {
          errorMessage = 'Servera kļūda. Lūdzu mēģiniet vēlāk';
        } else {
          errorMessage = response.statusText || errorMessage;
        }
      }
      
      throw new Error(errorMessage);
    }

    return response.json();
  },

  changeUserRole: async (carId: number, userId: number, newRole: string): Promise<RoleChangeResponse> => {
    const token = tokenManager.getToken();

    if (!token) {
      throw new Error('No authentication token found');
    }

    const response = await fetch(`${API_BASE_URL}/cars/${carId}/change-role`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ carId, userId, newRole }),
    });

    if (!response.ok) {
      let errorMessage = 'Neizdevās mainīt lietotāja lomu';
      
      try {
        const error = await response.json();
        if (error.message) {
          errorMessage = error.message;
        }
      } catch (jsonError) {
        if (response.status === 400) {
          errorMessage = 'Nepareizi ievadīti dati';
        } else if (response.status === 403) {
          errorMessage = 'Nav atļaujas mainīt šo lomu';
        } else if (response.status === 404) {
          errorMessage = 'Lietotājs nav atrasts';
        } else if (response.status >= 500) {
          errorMessage = 'Servera kļūda. Lūdzu mēģiniet vēlāk';
        }
      }
      
      throw new Error(errorMessage);
    }

    return response.json();
  },

  assignViewer: async (carId: number, email: string): Promise<RoleChangeResponse> => {
    const token = tokenManager.getToken();

    if (!token) {
      throw new Error('No authentication token found');
    }

    const response = await fetch(`${API_BASE_URL}/cars/${carId}/assign-viewer`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ carId, email }),
    });

    if (!response.ok) {
      let errorMessage = 'Neizdevās piešķirt apskatītāja lomu';
      
      try {
        const error = await response.json();
        if (error.message) {
          errorMessage = error.message;
        }
      } catch (jsonError) {
        if (response.status === 400) {
          errorMessage = 'Nepareizi ievadīti dati';
        } else if (response.status === 404) {
          errorMessage = 'Lietotājs ar šādu e-pasta adresi neeksistē';
        } else if (response.status >= 500) {
          errorMessage = 'Servera kļūda. Lūdzu mēģiniet vēlāk';
        }
      }
      
      throw new Error(errorMessage);
    }

    return response.json();
  },

  removeUserAccess: async (carId: number, userId: number): Promise<RoleChangeResponse> => {
    try {
      const token = tokenManager.getToken();

      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch(`${API_BASE_URL}/cars/${carId}/users/${userId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        let errorMessage = 'Neizdevās noņemt lietotāja piekļuvi';
        
        try {
          const error = await response.json();
          if (error.message) {
            errorMessage = error.message;
          }
        } catch (jsonError) {
          if (response.status === 400) {
            errorMessage = 'Nepareizi ievadīti dati';
          } else if (response.status === 403) {
            errorMessage = 'Nav atļaujas noņemt šo piekļuvi';
          } else if (response.status === 404) {
            errorMessage = 'Lietotājs nav atrasts';
          } else if (response.status >= 500) {
            errorMessage = 'Servera kļūda. Lūdzu mēģiniet vēlāk';
          }
        }
        
        throw new Error(errorMessage);
      }

      return response.json();
    } catch (error) {
      console.error('Remove user access error:', error);
      throw new Error(error instanceof Error ? error.message : 'Neizdevās noņemt lietotāja piekļuvi');
    }
  }
};

// Delete car (OWNER only)
export const deleteCar = async (carId: number): Promise<boolean> => {
  try {
    const token = tokenManager.getToken();
    if (!token) {
      throw new Error('Nav autorizācijas tokena');
    }

    const response = await fetch(`${API_BASE_URL}/cars/${carId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      let errorMessage = 'Neizdevās dzēst automašīnu';
      
      try {
        const error = await response.json();
        if (error.message) {
          errorMessage = error.message;
        }
      } catch (e) {
        // If parsing fails, use the default message
      }

      throw new Error(errorMessage);
    }

    return true;
  } catch (error) {
    console.error('Delete car error:', error);
    throw new Error(error instanceof Error ? error.message : 'Neizdevās dzēst automašīnu');
  }
};

export interface TransferOwnershipResponse {
  success: boolean;
  message: string;
}

export interface RoleChangeResponse {
  success: boolean;
  message: string;
}

// Car Invites
export interface CreateInviteRequest {
  carId: number;
  invitedUserEmail: string;
  roleCode: 'OWNER' | 'DRIVER' | 'VIEWER';
}

export interface InviteResponse {
  inviteId: number;
  carId: number;
  carBrand: string;
  carModel: string;
  carYear: number;
  inviterUsername: string;
  inviterEmail: string;
  invitedUsername: string;
  invitedEmail: string;
  roleCode: string;
  inviteStatus: string;
  createdAt?: string;
}

export interface InviteActionResponse {
  success: boolean;
  message: string;
  invite?: InviteResponse;
}

export const inviteApi = {
  createInvite: async (request: CreateInviteRequest): Promise<InviteActionResponse> => {
    const token = tokenManager.getToken();

    if (!token) {
      throw new Error('No authentication token found');
    }

    const response = await fetch(`${API_BASE_URL}/carinvites`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      let errorMessage = 'Neizdevās izveidot uzaicinājumu';
      
      try {
        // Try to parse JSON response first
        const error = await response.json();
        if (error.message) {
          errorMessage = error.message;
        }
      } catch (jsonError) {
        // If JSON parsing fails, try to get raw text
        try {
          const errorText = await response.clone().text();
          
          // Handle specific error cases
          if (errorText.includes('not found') || errorText.includes('neeksistē')) {
            errorMessage = 'Lietotājs ar šādu e-pastu neeksistē';
          } else if (errorText.includes('already exists') || errorText.includes('jau eksistē')) {
            errorMessage = 'Uzaicinājums šim lietotājam jau eksistē';
          } else if (response.status === 400) {
            errorMessage = 'Nepareizi ievadīti dati';
          } else if (response.status === 401) {
            errorMessage = 'Nav autorizācijas';
          } else if (response.status === 403) {
            errorMessage = 'Nav atļaujas nosūtīt uzaicinājumus';
          } else if (response.status >= 500) {
            errorMessage = 'Servera kļūda. Lūdzu mēģiniet vēlāk';
          } else {
            errorMessage = response.statusText || errorMessage;
          }
        } catch {
          // Last fallback
          errorMessage = `HTTP ${response.status}: ${response.statusText || 'Nezināma kļūda'}`;
        }
      }
      
      throw new Error(errorMessage);
    }

    return response.json();
  },

  getReceivedInvites: async (): Promise<InviteResponse[]> => {
    const token = tokenManager.getToken();

    if (!token) {
      throw new Error('No authentication token found');
    }

    const response = await fetch(`${API_BASE_URL}/carinvites/received`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Neizdevās ielādēt saņemtos uzaicinājumus');
    }

    return response.json();
  },

  getSentInvites: async (): Promise<InviteResponse[]> => {
    const token = tokenManager.getToken();

    if (!token) {
      throw new Error('No authentication token found');
    }

    const response = await fetch(`${API_BASE_URL}/carinvites/sent`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Neizdevās ielādēt nosūtītos uzaicinājumus');
    }

    return response.json();
  },

  acceptInvite: async (inviteId: number): Promise<InviteActionResponse> => {
    const token = tokenManager.getToken();

    if (!token) {
      throw new Error('No authentication token found');
    }

    const response = await fetch(`${API_BASE_URL}/carinvites/${inviteId}/accept`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Neizdevās pieņemt uzaicinājumu');
    }

    return response.json();
  },

  declineInvite: async (inviteId: number): Promise<InviteActionResponse> => {
    const token = tokenManager.getToken();

    if (!token) {
      throw new Error('No authentication token found');
    }

    const response = await fetch(`${API_BASE_URL}/carinvites/${inviteId}/decline`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Neizdevās noraidīt uzaicinājumu');
    }

    return response.json();
  },

  cancelInvite: async (inviteId: number): Promise<InviteActionResponse> => {
    const token = tokenManager.getToken();

    if (!token) {
      throw new Error('No authentication token found');
    }

    const response = await fetch(`${API_BASE_URL}/carinvites/${inviteId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Neizdevās atcelt uzaicinājumu');
    }

    return response.json();
  },
};

// Blockchain Telemetry Interfaces
export interface VehicleTelemetry {
  carId: string;
  carData: string;
  insertTime: string;
}

export interface DrivingEvent {
  timestamp: string;
  latitude: number;
  longitude: number;
  severity: 'Low' | 'Medium' | 'High';
  speed: number;
  description: string;
}

export interface DateRange {
  startDate: string;
  endDate: string;
}

export interface BasicStatistics {
  totalDistance: number;
  totalDrivingTime: string;
  averageSpeed: number;
  maxSpeed: number;
  averageRpm: number;
  maxRpm: number;
  fuelConsumption: number;
  numberOfTrips: number;
  dataPointsAnalyzed: number;
}

export interface DrivingBehaviorAnalysis {
  harshBrakingEvents: DrivingEvent[];
  harshAccelerationEvents: DrivingEvent[];
  harshCorneringEvents: DrivingEvent[];
  speedingEvents: DrivingEvent[];
  overRevvingEvents: DrivingEvent[];
  smoothDrivingPercentage: number;
}

export interface RiskAssessment {
  overallRiskLevel: 'VeryLow' | 'Low' | 'Moderate' | 'High' | 'VeryHigh';
  insurancePremiumMultiplier: number;
  accidentRiskScore: number;
  vehicleDepreciationRate: number;
  riskFactors: string[];
  positiveFactors: string[];
}

export interface VehicleWearEstimate {
  brakeWearLevel: 'Low' | 'Moderate' | 'High' | 'Severe';
  engineWearLevel: 'Low' | 'Moderate' | 'High' | 'Severe';
  tireWearLevel: 'Low' | 'Moderate' | 'High' | 'Severe';
  transmissionStress: number;
  estimatedMaintenanceCost: number;
}

export interface DrivingReport {
  carId: string;
  reportGeneratedAt: string;
  analysisPeriod: DateRange;
  basicStatistics: BasicStatistics;
  drivingBehavior: DrivingBehaviorAnalysis;
  overallDrivingScore: number;
  riskAssessment: RiskAssessment;
  vehicleWearEstimate: VehicleWearEstimate;
  recommendations: string[];
}

export interface InsuranceSummary {
  vehicleId: string;
  analysisPeriod: DateRange;
  drivingScore: number;
  riskLevel: 'VeryLow' | 'Low' | 'Moderate' | 'High' | 'VeryHigh';
  recommendedPremiumMultiplier: number;
  safetyIncidents: number;
  totalDistance: number;
  smoothDrivingPercentage: number;
}

export interface ResellerSummary {
  vehicleId: string;
  analysisPeriod: DateRange;
  totalDistance: number;
  drivingScore: number;
  vehicleConditionRating: string;
  estimatedDepreciationRate: number;
  brakeCondition: 'Low' | 'Moderate' | 'High' | 'Severe';
  engineCondition: 'Low' | 'Moderate' | 'High' | 'Severe';
  tireCondition: 'Low' | 'Moderate' | 'High' | 'Severe';
  estimatedMaintenanceCost: number;
  recommendedActions: string[];
}

// Blockchain Telemetry API
export const telemetryApi = {
  /**
   * Get blockchain telemetry data for a specific vehicle
   */
  getBlockchainTelemetry: async (carId: number): Promise<VehicleTelemetry[]> => {
    const token = tokenManager.getToken();

    if (!token) {
      throw new Error('No authentication token found');
    }

    console.log(`[API] Fetching blockchain telemetry for car ${carId} from ${API_BASE_URL}/telemetry/blockchain/${carId}`);

    const response = await fetch(`${API_BASE_URL}/telemetry/blockchain/${carId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    console.log(`[API] Response status: ${response.status} ${response.statusText}`);

    if (!response.ok) {
      let errorMessage = 'Failed to fetch blockchain telemetry data';
      try {
        const errorData = await response.json();
        console.error('[API] Error response:', errorData);
        if (errorData.message) {
          errorMessage = errorData.message;
        }
      } catch (parseError) {
        // If JSON parsing fails, use status text
        console.error('[API] Failed to parse error response:', parseError);
        errorMessage = `HTTP ${response.status}: ${response.statusText || 'Failed to fetch blockchain telemetry data'}`;
      }
      throw new Error(errorMessage);
    }

    const data = await response.json();
    console.log(`[API] Successfully fetched ${data.length} telemetry records`);
    return data;
  },

  /**
   * Get blockchain telemetry data for a specific vehicle within a time range
   */
  getBlockchainTelemetryByTimeRange: async (
    carId: number,
    startTime?: Date,
    endTime?: Date
  ): Promise<VehicleTelemetry[]> => {
    const token = tokenManager.getToken();

    if (!token) {
      throw new Error('No authentication token found');
    }

    const params = new URLSearchParams();
    if (startTime) {
      params.append('startTime', startTime.toISOString());
    }
    if (endTime) {
      params.append('endTime', endTime.toISOString());
    }

    const url = `${API_BASE_URL}/telemetry/blockchain/${carId}/range${params.toString() ? `?${params.toString()}` : ''}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch blockchain telemetry data');
    }

    return response.json();
  },

  /**
   * Get comprehensive driving behavior report
   */
  getDrivingReport: async (
    carId: number,
    from: Date,
    to: Date
  ): Promise<DrivingReport> => {
    const token = tokenManager.getToken();

    if (!token) {
      throw new Error('No authentication token found');
    }

    const params = new URLSearchParams({
      carId: carId.toString(),
      from: from.toISOString(),
      to: to.toISOString(),
    });

    const response = await fetch(`${API_BASE_URL}/telemetry/report?${params.toString()}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      if (response.status === 403) {
        const error = await response.json();
        throw new Error(error.message || 'Access denied');
      }
      throw new Error('Failed to fetch driving report');
    }

    return response.json();
  },

  /**
   * Get insurance summary report
   */
  getInsuranceSummary: async (
    carId: number,
    from: Date,
    to: Date
  ): Promise<InsuranceSummary> => {
    const token = tokenManager.getToken();

    if (!token) {
      throw new Error('No authentication token found');
    }

    const params = new URLSearchParams({
      carId: carId.toString(),
      from: from.toISOString(),
      to: to.toISOString(),
    });

    const response = await fetch(`${API_BASE_URL}/telemetry/insurance-summary?${params.toString()}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch insurance summary');
    }

    return response.json();
  },

  /**
   * Get reseller summary report
   */
  getResellerSummary: async (
    carId: number,
    from: Date,
    to: Date
  ): Promise<ResellerSummary> => {
    const token = tokenManager.getToken();

    if (!token) {
      throw new Error('No authentication token found');
    }

    const params = new URLSearchParams({
      carId: carId.toString(),
      from: from.toISOString(),
      to: to.toISOString(),
    });

    const response = await fetch(`${API_BASE_URL}/telemetry/reseller-summary?${params.toString()}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch reseller summary');
    }

    return response.json();
  },
};

// Telemetry report API
export const telemetryApiReport = {
  /**
   * Get route data for a specific vehicle within a time range
   * @param carId 
   * @param from 
   * @param to 
   * @returns Route data as JSON 
   */
  getRouteData: async (carId: number, from: Date, to: Date) => {
    const token = tokenManager.getToken();
    if (!token) throw new Error('No authentication token found');

    const params = new URLSearchParams({
      carId: carId.toString(),
      from: from.toISOString(),
      to: to.toISOString(),
    });
    
    const url = `${API_BASE_URL}/telemetry/route?${params.toString()}`;

    const response = await fetch(url, { method: 'GET', headers: { 'Content-Type':'application/json', 'Authorization': `Bearer ${token}` }});

    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.message);
    }
    return response.json();
  },
};


export const tokenManager = {
  getToken: (): string | null => {
    return localStorage.getItem('authToken');
  },

  setToken: (token: string): void => {
    localStorage.setItem('authToken', token);
  },

  removeToken: (): void => {
    localStorage.removeItem('authToken');
  },

  getUser: (): UserInfo | null => {
    const userJson = localStorage.getItem('user');
    return userJson ? JSON.parse(userJson) : null;
  },

  setUser: (user: UserInfo): void => {
    localStorage.setItem('user', JSON.stringify(user));
  },

  removeUser: (): void => {
    localStorage.removeItem('user');
  },

  logout: (): void => {
    tokenManager.removeToken();
    tokenManager.removeUser();
  },
};
