

// import { useState } from "react";
// import { Input } from "@/components/ui/input";
// import { Button } from "@/components/ui/button";
// import {
//   Select,
//   SelectTrigger,
//   SelectValue,
//   SelectContent,
//   SelectItem,
// } from "@/components/ui/select";


// export default function LoginPage() {
//   const [view, setView] = useState<"menu" | "login" | "register">("menu");
//   const dummyUsers = [
//   {
//     id: 1,
//     name: "Sarah Johnson",
//     email: "sarah@company.com",
//     password: "123456", // Untuk testing saja
//     role: "Department Head",
//   },
//   {
//     id: 2,
//     name: "David Wilson",
//     email: "david@company.com",
//     password: "123456",
//     role: "Staff",
//   },
//   {
//     id: 3,
//     name: "Alice Cooper",
//     email: "alice@company.com",
//     password: "123456",
//     role: "HR",
//   },
// ];


//   return (
//     <div className="min-h-screen flex items-center justify-center bg-gray-100">
//       <div className="flex w-full max-w-5xl h-[70vh] shadow-xl rounded-2xl overflow-hidden bg-white">

//         {/* Left side - Image */}
//         <div
//           className="hidden md:block w-1/2 bg-cover bg-center relative"
//           style={{ backgroundImage: "url('/alkindofoto.jpeg')"}}
//         >
//           <div className="absolute inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center text-white p-8">
//             <h2 className="text-3xl font-bold text-yellow-500">PT Alkindo Naratama</h2>
//           </div>
//         </div>


//         {/* Right side - Auth Card */}
//         <div className="w-full md:w-1/2 p-10 flex items-center justify-center">
//           <div className="w-full max-w-md space-y-6">

//             {view === "menu" && (
//               <div className="flex flex-col items-center space-y-5">
//                 <h1 className="text-3xl font-bold text-gray-800">Welcome to, <span className="text-blue-400">Gate System</span></h1>
//                 <p className="text-gray-500">Please select an option to proceed</p>
//                 <Button className="w-full" onClick={() => setView("login")}>Login</Button>
//                 <Button variant="outline" className="w-full" onClick={() => setView("register")}>Register</Button>
//               </div>
//             )}

//             {view === "login" && (
//               <div className="space-y-4">
//                 <h2 className="text-2xl font-bold text-center">Log in</h2>
//                 <Input type="email" placeholder="Email" />
//                 <Input type="username" placeholder="Username" />
//                 <Button className="w-full">Sign In</Button>
//                 <p className="text-sm text-center text-gray-500">
//                   Don’t have an account?{" "}
//                   <span
//                     className="text-blue-600 cursor-pointer hover:underline"
//                     onClick={() => setView("register")}
//                   >
//                     Register
//                   </span>
//                 </p>
//                 <Button variant="ghost" className="w-full text-sm" onClick={() => setView("menu")}>
//                   ← Back
//                 </Button>
//               </div>
//             )}
//             {view === "register" && (
//               <div className="space-y-4">
//                 <h2 className="text-2xl font-bold text-center">Register</h2>

//                 <Input type="text" placeholder="Full Name" />
//                 <Input type="email" placeholder="Email" />

//                 {/* Dropdown for Role */}
//                 <div className="space-y-1">
//                   <label className="text-sm font-medium text-gray-500">Select Role</label>
//                   <Select>
//                     <SelectTrigger className="w-full text-gray-500">
//                       <SelectValue placeholder="Choose your role" />
//                     </SelectTrigger>
//                     <SelectContent>
//                       <SelectItem value="staff">Staff</SelectItem>
//                       <SelectItem value="department-head ">Department Head</SelectItem>
//                       <SelectItem value="hr">HR</SelectItem>
//                     </SelectContent>
//                   </Select>
//                 </div>
//                 <div className="space-y-1">
//                   <label className="text-sm font-medium text-gray-500">Select Department</label>
//                   <Select>
//                     <SelectTrigger className="w-full text-gray-500">
//                       <SelectValue placeholder="Choose your Department" />
//                     </SelectTrigger>
//                     <SelectContent>
//                       <SelectItem value="it">IT</SelectItem>
//                       <SelectItem value="produksi">Produksi</SelectItem>
//                       <SelectItem value="hr">HR</SelectItem>
//                     </SelectContent>
//                   </Select>
//                 </div>

//                 <Button className="w-full">Sign Up</Button>

//                 <p className="text-sm text-center text-gray-500">
//                   Already have an account?{" "}
//                   <span
//                     className="text-blue-600 cursor-pointer hover:underline"
//                     onClick={() => setView("login")}
//                   >
//                     Login
//                   </span>
//                 </p>
//                 <Button variant="ghost" className="w-full text-sm" onClick={() => setView("menu")}>
//                   ← Back
//                 </Button>
//               </div>
//             )}
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }


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

export default function LoginPage() {
  const [view, setView] = useState("menu");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [registerData, setRegisterData] = useState({
    name: "",
    email: "",
    password: "",
    role: "",
    department: "",
  });

  const dummyUsers = [
    {
      id: 1,
      name: "Sarah Johnson",
      email: "dh@dh.com",
      password: "123456",
      role: "Department Head",
    },
    {
      id: 2,
      name: "David Wilson",
      email: "s@s.com",
      password: "123456",
      role: "Staff",
    },
    {
      id: 3,
      name: "Alice Cooper",
      email: "hr@hr.com",
      password: "123456",
      role: "HR",
    },
  ];

  const handleLogin = () => {
    const user = dummyUsers.find(
      (u) => u.email === email && u.password === password
    );

    if (user) {
      alert(`Welcome, ${user.name} (${user.role})`);
      localStorage.setItem("user", JSON.stringify(user));
    } else {
      alert("Email atau password salah.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="flex w-full max-w-5xl h-[70vh] shadow-xl rounded-2xl overflow-hidden bg-white">
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
                <Input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
                <Input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} />
                <Button className="w-full" onClick={handleLogin}>Sign In</Button>
                <p className="text-sm text-center text-gray-500">
                  Don’t have an account? <span className="text-blue-600 cursor-pointer hover:underline" onClick={() => setView("register")}>Register</span>
                </p>
                <Button variant="ghost" className="w-full text-sm" onClick={() => setView("menu")}>← Back</Button>
              </div>
            )}

            {view === "register" && (
              <div className="space-y-4">
                <h2 className="text-2xl font-bold text-center">Register</h2>
                <Input placeholder="Full Name" value={registerData.name} onChange={(e) => setRegisterData({ ...registerData, name: e.target.value })} />
                <Input type="email" placeholder="Email" value={registerData.email} onChange={(e) => setRegisterData({ ...registerData, email: e.target.value })} />
                <Input type="password" placeholder="Password" value={registerData.password} onChange={(e) => setRegisterData({ ...registerData, password: e.target.value })} />

                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-500">Select Role</label>
                  <Select onValueChange={(val) => setRegisterData({ ...registerData, role: val })}>
                    <SelectTrigger className="w-full text-gray-500">
                      <SelectValue placeholder="Choose your role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Staff">Staff</SelectItem>
                      <SelectItem value="Department Head">Department Head</SelectItem>
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

                <Button className="w-full" onClick={() => alert("Registered successfully (simulasi)")}>Sign Up</Button>
                <p className="text-sm text-center text-gray-500">
                  Already have an account? <span className="text-blue-600 cursor-pointer hover:underline" onClick={() => setView("login")}>Login</span>
                </p>
                <Button variant="ghost" className="w-full text-sm" onClick={() => setView("menu")}>← Back</Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
