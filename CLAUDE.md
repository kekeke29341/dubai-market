# Dubai Market — Core Business Model

## ⚠️ THIS IS NOT A BUY/SELL MARKETPLACE

This app looks like Mercari but operates on a completely different model. Never implement or suggest features based on direct purchase/transaction flows.

## The Actual Model

**Creators** post item listings (showcase their items).
**Users** browse listings → **Creators earn points based on view counts**.
**Creators redeem points** to receive products — there is no cash transaction.

```
User browses → Item gets views → Creator earns points → Creator redeems points for products
```

## Rules to Never Break

- Creators do NOT sell items for money
- Users do NOT buy items
- There is NO payment gateway, checkout, or cart
- The `purchases` table and `BuyNowButton` component represent **point redemptions**, not cash purchases
- `MakeOfferButton` and pricing exist only as display/reference — not for actual transactions
- Revenue/monetization flows through **points ↔ products exchange**, not money

## What Features Make Sense

- View count tracking (core metric — drives creator earnings)
- Points balance display for creators
- Points redemption catalogue / rewards shop
- Leaderboards by views
- Creator analytics (views per item, total points earned)
- Notification when points threshold is reached

## What Features Do NOT Make Sense

- Payment integration (Stripe, Tap Payments, Apple Pay, etc.)
- Shipping / tracking numbers
- Purchase dispute / refund flows
- Price negotiation as a monetary transaction
- "Buy Now" in the traditional e-commerce sense
