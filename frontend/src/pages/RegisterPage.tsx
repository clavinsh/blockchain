import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Link, useNavigate } from "react-router-dom";

export default function RegisterPage() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    deviceCode: "",
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: ""
  });
  const [errors, setErrors] = useState({
    deviceCode: "",
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: ""
  });
  const [isLoading, setIsLoading] = useState(false);

  const validateForm = () => {
    const newErrors = {
      deviceCode: "",
      firstName: "",
      lastName: "",
      email: "",
      password: "",
      confirmPassword: ""
    };
    
    // Device code validation
    if (!formData.deviceCode) {
      newErrors.deviceCode = "Aparāta kods ir obligāts";
    } else if (formData.deviceCode.length < 8) {
      newErrors.deviceCode = "Aparāta kodam jābūt vismaz 8 simboli garam";
    }
    
    // First name validation
    if (!formData.firstName) {
      newErrors.firstName = "Vārds ir obligāts";
    }
    
    // Last name validation
    if (!formData.lastName) {
      newErrors.lastName = "Uzvārds ir obligāts";
    }
    
    // Email validation
    if (!formData.email) {
      newErrors.email = "E-pasts ir obligāts";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Nepareizs e-pasta formāts";
    }
    
    // Password validation
    if (!formData.password) {
      newErrors.password = "Parole ir obligāta";
    } else if (formData.password.length < 6) {
      newErrors.password = "Parolei jābūt vismaz 6 simboli garā";
    }
    
    // Confirm password validation
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = "Paroles apstiprināšana ir obligāta";
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Paroles nesakrīt";
    }
    
    setErrors(newErrors);
    return !Object.values(newErrors).some(error => error !== "");
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user starts typing
    if (errors[name as keyof typeof errors]) {
      setErrors(prev => ({
        ...prev,
        [name]: ""
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    
    try {
      // TODO: Replace with actual API call
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // TODO: Handle actual registration response
      console.log('Registration attempt:', formData);
      
      // For now, redirect to login with success message
      navigate('/login');
    } catch (error) {
      console.error('Registration error:', error);
      setErrors(prev => ({ 
        ...prev,
        deviceCode: "Reģistrācija neizdevās. Lūdzu, mēģiniet vēlreiz." 
      }));
    } finally {
      setIsLoading(false);
    }
  };
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow-md">
        <div>
          <h2 className="mt-6 text-center text-3xl font-bold text-gray-900">
            Reģistrācija
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Ievadiet aparāta kodu un personīgo informāciju
          </p>
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label htmlFor="deviceCode" className="block text-sm font-medium text-gray-700">
                Aparāta kods *
              </label>
              <input
                id="deviceCode"
                name="deviceCode"
                type="text"
                required
                value={formData.deviceCode}
                onChange={handleInputChange}
                className={`mt-1 appearance-none relative block w-full px-3 py-2 border rounded-md focus:outline-none focus:z-10 sm:text-sm ${
                  errors.deviceCode 
                    ? 'border-red-300 focus:ring-red-500 focus:border-red-500' 
                    : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                } placeholder-gray-500 text-gray-900`}
                placeholder="Ievadiet aparāta kodu"
              />
              {errors.deviceCode && (
                <p className="mt-1 text-sm text-red-600">{errors.deviceCode}</p>
              )}
            </div>
            
            <div>
              <label htmlFor="firstName" className="block text-sm font-medium text-gray-700">
                Vārds *
              </label>
              <input
                id="firstName"
                name="firstName"
                type="text"
                required
                value={formData.firstName}
                onChange={handleInputChange}
                className={`mt-1 appearance-none relative block w-full px-3 py-2 border rounded-md focus:outline-none focus:z-10 sm:text-sm ${
                  errors.firstName 
                    ? 'border-red-300 focus:ring-red-500 focus:border-red-500' 
                    : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                } placeholder-gray-500 text-gray-900`}
                placeholder="Jūsu vārds"
              />
              {errors.firstName && (
                <p className="mt-1 text-sm text-red-600">{errors.firstName}</p>
              )}
            </div>
            
            <div>
              <label htmlFor="lastName" className="block text-sm font-medium text-gray-700">
                Uzvārds *
              </label>
              <input
                id="lastName"
                name="lastName"
                type="text"
                required
                value={formData.lastName}
                onChange={handleInputChange}
                className={`mt-1 appearance-none relative block w-full px-3 py-2 border rounded-md focus:outline-none focus:z-10 sm:text-sm ${
                  errors.lastName 
                    ? 'border-red-300 focus:ring-red-500 focus:border-red-500' 
                    : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                } placeholder-gray-500 text-gray-900`}
                placeholder="Jūsu uzvārds"
              />
              {errors.lastName && (
                <p className="mt-1 text-sm text-red-600">{errors.lastName}</p>
              )}
            </div>
            
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                E-pasts *
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                value={formData.email}
                onChange={handleInputChange}
                className={`mt-1 appearance-none relative block w-full px-3 py-2 border rounded-md focus:outline-none focus:z-10 sm:text-sm ${
                  errors.email 
                    ? 'border-red-300 focus:ring-red-500 focus:border-red-500' 
                    : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                } placeholder-gray-500 text-gray-900`}
                placeholder="jūsu.epasts@example.com"
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-600">{errors.email}</p>
              )}
            </div>
            
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Parole *
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                value={formData.password}
                onChange={handleInputChange}
                className={`mt-1 appearance-none relative block w-full px-3 py-2 border rounded-md focus:outline-none focus:z-10 sm:text-sm ${
                  errors.password 
                    ? 'border-red-300 focus:ring-red-500 focus:border-red-500' 
                    : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                } placeholder-gray-500 text-gray-900`}
                placeholder="Izvēlieties paroli"
              />
              {errors.password && (
                <p className="mt-1 text-sm text-red-600">{errors.password}</p>
              )}
            </div>
            
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                Apstiprināt paroli *
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                required
                value={formData.confirmPassword}
                onChange={handleInputChange}
                className={`mt-1 appearance-none relative block w-full px-3 py-2 border rounded-md focus:outline-none focus:z-10 sm:text-sm ${
                  errors.confirmPassword 
                    ? 'border-red-300 focus:ring-red-500 focus:border-red-500' 
                    : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                } placeholder-gray-500 text-gray-900`}
                placeholder="Ievadiet paroli atkārtoti"
              />
              {errors.confirmPassword && (
                <p className="mt-1 text-sm text-red-600">{errors.confirmPassword}</p>
              )}
            </div>
          </div>

          <div>
            <Button 
              type="submit" 
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Reģistrējas...
                </div>
              ) : (
                "Reģistrēties"
              )}
            </Button>
          </div>
          
          <div className="text-center">
            <Link to="/login" className="text-sm text-blue-600 hover:text-blue-500">
              Jau ir konts? Pierakstīties šeit
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}