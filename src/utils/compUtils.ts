// Function to extract ID from pathname
export const getIdFromPathname = (pathname: string) => {
  const segments = pathname.split("/");
  return segments[segments.length - 1];
};
