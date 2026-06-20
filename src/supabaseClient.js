const SUPABASE_URL = "https://iryhhkggymluqldjfghq.supabase.co";
const SUPABASE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlyeWhoa2dneW1sdXFsZGpmZ2hxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODEzNTk1NzIsImV4cCI6MjA5NjkzNTU3Mn0.dBUhRpTxW4Vqh1SIBlYCL78IKsMnkf4F2Bw06aYVkJc";

export const supabase = (function () {
  if (
    window.supabase &&
    typeof window.supabase.createClient === "function"
  ) {
    try {
      return window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY, {
        auth: {
          storage: window.sessionStorage,
          autoRefreshToken: true,
          persistSession: true,
        },
      });
    } catch (e) {
      console.error("Erro ao inicializar o Supabase:", e);
    }
  }
  return null;
})();
