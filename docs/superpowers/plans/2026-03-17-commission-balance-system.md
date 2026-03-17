# Commission Balance System — Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement a commission tracking system that charges providers 10% on cash/transfer payments and blocks them from operating when they accumulate $15,000 ARS or 2 unpaid services.

**Architecture:** New `commission_balance` table tracks per-provider debt. When a cash/transfer payment completes, a DB trigger calculates 10% commission and adds it to the provider's balance. A `commission_payments` table tracks when providers pay off their debt. Frontend hooks check balance before allowing budget/accept actions, and a payment UI in the provider dashboard enables clearing debt via MercadoPago.

**Tech Stack:** Supabase (PostgreSQL triggers, RLS), React hooks, MercadoPago checkout for commission payments.

---

## File Structure

### New Files
| File | Responsibility |
|------|---------------|
| `supabase/migrations/20260317_commission_balance_system.sql` | Tables, triggers, RLS, functions |
| `src/hooks/useCommissionBalance.ts` | Hook to fetch provider's commission balance + blocked status |
| `src/components/provider/CommissionBanner.tsx` | Warning/blocked banner shown to provider |
| `src/components/provider/CommissionPaymentDialog.tsx` | Dialog to pay pending commissions |

### Modified Files
| File | Changes |
|------|---------|
| `src/pages/client/Dashboard.tsx` | After cash/transfer payment, record commission |
| `src/pages/provider/Services.tsx` | Check blocked status before send budget/accept |
| `src/pages/provider/ServiceDetail.tsx` | Check blocked status before send budget |
| `src/pages/provider/Finance.tsx` | Show commission balance section |
| `src/hooks/useServiceRequests.ts` | Export commission check in provider requests |
| `src/integrations/supabase/types.ts` | Add commission_balance + commission_payments types |
| `src/pages/admin/Dashboard.tsx` | Show pending commissions KPI |
| `src/pages/admin/Reports.tsx` | Commission payments section |

---

## Chunk 1: Database Schema + Triggers

### Task 1: Create SQL Migration

**Files:**
- Create: `supabase/migrations/20260317_commission_balance_system.sql`

- [ ] **Step 1: Create the migration file with tables**

