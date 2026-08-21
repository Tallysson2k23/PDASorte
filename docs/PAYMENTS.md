# Pagamentos

Somente `MockPaymentProvider` será implementado no protótipo. Nenhuma integração Pix real foi escolhida ou autorizada.

```ts
interface PaymentProvider {
  createPayment(input: CreatePaymentInput): Promise<CreatePaymentResult>;
  verifyWebhook(request: Request): Promise<VerifiedPaymentEvent>;
  getPaymentStatus(externalId: string): Promise<PaymentStatus>;
  refundPayment(externalId: string): Promise<RefundResult>;
}
```

A avaliação futura comparará Pix, assinatura de webhook, idempotência, reembolso, antifraude, reconciliação e aceitação jurídica do modelo. Webhooks deverão validar assinatura e valor, rejeitar evento inválido, impedir duplicidade e registrar auditoria. Retorno do navegador nunca confirma pagamento.
