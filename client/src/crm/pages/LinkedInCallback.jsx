import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Loader2, CheckCircle2, AlertCircle, ArrowLeft, ExternalLink, ShieldAlert, Sparkles } from 'lucide-react';
import api from '../services/api';
import { useToast } from '../context/ToastContext';

export const LinkedInCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { showSuccess, showError } = useToast();

  const [loading, setLoading] = useState(true);
  const [statusMessage, setStatusMessage] = useState('Exchanging LinkedIn authorization code...');
  const [errorDetails, setErrorDetails] = useState(null);
  const [errorCode, setErrorCode] = useState(null);

  const hasExecutedRef = useRef(false);

  // Helper to decode HTML entities like &quot;
  const decodeHtml = (html) => {
    const txt = document.createElement('textarea');
    txt.innerHTML = html;
    return txt.value;
  };

  useEffect(() => {
    const handleCallback = async () => {
      const code = searchParams.get('code');
      const errorParam = searchParams.get('error');
      const errorDescription = searchParams.get('error_description');

      if (errorParam || errorDescription) {
        setLoading(false);
        const rawMsg = errorDescription || errorParam || 'LinkedIn authentication was canceled or failed';
        const cleanMsg = decodeHtml(rawMsg);
        setErrorCode(errorParam || 'auth_error');
        setErrorDetails(cleanMsg);
        showError(cleanMsg);
        return;
      }

      if (!code) {
        setLoading(false);
        const errorMsg = 'No authorization code received from LinkedIn';
        setErrorDetails(errorMsg);
        showError(errorMsg);
        return;
      }

      if (hasExecutedRef.current || sessionStorage.getItem('last_linkedin_oauth_code') === code) {
        return;
      }
      hasExecutedRef.current = true;
      sessionStorage.setItem('last_linkedin_oauth_code', code);

      try {
        let storedConfig = {};
        try {
          const storedStr = sessionStorage.getItem('linkedin_auth_config');
          if (storedStr) storedConfig = JSON.parse(storedStr);
        } catch (e) {}

        const redirectUri = window.location.origin + '/auth/linkedin/callback';
        const res = await api.post('/linkedin/callback', {
          code,
          redirectUri,
          clientId: storedConfig.clientId,
          clientSecret: storedConfig.clientSecret
        });

        if (res.data?.success) {
          setLoading(false);
          const successMsg = res.data.message || 'LinkedIn connected successfully!';
          setStatusMessage(successMsg);
          showSuccess(successMsg);

          sessionStorage.removeItem('linkedin_auth_config');

          setTimeout(() => {
            navigate('/linkedin');
          }, 1500);
        } else {
          setLoading(false);
          const failMsg = res.data?.message || 'Failed to exchange LinkedIn authorization code';
          setErrorDetails(failMsg);
          showError(failMsg);
        }
      } catch (err) {
        setLoading(false);
        const errMsg = err.response?.data?.message || err.message || 'Error completing LinkedIn OAuth authentication';
        setErrorDetails(errMsg);
        showError(errMsg);
      }
    };

    handleCallback();
  }, [searchParams, navigate, showSuccess, showError]);

  const isScopeError = errorCode === 'unauthorized_scope_error' || (errorDetails && errorDetails.includes('openid'));

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="max-w-lg w-full bg-white rounded-3xl p-8 shadow-2xl space-y-6 animate-in fade-in duration-300">
        <div className="flex justify-center">
          <div className="w-16 h-16 bg-[#0077b5]/10 text-[#0077b5] rounded-2xl flex items-center justify-center shadow-inner">
            {loading ? (
              <Loader2 className="w-8 h-8 animate-spin" />
            ) : errorDetails ? (
              <AlertCircle className="w-8 h-8 text-rose-600" />
            ) : (
              <CheckCircle2 className="w-8 h-8 text-emerald-600" />
            )}
          </div>
        </div>

        <div className="text-center space-y-2">
          <h2 className="text-xl font-black text-slate-900">
            {loading ? 'Connecting LinkedIn Account' : errorDetails ? 'Authorization Failed' : 'LinkedIn Connected!'}
          </h2>
          <p className="text-sm font-semibold text-slate-600">
            {loading ? statusMessage : errorDetails ? errorDetails : statusMessage}
          </p>
        </div>

        {/* Scope error fix guide */}
        {isScopeError && (
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl space-y-3 text-xs text-amber-900">
            <div className="flex items-center gap-2 font-black text-amber-950">
              <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" />
              <span>How to fix "Scope not authorized" in 10 seconds:</span>
            </div>
            <ol className="space-y-2 list-decimal list-inside text-amber-800 font-medium">
              <li>
                Open <a href="https://www.linkedin.com/developers/apps" target="_blank" rel="noreferrer" className="text-[#0077b5] font-bold underline inline-flex items-center gap-0.5">LinkedIn Developer Portal <ExternalLink className="w-3 h-3" /></a> &rarr; Select your app.
              </li>
              <li>
                Click on the <strong>Products</strong> tab &rarr; Find <strong>"Sign In with LinkedIn using OpenID Connect"</strong> and click <strong>"Request Access"</strong> (or add product).
              </li>
              <li>
                Alternatively, on the LinkedIn Hub page, choose <strong>Classic v2 Scope (`r_liteprofile r_emailaddress`)</strong> and click Connect.
              </li>
            </ol>
          </div>
        )}

        {!loading && (
          <div className="pt-2">
            <button
              onClick={() => navigate('/linkedin')}
              className="w-full py-3 bg-[#0077b5] hover:bg-[#006097] text-white font-extrabold rounded-2xl transition-all flex items-center justify-center gap-2 shadow-md shadow-[#0077b5]/20"
            >
              <ArrowLeft className="w-4 h-4" />
              Return to LinkedIn Hub
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default LinkedInCallback;