```sql
-- ============================================
-- Commission Balance System
-- ============================================

-- 1. Commission balance per provider (running totals)
CREATE TABLE IF NOT EXISTS public.commission_balance (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  provider_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  total_owed numeric NOT NULL DEFAULT 0,
  total_paid numeric NOT NULL DEFAULT 0,
  unpaid_services_count int NOT NULL DEFAULT 0,
  is_blocked boolean NOT NULL DEFAULT false,
  last_payment_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(provider_id)
);

-- 2. Individual commission entries (one per cash/transfer service)
CREATE TABLE IF NOT EXISTS public.commission_entries (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  provider_id uuid NOT NULL REFERENCES auth.users(id),
  service_request_id uuid NOT NULL REFERENCES public.service_requests(id),
  payment_id uuid REFERENCES public.payments(id),
  service_amount numeric NOT NULL,
  commission_rate numeric NOT NULL DEFAULT 10,
  commission_amount numeric NOT NULL,
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'paid', 'waived')),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(service_request_id)
);

-- 3. Commission payments (when provider pays off debt)
CREATE TABLE IF NOT EXISTS public.commission_payments (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  provider_id uuid NOT NULL REFERENCES auth.users(id),
  amount numeric NOT NULL CHECK (amount > 0),
  payment_method text NOT NULL CHECK (payment_method IN ('mercadopago', 'transferencia')),
  mp_payment_id text,
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'completed', 'failed')),
  notes text,
  confirmed_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  confirmed_at timestamptz
);

-- 4. RLS Policies
ALTER TABLE public.commission_balance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.commission_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.commission_payments ENABLE ROW LEVEL SECURITY;

-- Provider can view own balance
CREATE POLICY "Provider reads own balance"
  ON public.commission_balance FOR SELECT
  TO authenticated
  USING (provider_id = auth.uid());

-- Admin can view all balances
CREATE POLICY "Admin reads all balances"
  ON public.commission_balance FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Provider can view own entries
CREATE POLICY "Provider reads own entries"
  ON public.commission_entries FOR SELECT
  TO authenticated
  USING (provider_id = auth.uid());

-- Admin can view all entries
CREATE POLICY "Admin reads all entries"
  ON public.commission_entries FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Provider can view own payments
CREATE POLICY "Provider reads own payments"
  ON public.commission_payments FOR SELECT
  TO authenticated
  USING (provider_id = auth.uid());

-- Provider can insert payment (to pay off debt)
CREATE POLICY "Provider inserts own payment"
  ON public.commission_payments FOR INSERT
  TO authenticated
  WITH CHECK (provider_id = auth.uid());

-- Admin can view + update all payments
CREATE POLICY "Admin manages all payments"
  ON public.commission_payments FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Service role can manage all tables (for triggers/edge functions)
CREATE POLICY "Service role manages balance"
  ON public.commission_balance FOR ALL
  TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Service role manages entries"
  ON public.commission_entries FOR ALL
  TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Service role manages payments"
  ON public.commission_payments FOR ALL
  TO service_role USING (true) WITH CHECK (true);


-- 5. Function: Record commission after cash/transfer payment
CREATE OR REPLACE FUNCTION public.record_commission_for_payment()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_rate numeric;
  v_commission numeric;
  v_total_owed numeric;
  v_unpaid_count int;
BEGIN
  -- Only trigger on cash/transfer completed payments
  IF NEW.status != 'completed' THEN RETURN NEW; END IF;
  IF NEW.payment_method NOT IN ('efectivo', 'transferencia') THEN RETURN NEW; END IF;
  IF NEW.provider_id IS NULL THEN RETURN NEW; END IF;

  -- Get commission rate from platform_settings
  SELECT COALESCE(value::numeric, 10) INTO v_rate
  FROM platform_settings WHERE key = 'commission_rate';
  IF v_rate IS NULL THEN v_rate := 10; END IF;

  -- Calculate commission
  v_commission := ROUND(NEW.amount * (v_rate / 100), 2);
  IF v_commission <= 0 THEN RETURN NEW; END IF;

  -- Insert commission entry (ignore if already exists for this service)
  INSERT INTO commission_entries (provider_id, service_request_id, payment_id, service_amount, commission_rate, commission_amount)
  VALUES (NEW.provider_id, NEW.service_request_id, NEW.id, NEW.amount, v_rate, v_commission)
  ON CONFLICT (service_request_id) DO NOTHING;

  -- Upsert commission balance
  INSERT INTO commission_balance (provider_id, total_owed, unpaid_services_count, is_blocked)
  VALUES (NEW.provider_id, v_commission, 1, false)
  ON CONFLICT (provider_id) DO UPDATE SET
    total_owed = commission_balance.total_owed + v_commission,
    unpaid_services_count = commission_balance.unpaid_services_count + 1,
    updated_at = now();

  -- Check if provider should be blocked: >= $15,000 OR >= 2 unpaid services
  SELECT total_owed, unpaid_services_count
  INTO v_total_owed, v_unpaid_count
  FROM commission_balance WHERE provider_id = NEW.provider_id;

  IF v_total_owed >= 15000 OR v_unpaid_count >= 2 THEN
    UPDATE commission_balance
    SET is_blocked = true, updated_at = now()
    WHERE provider_id = NEW.provider_id;
  END IF;

  -- Also update the payment record with the actual commission
  UPDATE payments SET
    platform_fee = v_commission,
    commission_rate = v_rate,
    provider_amount = NEW.amount - v_commission
  WHERE id = NEW.id;

  RETURN NEW;
END;
$$;

-- 6. Trigger: fires after payment insert/update
CREATE TRIGGER trg_record_commission
  AFTER INSERT OR UPDATE OF status ON public.payments
  FOR EACH ROW
  EXECUTE FUNCTION public.record_commission_for_payment();


-- 7. Function: Process commission payment (when provider pays debt)
CREATE OR REPLACE FUNCTION public.process_commission_payment(
  p_payment_id uuid
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_provider_id uuid;
  v_amount numeric;
BEGIN
  -- Get payment details
  SELECT provider_id, amount INTO v_provider_id, v_amount
  FROM commission_payments
  WHERE id = p_payment_id AND status = 'completed';

  IF NOT FOUND THEN RETURN false; END IF;

  -- Update balance
  UPDATE commission_balance SET
    total_paid = total_paid + v_amount,
    total_owed = GREATEST(total_owed - v_amount, 0),
    unpaid_services_count = 0,
    is_blocked = false,
    last_payment_at = now(),
    updated_at = now()
  WHERE provider_id = v_provider_id;

  -- Mark all pending entries as paid
  UPDATE commission_entries SET status = 'paid'
  WHERE provider_id = v_provider_id AND status = 'pending';

  RETURN true;
END;
$$;

GRANT EXECUTE ON FUNCTION public.process_commission_payment TO service_role;
GRANT EXECUTE ON FUNCTION public.process_commission_payment TO authenticated;
```

