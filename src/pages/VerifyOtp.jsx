import { useState, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate, Link } from "react-router-dom";
import { KeyRound, Loader2, ArrowLeft } from "lucide-react";

const VerifyOtp = () => {
  const { verifyOtp } = useAuth();
  const navigate = useNavigate();
  const [otp, setOtp] = useState(new Array(6).fill(""));
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const inputRefs = useRef([]);

  const email = localStorage.getItem("verify_email") || "your email";

  const handleChange = (element, index) => {
    if (isNaN(element.value)) return false;

    setOtp([...otp.map((d, idx) => (idx === index ? element.value : d))]);

    if (element.value !== "" && index < 5) {
      inputRefs.current[index + 1].focus();
    }
  };

  const handleKeyDown = (e, index) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1].focus();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const finalOtp = otp.join("");
    if (finalOtp.length < 6) {
      setError("Please enter complete 6-digit OTP code");
      return;
    }

    setError("");
    setIsSubmitting(true);

    const result = await verifyOtp(email, finalOtp);
    
    //  FIX: Loader ko har haal me band karo chahe success ho ya failure
    setIsSubmitting(false);

    if (result.success) {
      localStorage.removeItem("verify_email");
      navigate("/login");
    } else {
      // 🔥 FIX: UI par error message show hoga ab
      setError(result.message || "Invalid OTP entered");
    }
  };

  return (
    <div className="min-h-screen bg-[#0F0F1E] bg-[radial-gradient(circle_at_bottom_center,rgba(59,130,246,0.12),transparent_50%)] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-[#16162a]/60 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl relative">
        
        {/*  Back Button UX */}
        <Link 
          to="/signup" 
          className="absolute left-6 top-6 text-gray-400 hover:text-white flex items-center gap-1.5 text-xs font-medium transition-all"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back to Signup
        </Link>

        <div className="text-center mb-8 mt-4">
          <div className="w-12 h-12 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <KeyRound className="h-6 w-6" />
          </div>
          <h2 className="text-3xl font-bold text-white tracking-tight">Verify Identity</h2>
          <p className="text-gray-400 mt-2 text-sm">We've sent a 6-digit verification code to <span className="text-indigo-400 block mt-0.5">{email}</span></p>
        </div>

        {/*  Rendered Error Notification */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm p-3 rounded-xl mb-6 text-center animate-pulse">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="flex justify-between gap-2">
            {otp.map((data, index) => (
              <input
                key={index}
                type="text"
                maxLength="1"
                ref={(el) => (inputRefs.current[index] = el)}
                className="w-12 h-12 bg-[#0F0F1E]/80 border border-white/5 rounded-xl text-center text-xl font-bold text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                value={data}
                onChange={(e) => handleChange(e.target, index)}
                onKeyDown={(e) => handleKeyDown(e, index)}
              />
            ))}
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-gradient-to-r from-indigo-500 to-blue-600 text-white rounded-xl py-3.5 px-4 font-semibold text-sm shadow-lg hover:shadow-indigo-500/20 hover:opacity-95 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {isSubmitting ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              "Verify Code"
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default VerifyOtp;