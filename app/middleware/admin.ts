export default defineNuxtRouteMiddleware(() => {
  const { isAuthenticated, role } = useAuth();

  if (!isAuthenticated.value) {
    return navigateTo('/login');
  }

  if (role.value !== 'ADMIN') {
    return navigateTo('/');
  }
});
