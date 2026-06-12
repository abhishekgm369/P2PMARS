import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext.jsx';
import AuthLayout from '../layouts/AuthLayout.jsx';
import Input from '../components/Input.jsx';
import Button from '../components/Button.jsx';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error('Please fill in all fields');
      return;
    }
    
    setLoading(true);
    try {
      await login(email, password);
      toast.success('Successfully logged in!');
      navigate('/dashboard');
    } catch (err) {
      const msg = err.response?.data?.message || 'Login failed. Please check your credentials.';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout 
      title="Welcome back" 
      subtitle="Enter your credentials to access your secure transfer room."
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input 
          label="Email Address" 
          type="email" 
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <Input 
          label="Password" 
          type="password" 
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        
        <div className="pt-2">
          <Button type="submit" className="w-full !py-3" loading={loading}>
            Sign In
          </Button>
        </div>
      </form>
      
      <p className="mt-8 text-center text-sm text-[#60666D]">
        Don't have an account?{' '}
        <Link to="/register" className="font-bold text-[#2E5A44] hover:text-[#224433] transition">
          Sign up
        </Link>
      </p>
    </AuthLayout>
  );
};

export default Login;
