"use client";

import React from "react";
import apiKeyContract from "../../../data/contracts/api-keys.json";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  setKeysNewKeyName,
  setKeysShowModal,
  setKeysRevealedKey,
  setKeysError,
  resetForm,
  selectKeysForm
} from "@/store/slices/formSlice";
import type { FormStateKey } from "@/store/slices/formSlice";
import {
  useGetKeysQuery,
  useCreateKeyMutation,
  useRevokeKeyMutation
} from "@/store/api/keysApi";
import { Card } from "@/components/vengeance/Card";
import { Button } from "@/components/vengeance/Button";
import { Badge } from "@/components/vengeance/Badge";
import { Input } from "@/components/vengeance/Input";
import { Copy, Trash2, Key, X, AlertTriangle, Loader2 } from "lucide-react";

export default function KeysPage() {
  const dispatch = useAppDispatch();

  // Select state from Redux
  const { newKeyName, showModal, revealedKey, error: formError } = useAppSelector(selectKeysForm);

  // RTK Query hooks
  const { data, isLoading: loading, error: queryError } = useGetKeysQuery(undefined);
  const [createKey, { isLoading: creating }] = useCreateKeyMutation();
  const [revokeKey] = useRevokeKeyMutation();

  const apiKeys = data?.keys || [];
  const error = formError || (queryError as { data?: { error?: string } } | undefined)?.data?.error;

  const handleCreate = async () =>
    !newKeyName.trim()
      ? Promise.resolve()
      : Promise.resolve().then(() => {
          dispatch(setKeysError(null));
          return createKey({ name: newKeyName.trim() }).unwrap()
            .then(result => dispatch(setKeysRevealedKey(result.key.rawKey)))
            .catch((err: unknown) => {
              const e = err as { data?: { error?: string } };
              dispatch(setKeysError(e.data?.error || apiKeyContract.messages.createFailed));
            });
        });

  const handleRevoke = async (id: string) => {
    try {
      await revokeKey(id).unwrap();
    } catch (err: unknown) {
      const e = err as { data?: { error?: string } };
      dispatch(setKeysError(e.data?.error || apiKeyContract.messages.revokeFailed));
    }
  };

  const handleClose = () => {
    dispatch(resetForm(apiKeyContract.interaction.formScope as FormStateKey));
  };

  const handleCopyKey = async () => revealedKey
    ? navigator.clipboard.writeText(revealedKey)
    : Promise.resolve();

  return (
    <div className="space-y-12">
      <div className="flex flex-col gap-2 border-l-4 border-red-900 pl-6 py-2">
        <h1 className="text-4xl font-mono tracking-tighter text-white">Credential Management</h1>
        <p className="text-zinc-500 text-sm max-w-2xl font-sans uppercase tracking-widest">
          Neural-link credentials for the Forboc Grid. Generate, inspect, and revoke access keys.
        </p>
      </div>

      {error && (
        <div className="p-3 border border-red-900/50 bg-red-950/10">
          <p className="text-[11px] font-mono text-red-500 uppercase tracking-wide">{error}</p>
        </div>
      )}

      <div className="space-y-6">
        <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
          <div className="flex items-center gap-3">
            <Key className="w-5 h-5 text-red-500" />
            <h2 className="text-xl font-mono text-white">Active Credentials</h2>
          </div>
          <Button variant="outline" size="sm" onClick={() => dispatch(setKeysShowModal(true))}>
            Generate New Key
          </Button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 text-zinc-500 animate-spin" />
          </div>
        ) : apiKeys.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-zinc-600 font-mono text-sm uppercase tracking-widest">
              No credentials initialized
            </p>
          </div>
        ) : (
          <div className="grid gap-4">
            {apiKeys.map((key: { id: string; name: string; status: string; keyPrefix: string }) => (
              <Card key={key.id} className="group hover:border-zinc-700 transition-colors py-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-sm text-white">{key.name}</span>
                      <Badge variant={key.status === apiKeyContract.status.active ? "success" : "danger"}>
                        {key.status}
                      </Badge>
                    </div>
                    <code className="text-[10px] text-zinc-500 font-mono tracking-tight">
                      {key.keyPrefix}
                    </code>
                  </div>

                  {key.status === apiKeyContract.status.active && (
                    <div className="flex items-center gap-2">
                      <Button
                        variant="destructive"
                        size="sm"
                        className="px-2 py-1 h-8"
                        onClick={() => handleRevoke(key.id)}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
          onClick={!revealedKey ? handleClose : undefined}
        >
          <div className="w-full max-w-md relative" onClick={(e) => e.stopPropagation()}>
            <div className="absolute -top-1 -left-1 w-4 h-4 border-t-2 border-l-2 border-red-900 z-10" />
            <div className="absolute -bottom-1 -right-1 w-4 h-4 border-b-2 border-r-2 border-red-900 z-10" />

            <Card className="relative overflow-hidden pt-10 pb-8 px-8">
              {!revealedKey && (
                <button
                  onClick={handleClose}
                  className="absolute top-4 right-4 text-zinc-600 hover:text-red-500 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              )}

              {!revealedKey ? (
                <>
                  <div className="text-center mb-8">
                    <h3 className="text-lg font-mono text-white tracking-widest uppercase mb-2">
                      Initialize New Credential
                    </h3>
                    <p className="text-[10px] text-zinc-500 font-mono tracking-[0.2em] uppercase">
                      Assign a designation to this neural-link key
                    </p>
                  </div>

                  <div className="space-y-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-mono text-zinc-400 uppercase tracking-widest pl-1">
                        Key Designation
                      </label>
                      <Input
                        type="text"
                        placeholder="e.g. Production Gateway"
                        value={newKeyName}
                        onChange={(e) => dispatch(setKeysNewKeyName(e.target.value))}
                        onKeyDown={(e) => e.key === apiKeyContract.interaction.submitKey
                          ? void handleCreate()
                          : undefined}
                        autoFocus
                      />
                    </div>

                    <div className="flex items-center gap-3">
                      <Button
                        variant="primary"
                        size="md"
                        className="flex-1"
                        disabled={!newKeyName.trim() || creating}
                        onClick={handleCreate}
                      >
                        {creating ? "Generating..." : "Create API Key"}
                      </Button>
                      <Button variant="outline" size="md" onClick={handleClose}>
                        Abort
                      </Button>
                    </div>

                    <div className="pt-4 border-t border-zinc-900 text-center">
                      <span className="text-[8px] font-mono text-zinc-700 tracking-widest">
                        CREDENTIAL_INIT // SECURE_CHANNEL
                      </span>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div className="text-center mb-8">
                    <h3 className="text-lg font-mono text-white tracking-widest uppercase mb-2">
                      Credential Generated
                    </h3>
                    <p className="text-[10px] text-zinc-500 font-mono tracking-[0.2em] uppercase">
                      {newKeyName}
                    </p>
                  </div>

                  <div className="space-y-6">
                    <div className="flex items-center gap-2 p-3 border border-red-900/50 bg-red-950/10">
                      <AlertTriangle className="w-4 h-4 text-red-500 shrink-0" />
                      <p className="text-[10px] font-mono text-red-500 uppercase tracking-wide">
                        This key will not be shown again. Copy it now or lose it forever.
                      </p>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-mono text-zinc-400 uppercase tracking-widest pl-1">
                        Your API Key
                      </label>
                      <div className="flex items-center gap-2">
                        <code className="flex-1 bg-zinc-950 border border-zinc-800 px-4 py-2.5 text-xs text-white font-mono break-all select-all">
                          {revealedKey}
                        </code>
                        <Button
                          variant="outline"
                          size="sm"
                          className="px-2 py-2 h-10 shrink-0"
                          onClick={handleCopyKey}
                        >
                          <Copy className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>

                    <Button variant="primary" size="full" onClick={handleClose}>
                      I Have Saved My Key
                    </Button>

                    <div className="pt-4 border-t border-zinc-900 text-center">
                      <span className="text-[8px] font-mono text-zinc-700 tracking-widest">
                        KEY_REVEAL // ONE_TIME_DISPLAY
                      </span>
                    </div>
                  </div>
                </>
              )}
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
