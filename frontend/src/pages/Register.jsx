import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext.jsx';
import AuthLayout from '../layouts/AuthLayout.jsx';
import Input from '../components/Input.jsx';
import Button from '../components/Button.jsx';

const Register = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!email || !password || !confirmPassword) {
      toast.error('Please fill in all fields');
      return;
    }
    
    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    
    setLoading(true);
    try {
      await register(email, password, 'user');
      toast.success('Registration successful! You can now log in.');
      navigate('/login');
    } catch (err) {
      const msg = err.response?.data?.message || 'Registration failed.';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout 
      title="Create an account" 
      subtitle="Join DropSpace to start sharing files instantly."
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
        <Input 
          label="Confirm Password" 
          type="password" 
          placeholder="••••••••"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
        />
        
        <div className="pt-2">
          <Button type="submit" className="w-full !py-3" loading={loading}>
            Create Account
          </Button>
        </div>
      </form>
      
      <p className="mt-8 text-center text-sm text-[#60666D]">
        Already have an account?{' '}
        <Link to="/login" className="font-bold text-[#2E5A44] hover:text-[#224433] transition">
          Sign in
        </Link>
      </p>
    </AuthLayout>
  );
};

export default Register;
