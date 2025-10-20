import { useLoginStore } from "@/store/loginStore";
import { useUser } from "../authentication/userContext";
export default function DebugAuth() {
  const { user, isAuthenticated, loading, error } = useLoginStore();
  const { role } = useUser();
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }
  return (
    <div className="fixed bottom-4 right-4 bg-black text-white p-4 rounded-lg text-xs max-w-sm">
      <h3 className="font-bold mb-2">Auth Debug</h3>
      <div>Store Auth: {isAuthenticated ? "✅" : "❌"}</div>
      <div>Loading: {loading ? "⏳" : "✅"}</div>
      <div>User: {user?.name || "None"}</div>
      <div>Role: {user?.role || "None"}</div>
      <div>Context Role: {role || "None"}</div>
      <div>LocalStorage: {localStorage.getItem('isLoggedIn') || "None"}</div>
      {error && <div className="text-red-300">Error: {error}</div>}
    </div>
  );
}
