import { differenceInYears } from "date-fns";

// Function to extract ID from pathname
export const getIdFromPathname = (pathname: string) => {
  const segments = pathname.split("/");
  return segments[segments.length - 1];
};

export const calculateAge = (birthDate: string): number => {
  const birthDateObj = new Date(birthDate);
  const currentDate = new Date();
  return differenceInYears(currentDate, birthDateObj);
};
