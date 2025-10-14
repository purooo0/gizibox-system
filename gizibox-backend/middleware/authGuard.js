export function checkAuth(user) {
    if (!user) throw new Error("User not authenticated");
  }  