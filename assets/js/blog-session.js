/* Shared logout for the publisher and review workspace. */
(() => {
  'use strict';
  window.PolyBlogSession = Object.freeze({
    async signOut(config, session) {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 10000);
      try {
        if (!session?.access_token) return;
        const response = await fetch(`${config.supabaseUrl}/auth/v1/logout?scope=local`, {
          method: 'POST',
          headers: { apikey: config.publishableKey, Authorization: `Bearer ${session.access_token}` },
          signal: controller.signal
        });
        if (!response.ok) throw new Error('Signed out on this page, but server logout could not be confirmed. Please sign in again and retry logout.');
      } catch (error) {
        throw new Error('Signed out on this page, but server logout could not be confirmed. Please sign in again and retry logout.');
      } finally {
        clearTimeout(timer);
        sessionStorage.removeItem('poly_blog_admin_session');
      }
    }
  });
})();
