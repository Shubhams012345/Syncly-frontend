import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate, Link } from "react-router-dom";
import { User, Mail, Lock, ArrowRight, Loader2 } from "lucide-react";

const Signup = () => {
  const { signup } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);

    const result = await signup(formData.name, formData.email, formData.password);
    setIsSubmitting(false);

    if (result.success) {
      // LocalStorage me temporary email save karlo taaki verify OTP page fetch kar sake
      localStorage.setItem("verify_email", formData.email);
      navigate("/verify-otp");
    } else {
      setError(result.message);
    }
  };

  return (
    <div className="min-h-screen bg-[#0F0F1E] bg-[radial-gradient(circle_at_top_left,rgba(139,92,246,0.15),transparent_45%)] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-[#16162a]/60 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-white tracking-tight">Get Started</h2>
          <p className="text-gray-400 mt-2 text-sm">Create your Syncly account today</p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm p-3 rounded-xl mb-6 text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <label className="text-xs font-semibold text-gray-300 uppercase tracking-wider">Full Name</label>
            <div className="relative">
              <User className="absolute left-4 top-3.5 h-5 w-5 text-gray-500" />
              <input
                type="text"
                required
                className="w-full bg-[#0F0F1E]/80 border border-white/5 rounded-xl py-3 pl-12 pr-4 text-white placeholder-gray-600 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all text-sm"
                placeholder="John Doe"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold text-gray-300 uppercase tracking-wider">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-4 top-3.5 h-5 w-5 text-gray-500" />
              <input
                type="email"
                required
                className="w-full bg-[#0F0F1E]/80 border border-white/5 rounded-xl py-3 pl-12 pr-4 text-white placeholder-gray-600 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all text-sm"
                placeholder="you@example.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold text-gray-300 uppercase tracking-wider">Password</label>
            <div className="relative">
              <Lock className="absolute left-4 top-3.5 h-5 w-5 text-gray-500" />
              <input
                type="password"
                required
                className="w-full bg-[#0F0F1E]/80 border border-white/5 rounded-xl py-3 pl-12 pr-4 text-white placeholder-gray-600 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all text-sm"
                placeholder="••••••••"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-gradient-to-r from-purple-500 to-indigo-600 text-white rounded-xl py-3.5 px-4 font-semibold text-sm shadow-lg hover:shadow-purple-500/20 hover:opacity-95 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {isSubmitting ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <>
                Create Account <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>
        </form>

        <div className="text-center mt-8 pt-6 border-t border-white/5">
          <p className="text-sm text-gray-400">
            Already have an account?{" "}
            <Link to="/login" className="text-purple-400 font-semibold hover:underline">
              Log in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Signup;