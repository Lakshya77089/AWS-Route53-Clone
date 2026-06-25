"use client";

import { useCallback, useEffect, type ReactNode } from "react";

import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { setUser, setAuthLoading, clearAuth } from "@/store/auth-slice";
import { api } from "@/store/api";

/**
 * Restores the session on mount (this used to be the AuthProvider). State now
 * lives in the Redux `auth` slice; this component only runs the side effects.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const dispatch = useAppDispatch();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      dispatch(setAuthLoading(false));
      return;
    }
    dispatch(api.endpoints.me.initiate(undefined))
      .unwrap()
      .then((data) => dispatch(setUser({ id: data.id, username: data.username })))
      .catch(() => localStorage.removeItem("token"))
      .finally(() => dispatch(setAuthLoading(false)));
  }, [dispatch]);

  return <>{children}</>;
}

/** Drop-in replacement for the old context hook, backed by Redux. */
export function useAuth() {
  const dispatch = useAppDispatch();
  const { user, loading } = useAppSelector((s) => s.auth);

  const login = useCallback(
    async (username: string, password: string) => {
      const res = await dispatch(
        api.endpoints.login.initiate({ username, password }),
      ).unwrap();
      localStorage.setItem("token", res.token);
      dispatch(setUser({ id: res.user.id, username: res.user.username }));
    },
    [dispatch],
  );

  const logout = useCallback(() => {
    localStorage.removeItem("token");
    dispatch(clearAuth());
    // Drop any cached authorized data so the next user starts clean.
    dispatch(api.util.resetApiState());
  }, [dispatch]);

  return { user, loading, login, logout };
}
