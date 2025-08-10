import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { register } from "module";
import {useUser} from "../authentication/userContext";
import {useNavigate} from "react-router-dom";
import DepartmentHead from "./DepartmentLeave";


export default function LoginPage() {
  const [view, setView] = useState("menu");
  const [username, setUsername] = useState("");
  const [error, setError] = useState("");
  const [email, setEmail] = useState("");
  const [registerMessage, setRegisterMessage] = useState({type:"", text:""});
  const {setRole} = useUser();
  const navigate = useNavigate();
  const [registerData, setRegisterData] = useState({
    name: "",
    email: "",
    role: "",
    department: "",
  });

  const dummyUsers = [
    {
      id: 1,
      name: "Sarah Johnson",
      email: "dh@dh.com",
      username: "sarahj",
      department: "Engineering",
      role: "Head Department",
    },
    {
      id: 2,
      name: "David Wilson",
      email: "s@s.com",
      username: "davidw",
      department: "Production", 
      role: "Staff",
    },
    {
      id: 3,
      name: "Alice Cooper",
      email: "hr@hr.com",
      department: "Mechanic",
      username: "alicec",
      role: "HR",
    },
    {
      id: 4,
      name: "Zianarya",
      email: "sc@sc.com",
      department: "Security",
      username: "zizi",
      role: "Security",
    },
    {
      id: 5,
      name: "Lulu",
      email: "dr@dr.com",
      department: "Director",
      username: "didi",
      role: "Director",
    },
    {
      id: 5,
      name: "Cello",
      email: "C@C.com",
      department: "IT",
      username: "Cello",
      role: "Head Department",
    },
  ];
  
  const validRoles = ["Security", "HR", "User", "Head Department", "Director"] as const;
  type Role = typeof validRoles[number];

  const handleLogin = () => {
  const user = dummyUsers.find(
    (u) => u.username === username && u.email === email
  );

  if (user) {
    const normalizedRole = user.role === "Staff" ? "User" : user.role;

    localStorage.setItem("user", JSON.stringify(user)); // tetap simpan 'Staff' agar UI bisa menampilkan
    localStorage.setItem("userRole", normalizedRole);   // simpan yang dikenali untuk accessControl
    localStorage.setItem("isLoggedIn", "true");

    setRole(normalizedRole as Role);
    setError("");

    switch (normalizedRole) {
      case "HR":
      case "User":
      case "Head Department":
      case "Director":
        navigate("/leave");
        break;
      case "Security":
        navigate("/dashboard");
        break;
      default:
        navigate("/leave");
    }
    // alert(`Welcome, ${user.name} (${user.role})`);
  } else {
    setError("Username/Email invalid!");
  }
};


  const handleRegister = () =>{
    const {name, email, role, department} = registerData;
    if(!name || !email || !role || !department) {
      setRegisterMessage({type: "error", text: "All Field Should Be Filled"});
      return; 
    }
    setRegisterMessage({type: "success", text: "Register Successfull"});
    setRegisterData({name:"", email:"", role:"", department:""});
    setTimeout(()=>{
      setView("login");
      setRegisterMessage({type:"", text:""});
    }, 1500);
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
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
                <Button variant="outline" className="w-full" onClick={() => setView("register")}>Register</Button>
              </div>
            )}

            {view === "login" && (
              <div className="space-y-4">
                <h2 className="text-2xl font-bold text-center">Log in</h2>
                <Input
                  placeholder="Username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
                <Input
                  type="email"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
                <Button className="w-full" onClick={handleLogin}>Sign In</Button>
                {error && (
                  <p className="text-red-500 text-sm font-bold text-center mt-2">{error}</p>
                )}
                <p className="text-sm text-center text-gray-500">
                  Don’t have an account?{" "}
                  <span className="text-blue-600 cursor-pointer hover:underline" onClick={() => setView("register")}>
                    Register
                  </span>
                </p>
                <Button variant="ghost" className="w-full text-sm" onClick={() => setView("menu")}>
                  ← Back
                </Button>
              </div>
            )}

            {view === "register" && (
              <div className="space-y-4 flex w-full flex-col overflow-auto h-90 scrollbar-hide">
                <h2 className="text-2xl font-bold text-center">Register</h2>
                <Input
                  placeholder="Full Name"
                  value={registerData.name}
                  onChange={(e) => setRegisterData({ ...registerData, name: e.target.value })}
                />
                <Input
                  type="email"
                  placeholder="Email"
                  value={registerData.email}
                  onChange={(e) => setRegisterData({ ...registerData, email: e.target.value })}
                />

                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-500">Select Role</label>
                  <Select onValueChange={(val) => setRegisterData({ ...registerData, role: val })}>
                    <SelectTrigger className="w-full text-gray-500">
                      <SelectValue placeholder="Choose your role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="User">Staff</SelectItem>
                      <SelectItem value="Head Department">Head Department</SelectItem>
                      <SelectItem value="HR">HR</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-500">Select Department</label>
                  <Select onValueChange={(val) => setRegisterData({ ...registerData, department: val })}>
                    <SelectTrigger className="w-full text-gray-500">
                      <SelectValue placeholder="Choose your Department" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="IT">IT</SelectItem>
                      <SelectItem value="Produksi">Produksi</SelectItem>
                      <SelectItem value="HR">HR</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Button className="w-full" onClick={handleRegister}>
                  Sign Up
                </Button>
                            
                {registerMessage.text && (
                  <p
                    className={`text-sm text-center mt-2 ${
                      registerMessage.type === "error" ? "text-red-500" : "text-green-500"
                    }`}
                  >
                    {registerMessage.text}
                  </p>
                )}


                <p className="text-sm text-center text-gray-500">
                  Already have an account?{" "}
                  <span className="text-blue-600 cursor-pointer hover:underline" onClick={() => setView("login")}>
                    Login
                  </span>
                </p>
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
