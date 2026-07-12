/// <reference path="../.astro/types.d.ts" />
/// <reference types="astro/client" />

declare namespace App {
  interface Locals {
    /** Fila de `users` del usuario autenticado — poblada por getSessionUser/middleware */
    user?: import("./lib/auth").AppUser;
  }
}
