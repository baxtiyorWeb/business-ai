import React from "react";
import { Sparkles } from "lucide-react";

const AuthLayout = ({ children }: React.PropsWithChildren) => {
  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-[#09090b] text-slate-100 p-10">
      <div className="w-full max-w-[400px] space-y-8">
       

        {children}
      </div>
    </div>
  );
};

export default AuthLayout;