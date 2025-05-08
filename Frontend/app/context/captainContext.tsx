import { createContext, useState, ReactNode } from "react";

interface Captain {
  fullname?: string;
  dob?: string;
  phone?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
  cnic?: string;
  driverLicense?: string;
  vehicleType?: "fire-brigade" | "ambulance" | "police";
}

interface CaptainContextProps {
  captain: Captain | null;
  setCaptain: (captain: Captain | null) => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
  error: string | null;
  setError: (error: string | null) => void;
  updateCaptain: (captainData: Captain) => void;
}

export const CaptainDataContext = createContext<CaptainContextProps | undefined>(undefined);

const CaptainContext = ({ children }: { children: ReactNode }) => {
  const [captain, setCaptain] = useState<Captain | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateCaptain = (captainData: Captain) => setCaptain(captainData);

  return (
    <CaptainDataContext.Provider value={{ captain, setCaptain, isLoading, setIsLoading, error, setError, updateCaptain }}>
      {children}
    </CaptainDataContext.Provider>
  );
};

export default CaptainContext;