- [ ] **Step 2: Apply migration to Supabase**

Run via Supabase MCP `apply_migration` tool.

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations/20260317_commission_balance_system.sql
git commit -m "feat(db): add commission balance tables, triggers, and RLS"
```

---

## Chunk 2: Frontend Hook + Types

### Task 2: Add TypeScript Types

**Files:**
- Modify: `src/integrations/supabase/types.ts`

- [ ] **Step 1: Add commission types to Database interface**

Add to the `Tables` section:

```typescript
commission_balance: {
  Row: {
    id: string;
    provider_id: string;
    total_owed: number;
    total_paid: number;
    unpaid_services_count: number;
    is_blocked: boolean;
    last_payment_at: string | null;
    created_at: string;
    updated_at: string;
  };
  Insert: { provider_id: string; };
  Update: Partial<{ total_owed: number; total_paid: number; unpaid_services_count: number; is_blocked: boolean; }>;
};
commission_entries: {
  Row: {
    id: string;
    provider_id: string;
    service_request_id: string;
    payment_id: string | null;
    service_amount: number;
    commission_rate: number;
    commission_amount: number;
    status: string;
    created_at: string;
  };
  Insert: { provider_id: string; service_request_id: string; service_amount: number; commission_amount: number; };
  Update: Partial<{ status: string; }>;
};
commission_payments: {
  Row: {
    id: string;
    provider_id: string;
    amount: number;
    payment_method: string;
    mp_payment_id: string | null;
    status: string;
    notes: string | null;
    confirmed_by: string | null;
    created_at: string;
    confirmed_at: string | null;
  };
  Insert: { provider_id: string; amount: number; payment_method: string; };
  Update: Partial<{ status: string; confirmed_by: string; confirmed_at: string; notes: string; }>;
};
```

- [ ] **Step 2: Commit**

### Task 3: Create useCommissionBalance Hook

**Files:**
- Create: `src/hooks/useCommissionBalance.ts`

- [ ] **Step 1: Write the hook**

```typescript
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export const useCommissionBalance = () => {
  const { user } = useAuth();

  const { data: balance, isLoading } = useQuery({
    queryKey: ["commission-balance", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("commission_balance")
        .select("*")
        .eq("provider_id", user!.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const { data: entries } = useQuery({
    queryKey: ["commission-entries", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("commission_entries")
        .select("*, service_requests(title)")
        .eq("provider_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const isBlocked = balance?.is_blocked ?? false;
  const totalOwed = balance?.total_owed ?? 0;
  const unpaidCount = balance?.unpaid_services_count ?? 0;

  return {
    balance,
    entries,
    isLoading,
    isBlocked,
    totalOwed,
    unpaidCount,
  };
};

export const usePayCommission = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ amount, paymentMethod }: { amount: number; paymentMethod: string }) => {
      if (!user) throw new Error("No autenticado");

      const { data, error } = await supabase
        .from("commission_payments")
        .insert({
          provider_id: user.id,
          amount,
          payment_method: paymentMethod,
          status: "pending",
        } as any)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["commission-balance"] });
      queryClient.invalidateQueries({ queryKey: ["commission-entries"] });
    },
    onError: (error: any) => {
      toast.error("Error al procesar pago: " + error.message);
    },
  });
};
```

- [ ] **Step 2: Commit**

```bash
git add src/hooks/useCommissionBalance.ts
git commit -m "feat: add useCommissionBalance hook"
```

---

## Chunk 3: Provider UI Components

### Task 4: Create CommissionBanner Component

**Files:**
- Create: `src/components/provider/CommissionBanner.tsx`

- [ ] **Step 1: Write the banner component**

```tsx
import { AlertTriangle, Ban, DollarSign } from "lucide-react";
import { useCommissionBalance } from "@/hooks/useCommissionBalance";
import { useState } from "react";
import CommissionPaymentDialog from "./CommissionPaymentDialog";

export default function CommissionBanner() {
  const { isBlocked, totalOwed, unpaidCount, isLoading } = useCommissionBalance();
  const [showPayDialog, setShowPayDialog] = useState(false);

  if (isLoading || totalOwed <= 0) return null;

  return (
    <>
      <div className={`rounded-2xl p-4 mb-6 flex items-center justify-between gap-4 ${
        isBlocked
          ? "bg-red-50 border-2 border-red-300 dark:bg-red-950/30 dark:border-red-800"
          : "bg-amber-50 border border-amber-200 dark:bg-amber-950/30 dark:border-amber-800"
      }`}>
        <div className="flex items-center gap-3">
          {isBlocked ? (
            <div className="h-10 w-10 rounded-xl bg-red-100 dark:bg-red-900/50 flex items-center justify-center">
              <Ban className="h-5 w-5 text-red-600" />
            </div>
          ) : (
            <div className="h-10 w-10 rounded-xl bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center">
              <AlertTriangle className="h-5 w-5 text-amber-600" />
            </div>
          )}
          <div>
            <p className={`font-semibold text-sm ${isBlocked ? "text-red-800 dark:text-red-200" : "text-amber-800 dark:text-amber-200"}`}>
              {isBlocked
                ? "Cuenta suspendida — Comisiones pendientes"
                : "Comisiones pendientes"}
            </p>
            <p className={`text-xs ${isBlocked ? "text-red-600 dark:text-red-300" : "text-amber-600 dark:text-amber-300"}`}>
              Debes <span className="font-bold">${totalOwed.toLocaleString("es-AR")}</span> en comisiones ({unpaidCount} servicio{unpaidCount !== 1 ? "s" : ""}).
              {isBlocked && " No puedes aceptar servicios ni enviar presupuestos hasta pagar."}
            </p>
          </div>
        </div>
        <button
          onClick={() => setShowPayDialog(true)}
          className="shrink-0 px-4 py-2 rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 text-white text-sm font-semibold hover:from-orange-600 hover:to-orange-700 transition-all shadow-lg shadow-orange-500/20"
        >
          <DollarSign className="h-4 w-4 inline mr-1" />
          Pagar
        </button>
      </div>
      <CommissionPaymentDialog open={showPayDialog} onOpenChange={setShowPayDialog} />
    </>
  );
}
```

- [ ] **Step 2: Commit**

### Task 5: Create CommissionPaymentDialog Component

**Files:**
- Create: `src/components/provider/CommissionPaymentDialog.tsx`

- [ ] **Step 1: Write the payment dialog**

```tsx
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useCommissionBalance, usePayCommission } from "@/hooks/useCommissionBalance";
import { CreditCard, Building2, Loader2, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useQueryClient } from "@tanstack/react-query";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function CommissionPaymentDialog({ open, onOpenChange }: Props) {
  const { totalOwed, entries } = useCommissionBalance();
  const { user } = useAuth();
  const payCommission = usePayCommission();
  const queryClient = useQueryClient();
  const [method, setMethod] = useState<"mercadopago" | "transferencia" | null>(null);
  const [transferSent, setTransferSent] = useState(false);
  const [processing, setProcessing] = useState(false);

  const handleMercadoPago = async () => {
    if (!user) return;
    setProcessing(true);
    try {
      // Create a commission payment record
      const { data: commPayment, error: insertErr } = await supabase
        .from("commission_payments")
        .insert({
          provider_id: user.id,
          amount: totalOwed,
          payment_method: "mercadopago",
          status: "pending",
        } as any)
        .select()
        .single();
      if (insertErr) throw insertErr;

      // Call edge function to create MP checkout for commission
      const { data, error } = await supabase.functions.invoke("mercadopago", {
        body: {
          action: "create_commission_checkout",
          commission_payment_id: commPayment.id,
          amount: totalOwed,
          payer_email: user.email,
        },
      });
      if (error) throw error;
      if (data?.init_point) {
        window.open(data.init_point, "_blank");
        toast.success("Redirigido a MercadoPago para pagar comisiones");
      }
    } catch (err: any) {
      toast.error("Error al crear checkout: " + err.message);
    } finally {
      setProcessing(false);
    }
  };

  const handleTransferConfirm = async () => {
    if (!user) return;
    setProcessing(true);
    try {
      await supabase
        .from("commission_payments")
        .insert({
          provider_id: user.id,
          amount: totalOwed,
          payment_method: "transferencia",
          status: "pending",
        } as any);
      setTransferSent(true);
      toast.success("Transferencia registrada. El admin la confirmara pronto.");
      queryClient.invalidateQueries({ queryKey: ["commission-balance"] });
    } catch (err: any) {
      toast.error("Error: " + err.message);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-3xl max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-extrabold tracking-tight">
            Pagar Comisiones Pendientes
          </DialogTitle>
        </DialogHeader>

        <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-4 mb-4">
          <p className="text-sm text-muted-foreground">Total adeudado</p>
          <p className="text-3xl font-extrabold text-orange-600">${totalOwed.toLocaleString("es-AR")}</p>
          <p className="text-xs text-muted-foreground mt-1">
            {entries?.filter((e: any) => e.status === "pending").length || 0} servicio(s) pendiente(s)
          </p>
        </div>

        {transferSent ? (
          <div className="text-center py-6">
            <CheckCircle2 className="h-12 w-12 text-emerald-500 mx-auto mb-3" />
            <p className="font-semibold">Transferencia registrada</p>
            <p className="text-sm text-muted-foreground">El equipo de ServiciosYa confirmara tu pago en las proximas horas.</p>
          </div>
        ) : !method ? (
          <div className="space-y-3">
            <button
              onClick={() => handleMercadoPago()}
              disabled={processing}
              className="w-full flex items-center gap-3 p-4 rounded-2xl border-2 border-blue-200 hover:border-blue-400 hover:bg-blue-50/50 dark:border-blue-800 dark:hover:bg-blue-950/30 transition-all"
            >
              <div className="h-10 w-10 rounded-xl bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center">
                <CreditCard className="h-5 w-5 text-blue-600" />
              </div>
              <div className="text-left">
                <p className="font-semibold text-sm">MercadoPago</p>
                <p className="text-xs text-muted-foreground">Pago instantaneo — se desbloquea automaticamente</p>
              </div>
              {processing && <Loader2 className="h-4 w-4 animate-spin ml-auto" />}
            </button>

            <button
              onClick={() => setMethod("transferencia")}
              className="w-full flex items-center gap-3 p-4 rounded-2xl border-2 border-emerald-200 hover:border-emerald-400 hover:bg-emerald-50/50 dark:border-emerald-800 dark:hover:bg-emerald-950/30 transition-all"
            >
              <div className="h-10 w-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center">
                <Building2 className="h-5 w-5 text-emerald-600" />
              </div>
              <div className="text-left">
                <p className="font-semibold text-sm">Transferencia Bancaria</p>
                <p className="text-xs text-muted-foreground">Confirmacion manual por el equipo (24-48hs)</p>
              </div>
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="bg-emerald-50 dark:bg-emerald-950/30 rounded-2xl p-4">
              <p className="font-semibold text-sm mb-2">Datos para transferir:</p>
              <div className="space-y-1 text-sm">
                <p><span className="text-muted-foreground">Alias:</span> <span className="font-mono font-bold">serviciosya.comisiones</span></p>
                <p><span className="text-muted-foreground">Monto:</span> <span className="font-bold">${totalOwed.toLocaleString("es-AR")}</span></p>
              </div>
            </div>
            <button
              onClick={handleTransferConfirm}
              disabled={processing}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 text-white font-semibold hover:from-emerald-600 hover:to-emerald-700 transition-all disabled:opacity-50"
            >
              {processing ? <Loader2 className="h-4 w-4 animate-spin mx-auto" /> : "Ya realice la transferencia"}
            </button>
            <button onClick={() => setMethod(null)} className="w-full text-sm text-muted-foreground hover:text-foreground">
              Volver
            </button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/provider/CommissionBanner.tsx src/components/provider/CommissionPaymentDialog.tsx
git commit -m "feat: add CommissionBanner and CommissionPaymentDialog components"
```

---

## Chunk 4: Integrate into Provider Pages

### Task 6: Add Banner to Provider Services Page

**Files:**
- Modify: `src/pages/provider/Services.tsx`

- [ ] **Step 1: Import and add CommissionBanner + block logic**

Add imports at top:
```typescript
import CommissionBanner from "@/components/provider/CommissionBanner";
import { useCommissionBalance } from "@/hooks/useCommissionBalance";
```

Add hook call near top of component:
```typescript
const { isBlocked } = useCommissionBalance();
```

Add `<CommissionBanner />` at the top of the page content (before the services list).

For the "Ver Detalles" button on `nuevo` services and any accept button, add `disabled={isBlocked}` and show tooltip "Paga tus comisiones pendientes para continuar".

- [ ] **Step 2: Commit**

### Task 7: Block Budget Sending in ServiceDetail

**Files:**
- Modify: `src/pages/provider/ServiceDetail.tsx`

- [ ] **Step 1: Add commission block check**

Import:
```typescript
import { useCommissionBalance } from "@/hooks/useCommissionBalance";
import CommissionBanner from "@/components/provider/CommissionBanner";
```

Add in component:
```typescript
const { isBlocked } = useCommissionBalance();
```

Add `<CommissionBanner />` before the budget form.

In `handleSendBudget`, add at the top:
```typescript
if (isBlocked) {
  toast.error("No puedes enviar presupuestos hasta pagar tus comisiones pendientes");
  return;
}
```

- [ ] **Step 2: Commit**

### Task 8: Add Commission Section to Finance Page

**Files:**
- Modify: `src/pages/provider/Finance.tsx`

- [ ] **Step 1: Add commission balance section**

Import:
```typescript
import CommissionBanner from "@/components/provider/CommissionBanner";
import { useCommissionBalance } from "@/hooks/useCommissionBalance";
```

Add the banner at the top and a detailed commission history card showing:
- Total owed
- List of pending commission entries with service name + amount
- Payment history

- [ ] **Step 2: Commit**

```bash
git add src/pages/provider/Services.tsx src/pages/provider/ServiceDetail.tsx src/pages/provider/Finance.tsx
git commit -m "feat: integrate commission balance into provider pages with blocking"
```

---

## Chunk 5: Admin Commission Management

### Task 9: Add Commission KPI to Admin Dashboard

**Files:**
- Modify: `src/pages/admin/Dashboard.tsx`
- Modify: `src/pages/admin/Reports.tsx`

- [ ] **Step 1: Add commission stats query to Dashboard**

Add a new query for total pending commissions:
```typescript
const { data: commissionStats } = useQuery({
  queryKey: ["admin-commission-stats"],
  queryFn: async () => {
    const { data } = await supabase
      .from("commission_balance")
      .select("total_owed, is_blocked");
    const totalPending = (data || []).reduce((sum, b) => sum + (b as any).total_owed, 0);
    const blockedCount = (data || []).filter((b: any) => b.is_blocked).length;
    return { totalPending, blockedCount };
  },
});
```

Add a new KPI card for "Comisiones Pendientes" with amount and blocked count.

- [ ] **Step 2: Add commission payment confirmation to Reports**

In Reports, add a section where admin can see pending `commission_payments` with `status = 'pending'` and confirm transfer payments by updating status to `'completed'` and calling `process_commission_payment` RPC.

- [ ] **Step 3: Commit**

```bash
git add src/pages/admin/Dashboard.tsx src/pages/admin/Reports.tsx
git commit -m "feat: admin commission management — KPI + payment confirmation"
```
