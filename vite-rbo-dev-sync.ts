import type { IncomingMessage, ServerResponse } from 'node:http';
import type { Plugin } from 'vite';

const vendorStatusStore = new Map<string, string>();
const vendorRejectionStore = new Map<string, string>();

/** Vendor-submitted listings awaiting / after admin review */
const productStore = new Map<string, Record<string, unknown>>();
const serviceStore = new Map<string, Record<string, unknown>>();
/** Pending status updates for vendor portal hydration */
const vendorProductUpdates = new Map<
  string,
  Array<{
    productId: string;
    status: string;
    rejectionReason?: string;
  }>
>();
const vendorServiceUpdates = new Map<
  string,
  Array<{
    serviceId: string;
    status: string;
    rejectionReason?: string;
  }>
>();

const ALLOWED_ORIGINS = [
  'http://localhost:5174',
  'http://127.0.0.1:5174',
  'http://localhost:5175',
  'http://127.0.0.1:5175',
];

const supportConversationStore = new Map<string, Record<string, unknown>>();
const supportMessageStore: Array<Record<string, unknown>> = [];

function supportConversationList(filters: {
  participantType?: string;
  participantId?: string;
  status?: string;
}): Record<string, unknown>[] {
  let list = [...supportConversationStore.values()];
  if (filters.participantType) {
    list = list.filter((c) => c.participantType === filters.participantType);
  }
  if (filters.participantId) {
    list = list.filter(
      (c) =>
        c.customerId === filters.participantId ||
        c.vendorId === filters.participantId,
    );
  }
  if (filters.status) {
    list = list.filter((c) => c.status === filters.status);
  }
  return list.sort(
    (a, b) =>
      new Date(String(b.lastMessageAt)).getTime() -
      new Date(String(a.lastMessageAt)).getTime(),
  );
}

function setCors(req: IncomingMessage, res: ServerResponse) {
  const origin = req.headers.origin;
  if (origin && ALLOWED_ORIGINS.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

function readBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on('data', (chunk) => chunks.push(Buffer.from(chunk)));
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    req.on('error', reject);
  });
}

function json(res: ServerResponse, status: number, body: unknown) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(body));
}

