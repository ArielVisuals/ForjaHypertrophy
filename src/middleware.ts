import { defineMiddleware } from "astro:middleware";
import { getSessionUser } from "@/lib/auth";

const PROTECTED_PREFIXES = [
  "/dashboard",
  "/workout",
  "/program",
  "/progress",
  "/nutrition",
  "/settings",
  "/coach",
  "/onboarding",
];

const matches = (pathname: string, prefixes: string[]) =>
  prefixes.some(p => pathname === p || pathname.startsWith(p + "/"));

export const onRequest = defineMiddleware(async (context, next) => {
  const { pathname } = context.url;

  // La landing redirige a la app si ya hay sesion (index.astro usa locals.user)
  if (pathname === "/") {
    await getSessionUser(context);
    return next();
  }

  // Las paginas de auth mandan al dashboard a quien ya tiene sesion
  if (pathname === "/login" || pathname === "/register") {
    const user = await getSessionUser(context);
    if (user) return context.redirect(user.role === "coach" ? "/coach" : "/dashboard");
    return next();
  }

  if (!matches(pathname, PROTECTED_PREFIXES)) return next();

  // Resuelve la sesion (renueva el access token en silencio si expiro)
  const user = await getSessionUser(context);
  if (!user) return context.redirect(`/login?next=${encodeURIComponent(pathname)}`);

  if (matches(pathname, ["/coach"]) && user.role !== "coach") {
    return context.redirect("/dashboard");
  }

  // El entrenador solo tiene interfaz de entrenador; si quiere entrenar,
  // usa una cuenta de atleta aparte.
  if (user.role === "coach" && !matches(pathname, ["/coach"])) {
    return context.redirect("/coach");
  }

  // Todo atleta debe completar la Evaluacion Inicial antes de usar la app
  if (
    user.role === "athlete" &&
    !user.onboardingCompleted &&
    !matches(pathname, ["/onboarding"])
  ) {
    return context.redirect("/onboarding");
  }

  return next();
});
