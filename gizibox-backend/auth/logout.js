import { signOut } from "firebase/auth";
import { auth } from "../firebaseConfig.js";

export async function logout() {
  await signOut(auth);
  console.log("User logged out");
}