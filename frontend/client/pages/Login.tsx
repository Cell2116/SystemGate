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
  const {setRole, setName, setDepartment} = useUser();
  const navigate = useNavigate();
  const { login, loading, error: storeError, clearError } = useLoginStore();
  const validRoles = ["Security", "HR", "Staff", "Head Department", "Director", "Super User", "Admin"] as const;
  type Role = typeof validRoles[number];
  const handleLogin = async () => {
    if (!username || !password) {
      setError("Please fill in all fields");
      return;
    }
    clearError();
    setError("");
    try {
      const result = await login({ username: username.trim(), password });
      
      if (result.success && result.user) {
        const normalizedRole = result.user.role === "Staff" ? "Staff" : result.user.role;
        setRole(normalizedRole as Role);
        setName(result.user.name);
        setDepartment(result.user.department);
        // Navigate based on role
        switch (normalizedRole) {
          case "HR":
          // case "User":
          case "Head Department":
          case "Super User":
            navigate("/leave");
          case "Director":
            navigate("/leave");
            break;
          case "Security":
            navigate("/dashboard");
            break;
          case "Admin":
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
      {/* <DebugAuth /> */}
      <div className="flex w-full max-w-5xl h-[90vh] shadow-xl rounded-2xl overflow-hidden bg-white bg-[url('/alkindofoto.jpeg')] bg-cover bg-center md:bg-none">
        {/* Left Side */}
        <div
          className="hidden md:block w-1/2 bg-cover bg-center relative"
          style={{ backgroundImage: "url('/alkindofoto.jpeg')" }}
        >
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center text-white p-8">
            <h2 className="text-3xl font-bold text-yellow-500">PT Alkindo Naratama Tbk</h2>
          </div>
        </div>
        {/* Right Side */}
        <div className="w-full md:w-1/2 p-10 flex items-center justify-center relative">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm md:hidden z-0"></div>
          <div className="w-full max-w-md space-y-6 relative z-10">
            <div className="relative top-5 md:hidden">
              <h2 className="text-base font-bold text-yellow-500 drop-shadow">PT Alkindo Naratama Tbk</h2>
            </div>
            {view === "menu" && (
              <div className="flex flex-col items-center space-y-5">
                <h1 className="text-3xl font-bold text-white md:text-gray-800">
                  Welcome to, <span className="md:text-blue-400 text-blue-300">Gate System</span>
                </h1>
                <p className="md:text-gray-500 text-slate-400">Please select an option to proceed</p>
                <Button className="w-full" onClick={() => setView("login")}>Login</Button>
              </div>
            )}
            {view === "login" && (
              <div className="space-y-4">
                <h2 className="text-2xl font-bold text-center text-slate-300 md:text-black">Log in</h2>
                <Input
                  placeholder="Username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value.trim())}
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
                <Button variant="ghost" className="w-full text-sm text-slate-300 md:text-black" onClick={() => setView("menu")}>
                  ← Back
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
          <div className="absolute top-2 left-4 md:hidden z-50">
            <h2 className="text-base font-bold text-yellow-500 drop-shadow">PT Alkindo Naratama Tbk</h2>
          </div>
}
