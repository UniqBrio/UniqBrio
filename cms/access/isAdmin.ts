import { Access } from "payload";

interface User {
  id: string;
  role?: string; // Adjust based on your actual role structure
}

export const isAdmin: Access = ({ req: { user } }) => {
  if (!user) return false;
  return (user as User).role === "admin";
};
