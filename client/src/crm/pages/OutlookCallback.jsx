import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Loader2, CheckCircle2, AlertCircle, ArrowLeft } from 'lucide-react';
import api from '../services/api';
import { useToast } from '../context/ToastContext';

export const OutlookCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { showSuccess, showError } = useToast();

  const [loading, setLoading] = useState(true);
  const [statusMessage, setStatusMessage] = useState('Exchanging Microsoft authorization code...');
  const [errorDetails, setErrorDetails] = useState(null);

  const hasExecutedRef = useRef(false);

  useEffect(() => {
    const handleCallback = async () => {
      const code = searchParams.get('code');
      const errorParam = searchParams.get('error');
      const errorDescription = searchParams.get('error_description');

      if (errorParam || errorDescription) {
        setLoading(false);
        const errorMsg = errorDescription || errorParam || 'Microsoft authentication was canceled or failed';
        setErrorDetails(errorMsg);
        showError(errorMsg);
        return;
      }

      if (!code) {
        setLoading(false);
        const errorMsg = 'No authorization code received from Microsoft';
        setErrorDetails(errorMsg);
        showError(errorMsg);
        return;
      }

      // Prevent duplicate code exchange caused by React Strict Mode or re-renders
      if (hasExecutedRef.current || sessionStorage.getItem('last_oauth_code') === code) {
        return;
      }
      hasExecutedRef.current = true;
      sessionStorage.setItem('last_oauth_code', code);

      try {
        let storedConfig = {};
        try {
          const storedStr = sessionStorage.getItem('outlook_auth_config');
          if (storedStr) storedConfig = JSON.parse(storedStr);
        } catch (e) {}

        const redirectUri = window.location.origin + '/auth/outlook/callback';
        const res = await api.post('/outlook/callback', {
          code,
          redirectUri,
          clientId: storedConfig.clientId,
          clientSecret: storedConfig.clientSecret,
          tenantId: storedConfig.tenantId
        });

        if (res.data?.success) {
          setLoading(false);
          const successMsg = res.data.message || 'Microsoft Outlook connected successfully!';
          setStatusMessage(successMsg);
          showSuccess(successMsg);

          // Clean up stored config
          sessionStorage.removeItem('outlook_auth_config');

          // Redirect to settings after 1.5 seconds
          setTimeout(() => {
            navigate('/settings');
          }, 1500);
        } else {
          setLoading(false);
          const failMsg = res.data?.message || 'Failed to exchange Microsoft authorization code';
          setErrorDetails(failMsg);
          showError(failMsg);
        }
      } catch (err) {
        setLoading(false);
        const errMsg = err.response?.data?.message || err.message || 'Error completing Microsoft OAuth authentication';
        setErrorDetails(errMsg);
        showError(errMsg);
      }
    };

    handleCallback();
  }, [searchParams, navigate, showSuccess, showError]);

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-3xl p-8 shadow-2xl text-center space-y-6 animate-in fade-in duration-300">
        <div className="flex justify-center">
          <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center shadow-inner">
            {loading ? (
              <Loader2 className="w-8 h-8 animate-spin" />
            ) : errorDetails ? (
              <AlertCircle className="w-8 h-8 text-rose-600" />
            ) : (
              <CheckCircle2 className="w-8 h-8 text-emerald-600" />
            )}
          </div>
        </div>

        <div className="space-y-2">
          <h2 className="text-xl font-black text-slate-900">
            {loading ? 'Connecting Microsoft Outlook' : errorDetails ? 'Authorization Failed' : 'Outlook Connected!'}
          </h2>
          <p className="text-sm font-medium text-slate-600">
            {loading ? statusMessage : errorDetails ? errorDetails : statusMessage}
          </p>
        </div>

        {!loading && (
          <button
            onClick={() => navigate('/settings')}
            className="w-full py-3 bg-crm-navy hover:bg-slate-800 text-white font-extrabold rounded-2xl transition-all flex items-center justify-center gap-2 shadow-md"
          >
            <ArrowLeft className="w-4 h-4" />
            Return to CRM Settings
          </button>
        )}
      </div>
    </div>
  );
};
