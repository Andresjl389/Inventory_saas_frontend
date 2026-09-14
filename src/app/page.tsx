import { redirect } from "next/navigation";

/**
 * El middleware ya redirige la raiz, pero mantenemos la pagina por si alguna
 * peticion la alcanza sin pasar por el (por ejemplo en un prerender).
 */
export default function HomePage() {
  redirect("/dashboard");
}
