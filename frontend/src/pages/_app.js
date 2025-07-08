// src/pages/_app.js
import React from 'react';
import Head from 'next/head';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from '@/contexts/AuthContext';
import '@/styles/globals.css';

export default function App({ Component, pageProps }) {
  // Get the layout from the page component
  const getLayout = Component.getLayout || ((page) => page);

  return (
    <>
      <Head>
        <title>LuminaSol - Sistema de Orçamentos Solares</title>
        <meta name="description" content="Sistema completo para criação e gerenciamento de orçamentos de energia solar" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <AuthProvider>
        {getLayout(<Component {...pageProps} />)}
        
        {/* Toast notifications */}
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#fff',
              color: '#374151',
              boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
              border: '1px solid #e5e7eb',
              borderRadius: '0.5rem',
              padding: '12px 16px',
            },
            success: {
              iconTheme: {
                primary: '#10b981',
                secondary: '#fff',
              },
            },
            error: {
              iconTheme: {
                primary: '#ef4444',
                secondary: '#fff',
              },
            },
          }}
        />
      </AuthProvider>
    </>
  );
}
