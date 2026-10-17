import { useEffect, type ReactNode } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useAppDispatch, useAppSelector } from "@/app/hooks";
import { useMeQuery, api } from "@/app/api";
import { FullPageSpinner } from "@/components/common/states";
import { signedOut } from "./session.slice";
import type { User } from "@/types/domain";

/** Authentication guard: renders children only with a valid signed-in user. */
export function RequireSession({ children }: { children: (user: User) => ReactNode }) {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { hydrated, userId } = useAppSelector((s) => s.session);
  const me = useMeQuery(userId ?? "", { skip: !userId });

  useEffect(() => {
    if (hydrated && !userId) navigate({ to: "/login", replace: true });
  }, [hydrated, userId, navigate]);

  useEffect(() => {
    if (me.isError) dispatch(signedOut());
  }, [me.isError, dispatch]);

  if (!hydrated || !userId || !me.data) return <FullPageSpinner />;
  return <>{children(me.data)}</>;
}

export function useSignOut() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  return () => {
    dispatch(signedOut());
    dispatch(api.util.resetApiState());
    navigate({ to: "/login" });
  };
}
