export default defineNuxtRouteMiddleware(async () => {
  const { user, isAuthenticated, fetchUser } = useAuth();
  const { refreshSession } = useApi();

  // The access-token cookie lives 15 minutes; the refresh token lives 7 days and is
  // httpOnly, so the only way to know it exists is to try. Once per session is enough.
  const refreshTried = useState('auth_refresh_tried', () => false);

  if (!isAuthenticated.value && import.meta.client && !refreshTried.value) {
    refreshTried.value = true;

    if (await refreshSession()) {
      await fetchUser();
    }
    return;
  }

  if (isAuthenticated.value && !user.value) {
    await fetchUser();
  }
});
