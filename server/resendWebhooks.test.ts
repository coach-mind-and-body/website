import { describe, expect, it } from "vitest";
import crypto from "crypto";
import { verifyResendWebhook } from "./resendWebhooks";

function sign(payload: string, id: string, timestamp: string, secret: string) {
  const keyPart = secret.startsWith("whsec_") ? secret.slice(6) : secret;
  const secretBytes = Buffer.from(keyPart, "base64");
  const expected = crypto
    .createHmac("sha256", secretBytes)
    .update(`${id}.${timestamp}.${payload}`)
    .digest("base64");
  return `v1,${expected}`;
}

describe("verifyResendWebhook", () => {
  it("accepts a valid Svix signature", () => {
    const secret = "whsec_" + Buffer.from("test-secret-key-bytes!!").toString("base64");
    const payload = JSON.stringify({
      type: "email.opened",
      data: { email_id: "abc-123" },
    });
    const id = "msg_test1";
    const timestamp = String(Math.floor(Date.now() / 1000));
    const signature = sign(payload, id, timestamp, secret);

    const event = verifyResendWebhook(
      payload,
      { id, timestamp, signature },
      secret
    );
    expect(event.type).toBe("email.opened");
    expect(event.data?.email_id).toBe("abc-123");
  });

  it("rejects bad signatures", () => {
    const secret = "whsec_" + Buffer.from("test-secret-key-bytes!!").toString("base64");
    const payload = `{"type":"email.opened"}`;
    const id = "msg_test2";
    const timestamp = String(Math.floor(Date.now() / 1000));
    expect(() =>
      verifyResendWebhook(
        payload,
        { id, timestamp, signature: "v1,notvalid" },
        secret
      )
    ).toThrow(/Invalid svix signature/);
  });
});
