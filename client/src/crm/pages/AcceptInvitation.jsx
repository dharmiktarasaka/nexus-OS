import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Lock, CheckCircle2, User, Building, AlertCircle, Eye, EyeOff } from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export const AcceptInvitation = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const { login } = useAuth();
  const { showSuccess, showError } = useToast();

  const [invitationInfo, setInvitationInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);


  useEffect(() => {
    const fetchInfo = async () => {
      setLoading(true);
      try {
        const res = await api.get(`/auth/invitation/${token}`);
        if (res.data?.success) {
          setInvitationInfo(res.data.invitation);
        }
      } catch (err) {
        showError(err.response?.data?.message || 'Invalid or expired invitation link');
      } finally {
        setLoading(false);
      }
    };
    if (token) fetchInfo();
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!password || password.length < 6) {
      showError('Password must be at least 6 characters');
      return;
    }
    if (password !== confirmPassword) {
      showError('Passwords do not match');
      return;
    }

    setSubmitting(true);
    try {
      const res = await api.post('/auth/accept-invitation', { token, password });
      if (res.data?.success) {
        showSuccess('Account setup complete! Welcome to the CRM.');
        if (res.data.token) {
          localStorage.setItem('crm_token', res.data.token);
          window.location.href = '/';
        } else {
          navigate('/login');
        }
      }
    } catch (err) {
      showError(err.response?.data?.message || 'Failed to accept invitation');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-crm-navy flex items-center justify-center">
        <div className="w-8 h-8 border-3 border-crm-lime border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!invitationInfo) {
    return (
      <div className="min-h-screen bg-crm-navy flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-3xl max-w-md w-full text-center space-y-4 shadow-2xl">
          <AlertCircle className="w-12 h-12 text-rose-500 mx-auto" />
          <h2 className="text-lg font-extrabold text-crm-navy">Invalid Invitation Link</h2>
          <p className="text-xs text-slate-500">This invitation link has expired or has already been accepted.</p>
          <button
            onClick={() => navigate('/login')}
            className="w-full py-2.5 bg-crm-navy text-white text-xs font-bold rounded-xl hover:bg-slate-800"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-crm-navy flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-3xl max-w-md w-full shadow-2xl space-y-6">
        <div className="text-center space-y-1">
          <div className="w-12 h-12 rounded-2xl bg-crm-lime/20 text-crm-navy font-black text-xl flex items-center justify-center mx-auto mb-2">
            LF
          </div>
          <h2 className="text-xl font-extrabold text-crm-navy">Join {invitationInfo.companyName}</h2>
          <p className="text-xs text-slate-500">Complete your profile to access your CRM account</p>
        </div>

        <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl space-y-1 text-xs">
          <p className="font-bold text-crm-navy">{invitationInfo.name}</p>
          <p className="text-slate-500">{invitationInfo.email}</p>
          <span className="inline-block px-2 py-0.5 rounded text-[10px] font-black uppercase bg-crm-lime text-crm-navy mt-1">
            Role: {invitationInfo.role}
          </span>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-crm-navy mb-1">Create Password *</label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 6 characters..."
                className="w-full pl-10 pr-10 py-2 text-xs rounded-xl border border-slate-200 focus:ring-2 focus:ring-crm-navy/20 focus:border-crm-navy"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none"
                title={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-crm-navy mb-1">Confirm Password *</label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                required
                minLength={6}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter password..."
                className="w-full pl-10 pr-10 py-2 text-xs rounded-xl border border-slate-200 focus:ring-2 focus:ring-crm-navy/20 focus:border-crm-navy"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none"
                title={showConfirmPassword ? 'Hide password' : 'Show password'}
              >
                {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3 bg-crm-lime text-crm-navy font-extrabold text-xs rounded-xl shadow-lg hover:bg-crm-lime-hover transition-all disabled:opacity-50"
          >
            {submitting ? 'Setting up Account...' : 'Complete Account Setup'}
          </button>
        </form>
      </div>
    </div>
  );
};
