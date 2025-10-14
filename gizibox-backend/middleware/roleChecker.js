export function verifyRole(profile, requiredRole) {
    if (profile.role !== requiredRole) {
      throw new Error("Access denied: insufficient privileges");
    }
  }  