import { toast } from "sonner";
import { errorMessage } from "@/app/base-api";

/** Runs an RTK Query mutation promise, toasting success or the API error. Returns data or null. */
export async function withToast<R>(p: { unwrap: () => Promise<R> }, success: string): Promise<R | null> {
  try {
    const r = await p.unwrap();
    toast.success(success);
    return r;
  } catch (e) {
    toast.error(errorMessage(e));
    return null;
  }
}
