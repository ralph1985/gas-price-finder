<script>
  const storageKey = "analytics-consent";
  let isVisible = false;

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
        rechazarlas.
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
