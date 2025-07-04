'use client';

import { AuthenticationResult } from '@azure/msal-browser';
import { useMsal } from '@azure/msal-react';
import { getCookie, setCookie } from '@core';
import { CustomLoader } from '@ui/molecules/loader';
import { jwtDecode } from 'jwt-decode';
import { redirect, useSearchParams } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { loginRequest } from './config/authConfig';

const AuthIndex = () => {
  const { instance, inProgress } = useMsal();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(true);

  const token = getCookie('token');

  const effectRan = useRef(false);

  async function handleResponse(response: AuthenticationResult) {
    try {
      const decodedToken = jwtDecode(response.accessToken);
      const expirationDate = new Date();
      expirationDate.setTime(expirationDate.getTime() + 45 * 60 * 1000);
      await setCookie('token', JSON.stringify(decodedToken), { expires: expirationDate });
    } catch (error) {
      console.error('Error setting cookie expiration:', error);
    }
  }

  useEffect(() => {
    if (typeof window === 'undefined') return;
    sessionStorage.setItem('url', searchParams.get('url') || '');
    if (token) {
      const url = sessionStorage.getItem('url');
      redirect(url || '/en-au');
    }
    if (inProgress === 'none') {
      instance
        .handleRedirectPromise()
        .then(async (response) => {
          if (response) {
            await handleResponse(response);
            return response;
          }
          if (!token && effectRan.current) {
            setIsLoading(true);
            return instance.loginRedirect(loginRequest);
          }
          setIsLoading(false);
          return null;
        })
        .catch((error) => {
          setIsLoading(false);
          console.error(error instanceof Error ? error.message : 'Redirect promise error:', error);
        });
    } else if (inProgress === 'login') {
      setIsLoading(true);
    } else {
      setIsLoading(false);
    }

    if (!effectRan.current) {
      effectRan.current = true;
    }
  }, [inProgress, instance, token, searchParams]);

  return (
    <div className="h-screen flex items-center justify-center p-4 bg-gradient-to-br from-indigo-50 via-white to-cyan-50 relative overflow-hidden">
      <div className="absolute inset-0 opacity-30">
        <div className="absolute top-1/4 left-1/4 size-72 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 size-96 bg-gradient-to-r from-pink-400 to-yellow-500 rounded-full blur-3xl animate-pulse delay-1000" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 size-64 bg-gradient-to-r from-green-400 to-blue-500 rounded-full blur-3xl animate-pulse delay-500" />
      </div>

      {isLoading && (
        <>
          <CustomLoader className="backdrop-blur-md bg-white/20 fixed inset-0 z-0" size="large" />
          <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-2xl border border-white/20 p-10 max-w-md w-full flex flex-col items-center justify-center relative z-10 transition-all duration-500 hover:scale-105">
            <div className="mb-8 relative">
              <div className="size-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg rotate-12 hover:rotate-0 transition-transform duration-300">
                <svg className="size-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                  />
                </svg>
              </div>
              <div className="absolute -top-2 -right-2 size-6 bg-green-500 rounded-full animate-ping" />
              <div className="absolute -top-2 -right-2 size-6 bg-green-500 rounded-full" />
            </div>
            <div className="text-center mb-8">
              <h1 className="mb-4 text-3xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
                Securing Your Access
              </h1>
              <p className="text-lg text-gray-600 leading-relaxed">
                Please wait while we authenticate your credentials and redirect to your application.
              </p>
            </div>
            <div className="w-full max-w-xs">
              <div className="flex justify-between mb-4">
                <span className="text-sm font-medium text-gray-500">Verifying...</span>
                <span className="text-sm font-medium text-blue-600">85%</span>
              </div>

              <div className="w-full bg-gray-200 rounded-full h-2 mb-6 overflow-hidden">
                <div className="h-full bg-gradient-to-r from-blue-500 to-purple-600 rounded-full animate-pulse relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer" />
                </div>
              </div>
              <div className="flex justify-center space-x-2">
                <div className="size-3 bg-blue-500 rounded-full animate-bounce" />
                <div className="size-3 bg-blue-500 rounded-full animate-bounce delay-100" />
                <div className="size-3 bg-blue-500 rounded-full animate-bounce delay-200" />
              </div>
            </div>
            <div className="flex items-center justify-center space-x-4 mt-8 pt-6 border-t border-gray-200/50">
              <div className="flex items-center space-x-2 text-green-600">
                <svg className="size-4" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    clipRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    fillRule="evenodd"
                  />
                </svg>
                <span className="text-xs font-medium">SSL Secured</span>
              </div>
            </div>
          </div>
          <div className="absolute top-10 left-10 size-4 bg-blue-400 rounded-full animate-ping opacity-75" />
          <div className="absolute bottom-10 right-10 size-6 bg-purple-400 rounded-full animate-pulse opacity-75" />
          <div className="absolute top-1/3 right-10 size-3 bg-pink-400 rounded-full animate-bounce opacity-75" />
        </>
      )}
    </div>
  );
};

export default AuthIndex;