export function rboDevSyncPlugin(): Plugin {
  return {
    name: 'rbo-dev-sync',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const url = req.url?.split('?')[0] ?? '';
        if (!url.startsWith('/__rbo_dev_sync')) {
          next();
          return;
        }

        setCors(req, res);

        if (req.method === 'OPTIONS') {
          res.statusCode = 204;
          res.end();
          return;
        }

        // --- Product sync ---
        if (
          req.method === 'POST' &&
          url.startsWith('/__rbo_dev_sync/products/') &&
          url.endsWith('/status')
        ) {
          const productId = url
            .slice('/__rbo_dev_sync/products/'.length)
            .replace('/status', '');
          try {
            const raw = await readBody(req);
            const payload = JSON.parse(raw) as {
              vendorId?: string;
              status?: string;
              rejectionReason?: string;
            };
            if (productId && payload.status && payload.vendorId) {
              const existing = productStore.get(productId) ?? { id: productId };
              productStore.set(productId, {
                ...existing,
                status: payload.status,
                rejectionReason: payload.rejectionReason,
              });
              const queue = vendorProductUpdates.get(payload.vendorId) ?? [];
              queue.push({
                productId,
                status: payload.status,
                rejectionReason: payload.rejectionReason,
              });
              vendorProductUpdates.set(payload.vendorId, queue);
            }
            json(res, 200, { ok: true });
          } catch {
            json(res, 400, { message: 'Invalid payload' });
          }
          return;
        }

        if (req.method === 'POST' && url === '/__rbo_dev_sync/products') {
          try {
            const raw = await readBody(req);
            const payload = JSON.parse(raw) as {
              product?: Record<string, unknown>;
            };
            if (payload.product?.id) {
              productStore.set(String(payload.product.id), payload.product);
            }
            json(res, 200, { ok: true });
          } catch {
            json(res, 400, { message: 'Invalid payload' });
          }
          return;
        }

        if (
          req.method === 'GET' &&
          url.startsWith('/__rbo_dev_sync/products/vendor/')
        ) {
          const vendorId = url.slice('/__rbo_dev_sync/products/vendor/'.length);
          const updates = vendorProductUpdates.get(vendorId) ?? [];
          vendorProductUpdates.set(vendorId, []);
          json(res, 200, { vendorId, updates });
          return;
        }

        if (req.method === 'GET' && url === '/__rbo_dev_sync/products') {
          json(res, 200, { products: [...productStore.values()] });
          return;
        }

        // --- Service sync ---
        if (
          req.method === 'POST' &&
          url.startsWith('/__rbo_dev_sync/services/') &&
          url.endsWith('/status')
        ) {
          const serviceId = url
            .slice('/__rbo_dev_sync/services/'.length)
            .replace('/status', '');
          try {
            const raw = await readBody(req);
            const payload = JSON.parse(raw) as {
              vendorId?: string;
              status?: string;
              rejectionReason?: string;
            };
            if (serviceId && payload.status && payload.vendorId) {
              const existing = serviceStore.get(serviceId) ?? { id: serviceId };
              serviceStore.set(serviceId, {
                ...existing,
                status: payload.status,
                rejectionReason: payload.rejectionReason,
              });
              const queue = vendorServiceUpdates.get(payload.vendorId) ?? [];
              queue.push({
                serviceId,
                status: payload.status,
                rejectionReason: payload.rejectionReason,
              });
              vendorServiceUpdates.set(payload.vendorId, queue);
            }
            json(res, 200, { ok: true });
          } catch {
            json(res, 400, { message: 'Invalid payload' });
          }
          return;
        }

        if (req.method === 'POST' && url === '/__rbo_dev_sync/services') {
          try {
            const raw = await readBody(req);
            const payload = JSON.parse(raw) as {
              service?: Record<string, unknown>;
            };
            if (payload.service?.id) {
              serviceStore.set(String(payload.service.id), payload.service);
            }
            json(res, 200, { ok: true });
          } catch {
            json(res, 400, { message: 'Invalid payload' });
          }
          return;
        }

        if (
          req.method === 'GET' &&
          url.startsWith('/__rbo_dev_sync/services/vendor/')
        ) {
          const vendorId = url.slice('/__rbo_dev_sync/services/vendor/'.length);
          const updates = vendorServiceUpdates.get(vendorId) ?? [];
          vendorServiceUpdates.set(vendorId, []);
          json(res, 200, { vendorId, updates });
          return;
        }

        if (req.method === 'GET' && url === '/__rbo_dev_sync/services') {
          json(res, 200, { services: [...serviceStore.values()] });
          return;
        }

        // --- Support sync (customer + vendor ↔ admin) ---
        if (url.startsWith('/__rbo_dev_sync/support/conversations')) {
          const query = new URL(req.url ?? '', 'http://localhost').searchParams;

          if (req.method === 'GET' && url === '/__rbo_dev_sync/support/conversations') {
            const list = supportConversationList({
              participantType: query.get('participantType') ?? undefined,
              participantId: query.get('participantId') ?? undefined,
              status: query.get('status') ?? undefined,
            });
            json(res, 200, { conversations: list });
            return;
          }

          const convPrefix = '/__rbo_dev_sync/support/conversations/';
          if (url.startsWith(convPrefix)) {
            const rest = url.slice(convPrefix.length);
            const slash = rest.indexOf('/');
            const convId = slash >= 0 ? rest.slice(0, slash) : rest;
            const suffix = slash >= 0 ? rest.slice(slash + 1) : '';

            if (req.method === 'GET' && suffix === 'messages') {
              const messages = supportMessageStore.filter(
                (m) => m.conversationId === convId,
              );
              json(res, 200, { messages });
              return;
            }

            if (req.method === 'GET' && !suffix) {
              const conv = supportConversationStore.get(convId);
              if (!conv) {
                json(res, 404, { message: 'Conversation not found' });
                return;
              }
              json(res, 200, { conversation: conv });
              return;
            }

            if (req.method === 'POST' && suffix === 'messages') {
              try {
                const raw = await readBody(req);
                const payload = JSON.parse(raw) as {
                  message?: Record<string, unknown>;
                };
                const msg = payload.message;
                if (!msg?.id || !msg.conversationId) {
                  json(res, 400, { message: 'Invalid message' });
                  return;
                }
                supportMessageStore.push(msg);
                const conv = supportConversationStore.get(convId);
                if (conv) {
                  const createdAt = String(msg.createdAt ?? new Date().toISOString());
                  supportConversationStore.set(convId, {
                    ...conv,
                    lastMessageAt: createdAt,
                    updatedAt: createdAt,
                    unreadByStaff:
                      msg.authorRole === 'staff' || msg.authorRole === 'system'
                        ? conv.unreadByStaff
                        : Number(conv.unreadByStaff ?? 0) + 1,
                    unreadByParticipant:
                      msg.authorRole === 'staff' || msg.authorRole === 'system'
                        ? Number(conv.unreadByParticipant ?? 0) + 1
                        : conv.unreadByParticipant,
                  });
                }
                json(res, 200, { message: msg });
              } catch {
                json(res, 400, { message: 'Invalid payload' });
              }
              return;
            }

            if (req.method === 'PATCH' && !suffix) {
              try {
                const raw = await readBody(req);
                const patch = JSON.parse(raw) as Record<string, unknown>;
                const conv = supportConversationStore.get(convId);
                if (!conv) {
                  json(res, 404, { message: 'Conversation not found' });
                  return;
                }
                const updated = {
                  ...conv,
                  ...patch,
                  updatedAt: new Date().toISOString(),
                };
                supportConversationStore.set(convId, updated);
                json(res, 200, { conversation: updated });
              } catch {
                json(res, 400, { message: 'Invalid payload' });
              }
              return;
            }
          }

          if (req.method === 'POST' && url === '/__rbo_dev_sync/support/conversations') {
            try {
              const raw = await readBody(req);
              const payload = JSON.parse(raw) as {
                conversation?: Record<string, unknown>;
                message?: Record<string, unknown>;
              };
              const conv = payload.conversation;
              if (!conv?.id) {
                json(res, 400, { message: 'Invalid conversation' });
                return;
              }
              supportConversationStore.set(String(conv.id), conv);
              if (payload.message) {
                supportMessageStore.push(payload.message);
              }
              json(res, 200, { conversation: conv });
            } catch {
              json(res, 400, { message: 'Invalid payload' });
            }
            return;
          }
        }

        if (req.method === 'GET' && url === '/__rbo_dev_sync/support/messages') {
          json(res, 200, { messages: [...supportMessageStore] });
          return;
        }

        // --- Vendor status sync ---
        if (
          req.method === 'GET' &&
          url.startsWith('/__rbo_dev_sync/') &&
          !url.startsWith('/__rbo_dev_sync/products') &&
          !url.startsWith('/__rbo_dev_sync/services') &&
          !url.startsWith('/__rbo_dev_sync/support')
        ) {
          const vendorId = url.slice('/__rbo_dev_sync/'.length);
          const status = vendorStatusStore.get(vendorId);
          if (!status) {
            // No explicit admin override — vendor portal keeps fixture/local status.
            json(res, 404, { message: 'No status override' });
            return;
          }
          const rejectionReason = vendorRejectionStore.get(vendorId);
          json(res, 200, {
            vendorId,
            status,
            rejectionReason: rejectionReason ?? undefined,
          });
          return;
        }

        if (req.method === 'POST' && url === '/__rbo_dev_sync') {
          try {
            const raw = await readBody(req);
            const payload = JSON.parse(raw) as {
              vendorId?: string;
              status?: string;
              rejectionReason?: string;
            };
            if (payload.vendorId && payload.status) {
              vendorStatusStore.set(payload.vendorId, payload.status);
              if (payload.rejectionReason) {
                vendorRejectionStore.set(
                  payload.vendorId,
                  payload.rejectionReason,
                );
              } else if (payload.status === 'active') {
                vendorRejectionStore.delete(payload.vendorId);
              }
            }
            json(res, 200, { ok: true });
          } catch {
            json(res, 400, { message: 'Invalid payload' });
          }
          return;
        }

        next();
      });
    },
  };
}
