import type {
  AppServer,
  Context,
  ShopInterface,
} from "@friendsofshopware/app-server";
import { configureAppServer } from "@friendsofshopware/app-server/framework/hono";
import { CloudflareShopRepository } from "@friendsofshopware/app-server/service/cloudflare-workers";

import { Hono } from "hono";

import {
  getSignedCookie,
  setSignedCookie
} from 'hono/cookie'

type Bindings = {
  db: D1Database
  shopStorage: KVNamespace
  APP_NAME: string
  APP_SECRET: string
}

const app = new Hono<{ Bindings: Bindings }>()

configureAppServer(app, {
  appName: ctx => ctx.env.APP_NAME,
  appSecret: ctx => ctx.env.APP_SECRET,
  shopRepository: (ctx) => new CloudflareShopRepository(ctx.env.shopStorage)
})

declare module "hono" {
  interface ContextVariableMap {
    app: AppServer;
    shop: ShopInterface;
    context: Context;
  }
}

app.post('/app/webhook/checkout.order.placed', async (ctx) => {
  const order = ctx.get('context').payload.data.payload.order;
  const orderCustomer = order.orderCustomer;

  console.log(`${orderCustomer.firstName} ${orderCustomer.lastName} has placed an order!`);

  ctx.executionCtx.waitUntil(
    ctx.env.db.prepare('INSERT INTO reports (order_id, shop_id, text) VALUES(?, ?, ?)').bind(order.id, ctx.get('shop').getShopId(), "BLAA").run()
  );

  return new Response('OK', { status: 200 });
});

app.get('/app/module', async ctx => {
  const url = new URL(ctx.req.url);
  url.pathname = '/';

  await setSignedCookie(ctx, 'shop', ctx.get('shop').getShopId(), ctx.env.APP_SECRET)

  return ctx.redirect(url.toString());
});

app.use('/app-widget/*', async (ctx, next) => {
  const shopId = await getSignedCookie(ctx, ctx.env.APP_SECRET, 'shop')

  if (!shopId) {
    return ctx.json({ error: 'Shop not found' }, { status: 404 });
  }

  const shop = await ctx.get('app').repository.getShopById(shopId);

  if (!shop) {
    return ctx.json({ error: 'Shop not found' }, { status: 404 });
  }

  ctx.set('shop', shop);

  await next();
});

app.get('/app-widget/my-reports', async ctx => {
  const reports = await ctx.env.db.prepare('SELECT * FROM reports WHERE shop_id = ?').bind(ctx.get('shop').getShopId()).all();

  return ctx.json(reports.results);
});

export default app;
