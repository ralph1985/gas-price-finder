<script>
  const storageKey = "analytics-consent";
  let isVisible = false;
  let isPolicyOpen = false;

  const readConsent = () => {
    try {
      return localStorage.getItem(storageKey);
    } catch {
      return null;
    }
  };

  const writeConsent = (value) => {
    try {
      localStorage.setItem(storageKey, value);
    } catch {
      return;
    }
  };

  const accept = () => {
    writeConsent("true");
    isVisible = false;
    window.dispatchEvent(new Event("analytics-consent-granted"));
  };

  const reject = () => {
    writeConsent("false");
    isVisible = false;
  };

  const openPolicy = () => {
    isPolicyOpen = true;
  };

  const closePolicy = () => {
    isPolicyOpen = false;
  };

  if (typeof window !== "undefined") {
    const stored = readConsent();
    isVisible = stored === null;
  }
</script>

{#if isVisible}
  <div class="fixed inset-x-0 bottom-0 z-50 bg-base-100/95 shadow-lg backdrop-blur">
    <div class="mx-auto flex max-w-5xl flex-col gap-3 px-4 py-4 md:flex-row md:items-center md:justify-between">
      <div class="text-sm text-base-content/80">
        Usamos cookies analiticas para entender el uso de la app. Puedes aceptarlas o
        rechazarlas. Consulta la
        <button class="underline" type="button" on:click={openPolicy}>
          politica de cookies
        </button>.
      </div>
      <div class="flex gap-2">
        <button class="btn btn-sm btn-ghost" type="button" on:click={reject}>
          Rechazar
        </button>
        <button class="btn btn-sm btn-primary" type="button" on:click={accept}>
          Aceptar
        </button>
      </div>
    </div>
  </div>
{/if}

{#if isPolicyOpen}
  <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
    <div class="card w-full max-w-2xl border border-base-200 bg-base-100 shadow-xl">
      <div class="card-body gap-4">
        <div class="flex items-start justify-between gap-4">
          <div>
            <div class="text-lg font-semibold">Politica de cookies</div>
            <p class="text-sm text-base-content/70">Ultima actualizacion: 29/12/2025</p>
          </div>
          <button class="btn btn-ghost btn-sm" type="button" on:click={closePolicy}>
            Cerrar
          </button>
        </div>

        <div class="space-y-3 text-sm text-base-content/80">
          <p>
            En Gas Price Finder utilizamos cookies analiticas para entender el uso
            de la aplicacion y mejorar la experiencia. Puedes aceptar o rechazar
            estas cookies desde el aviso que aparece al entrar.
          </p>

          <div>
            <p class="font-semibold">Cookies analiticas</p>
            <ul class="list-disc pl-5">
              <li>Proveedor: Google Analytics (Google LLC).</li>
              <li>
                Finalidad: medir el uso de la aplicacion (busquedas por prefijo
                postal y tipo de combustible), sin almacenar datos personales directos.
              </li>
              <li>Duracion: segun configuracion de Google Analytics.</li>
            </ul>
          </div>

          <div>
            <p class="font-semibold">Como retirar el consentimiento</p>
            <p>
              Puedes borrar el almacenamiento local del navegador para restablecer la
              eleccion de cookies, o usar el modo privado del navegador.
            </p>
          </div>

        </div>
      </div>
    </div>
  </div>
{/if}
