'use client';

import React, { useState } from 'react';
import { KeyRound, Webhook, Copy, Check, Trash2, Send, RotateCcw } from 'lucide-react';
import { useI18n } from '../../../context/i18nContext';

interface ApiKeyRow {
  id: string;
  name: string;
  prefix: string;
  createdAt: string;
}

interface WebhookRow {
  id: string;
  url: string;
  events: string[];
  status: string;
  lastDelivery?: string;
}

export default function AdminIntegrationsPage() {
  const { t } = useI18n();
  const [keys, setKeys] = useState<ApiKeyRow[]>([]);
  const [webhooks, setWebhooks] = useState<WebhookRow[]>([]);
  const [newKeyName, setNewKeyName] = useState('');
  const [freshKey, setFreshKey] = useState('');
  const [copied, setCopied] = useState(false);
  const [hookUrl, setHookUrl] = useState('');

  const handleCreateKey = () => {
    const name = newKeyName.trim();
    if (!name) return;
    // Tạo key phía client (demo) — backend sẽ cấp key thật khi có API /api-keys.
    const rand = Math.random().toString(36).slice(2, 14);
    const key = `mgk_${rand}${Date.now().toString(36)}`;
    setKeys((prev) => [
      { id: `k-${Date.now()}`, name, prefix: key.slice(0, 8), createdAt: new Date().toISOString() },
      ...prev,
    ]);
    setFreshKey(key);
    setCopied(false);
    setNewKeyName('');
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(freshKey);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore clipboard errors
    }
  };

  const handleAddWebhook = () => {
    const url = hookUrl.trim();
    if (!url) return;
    setWebhooks((prev) => [
      {
        id: `w-${Date.now()}`,
        url,
        events: ['order:new', 'payment:completed'],
        status: 'active',
      },
      ...prev,
    ]);
    setHookUrl('');
  };

  return (
    <div className="p-6 space-y-8 max-w-4xl">
      <div>
        <h1 className="text-xl font-extrabold text-zinc-100">{t('integrations.title', 'API Keys & Webhook')}</h1>
        <p className="text-xs text-zinc-400 mt-1">{t('integrations.subtitle', 'Tích hợp hệ thống bên ngoài (POS phụ, kế toán, SePay).')}</p>
      </div>

      {/* API Keys */}
      <section className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 space-y-4">
        <h2 className="font-bold text-sm text-zinc-100 flex items-center gap-2">
          <KeyRound className="w-4 h-4 text-amber-400" /> API Keys
        </h2>
        <div className="flex gap-2">
          <input
            value={newKeyName}
            onChange={(e) => setNewKeyName(e.target.value)}
            placeholder={t('integrations.keyNamePlaceholder', 'Tên gợi nhớ (VD: ke-toan-misa)')}
            className="flex-1 bg-zinc-800/60 border border-zinc-700/80 rounded-xl px-3 py-2 text-xs text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:border-amber-500"
          />
          <button
            type="button"
            onClick={handleCreateKey}
            className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-zinc-950 text-xs font-bold rounded-xl"
          >
            {t('integrations.createKey', 'Tạo key')}
          </button>
        </div>
        {freshKey && (
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-3 flex items-center justify-between gap-2">
            <code className="text-xs text-amber-200 break-all">{freshKey}</code>
            <button
              type="button"
              onClick={handleCopy}
              className="shrink-0 p-2 bg-zinc-800 rounded-lg text-zinc-300 hover:text-white"
              title="Sao chép (chỉ hiện 1 lần)"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>
        )}
        <p className="text-[11px] text-zinc-500">{t('integrations.keyOnce', 'Key chỉ hiển thị 1 lần duy nhất sau khi tạo. Thu hồi key cũ khi rò rỉ.')}</p>
        <div className="space-y-2">
          {keys.map((k) => (
            <div key={k.id} className="flex items-center justify-between bg-zinc-800/40 border border-zinc-800 rounded-xl px-3 py-2">
              <div>
                <p className="text-xs font-bold text-zinc-200">{k.name}</p>
                <p className="text-[11px] text-zinc-500 font-mono">{k.prefix}••••••••</p>
              </div>
              <button
                type="button"
                onClick={() => setKeys((prev) => prev.filter((x) => x.id !== k.id))}
                className="p-1.5 text-zinc-500 hover:text-rose-400"
                title="Thu hồi key"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
          {keys.length === 0 && <p className="text-xs text-zinc-500">{t('integrations.noKeys', 'Chưa có API key nào.')}</p>}
        </div>
      </section>

      {/* Webhooks */}
      <section className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 space-y-4">
        <h2 className="font-bold text-sm text-zinc-100 flex items-center gap-2">
          <Webhook className="w-4 h-4 text-amber-400" /> Webhook Endpoints
        </h2>
        <div className="flex gap-2">
          <input
            value={hookUrl}
            onChange={(e) => setHookUrl(e.target.value)}
            placeholder={t('integrations.endpointPlaceholder', 'https://doi-tac.vn/webhook/menugo')}
            inputMode="url"
            className="flex-1 bg-zinc-800/60 border border-zinc-700/80 rounded-xl px-3 py-2 text-xs text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:border-amber-500"
          />
          <button
            type="button"
            onClick={handleAddWebhook}
            className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-200 text-xs font-bold rounded-xl flex items-center gap-1.5"
          >
            <Send className="w-3.5 h-3.5" /> {t('integrations.addEndpoint', 'Thêm')}
          </button>
        </div>
        <div className="space-y-2">
          {webhooks.map((w) => (
            <div key={w.id} className="bg-zinc-800/40 border border-zinc-800 rounded-xl px-3 py-2.5 space-y-1.5">
              <p className="text-xs font-mono text-zinc-200 break-all">{w.url}</p>
              <div className="flex items-center justify-between">
                <div className="flex gap-1.5">
                  {w.events.map((e) => (
                    <span key={e} className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 font-semibold">
                      {e}
                    </span>
                  ))}
                </div>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() =>
                      setWebhooks((prev) => prev.map((x) => (x.id === w.id ? { ...x, lastDelivery: '200 OK • vừa gửi test' } : x)))
                    }
                    className="p-1.5 text-zinc-400 hover:text-amber-300"
                    title="Gửi test event"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setWebhooks((prev) => prev.filter((x) => x.id !== w.id))}
                    className="p-1.5 text-zinc-500 hover:text-rose-400"
                    title="Xóa endpoint"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
              {w.lastDelivery && <p className="text-[11px] text-emerald-400">{w.lastDelivery}</p>}
            </div>
          ))}
          {webhooks.length === 0 && <p className="text-xs text-zinc-500">{t('integrations.noEndpoints', 'Chưa đăng ký endpoint nào.')}</p>}
        </div>
      </section>
    </div>
  );
}
