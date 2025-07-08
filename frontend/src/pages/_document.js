// src/pages/_document.js
import React from 'react';
import { Html, Head, Main, NextScript } from 'next/document';

export default function Document() {
  return (
    <Html lang="pt-BR">
      <Head>
        {/* Meta tags */}
        <meta charSet="utf-8" />
        <meta name="theme-color" content="#f0c14b" />
        <meta name="msapplication-TileColor" content="#f0c14b" />
        
        {/* Favicon */}
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/site.webmanifest" />
        
        {/* Fonts */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="true" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap"
          rel="stylesheet"
        />
        
        {/* PWA */}
        <meta name="application-name" content="LuminaSol" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="LuminaSol" />
        <meta name="format-detection" content="telephone=no" />
        <meta name="mobile-web-app-capable" content="yes" />
        
        {/* Social Media / SEO */}
        <meta property="og:type" content="website" />
        <meta property="og:title" content="LuminaSol - Sistema de Orçamentos Solares" />
        <meta property="og:description" content="Sistema completo para criação e gerenciamento de orçamentos de energia solar em Manaus/AM" />
        <meta property="og:site_name" content="LuminaSol" />
        <meta property="og:url" content="https://luminasol.com.br" />
        <meta property="og:image" content="/og-image.png" />
        
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="LuminaSol - Sistema de Orçamentos Solares" />
        <meta name="twitter:description" content="Sistema completo para criação e gerenciamento de orçamentos de energia solar" />
        <meta name="twitter:image" content="/og-image.png" />
      </Head>
      <body className="font-sans antialiased">
        <Main />
        <NextScript />
        
        {/* Service Worker Registration */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                navigator.serviceWorker.register('/sw.js')
                  .then((registration) => {
                    console.log('SW registered: ', registration);
                  })
                  .catch((registrationError) => {
                    console.log('SW registration failed: ', registrationError);
                  });
              }
            `,
          }}
        />
      </body>
    </Html>
  );
}
