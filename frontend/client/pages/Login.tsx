import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useLoginStore } from "@/store/loginStore";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import {useUser} from "../authentication/userContext";
import {useNavigate} from "react-router-dom";
import DebugAuth from "@/components/DebugAuth";


export default function LoginPage() {
  const [view, setView] = useState("menu");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const {setRole} = useUser();
  const navigate = useNavigate();
  const { login, loading, error: storeError, clearError } = useLoginStore();

  const validRoles = ["Security", "HR", "User", "Head Department", "Director", "Super User"] as const;
  type Role = typeof validRoles[number];

  const handleLogin = async () => {
    if (!username || !password) {
      setError("Please fill in all fields");
      return;
    }

    clearError();
    setError("");

    try {
      const result = await login({ username, password });
      
      if (result.success && result.user) {
        const normalizedRole = result.user.role === "Staff" ? "User" : result.user.role;

        // Update user context
        setRole(normalizedRole as Role);

        // Navigate based on role
        switch (normalizedRole) {
          case "HR":
          case "User":
          case "Head Department":
          case "Super User":
          case "Director":
            navigate("/leave");
            break;
          case "Security":
            navigate("/dashboard");
            break;
          default:
            navigate("/leave");
        }
      } else {
        setError(result.message || "Login failed");
      }
    } catch (error) {
      console.error("Login error:", error);
      setError("An unexpected error occurred");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <DebugAuth />
      <div className="flex w-full max-w-5xl h-[90vh] shadow-xl rounded-2xl overflow-hidden bg-white">
        {/* Left Side */}
        <div
          className="hidden md:block w-1/2 bg-cover bg-center relative"
          style={{ backgroundImage: "url('/alkindofoto.jpeg')" }}
        >
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center text-white p-8">
            <h2 className="text-3xl font-bold text-yellow-500">PT Alkindo Naratama</h2>
          </div>
        </div>

        {/* Right Side */}
        <div className="w-full md:w-1/2 p-10 flex items-center justify-center">
          <div className="w-full max-w-md space-y-6">
            {view === "menu" && (
              <div className="flex flex-col items-center space-y-5">
                <h1 className="text-3xl font-bold text-gray-800">
                  Welcome to, <span className="text-blue-400">Gate System</span>
                </h1>
                <p className="text-gray-500">Please select an option to proceed</p>
                <Button className="w-full" onClick={() => setView("login")}>Login</Button>
              </div>
            )}

            {view === "login" && (
              <div className="space-y-4">
                <h2 className="text-2xl font-bold text-center">Log in</h2>
                <Input
                  placeholder="Username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  disabled={loading}
                />
                <Input
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                  onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
                />
                <Button 
                  className="w-full" 
                  onClick={handleLogin}
                  disabled={loading}
                >
                  {loading ? "Signing In..." : "Sign In"}
                </Button>
                {(error || storeError) && (
                  <p className="text-red-500 text-sm font-bold text-center mt-2">
                    {error || storeError}
                  </p>
                )}
                <Button variant="ghost" className="w-full text-sm" onClick={() => setView("menu")}>
                  ← Back
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
