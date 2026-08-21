/* Cloudflare Pages Function — POST /api/contact
   1:1 문의 폼을 Resend(https://resend.com)로 발송한다.
   RESEND_API_KEY는 Cloudflare Pages 환경 변수(Secret)로만 주입 — 코드/저장소에 절대 넣지 말 것.
   무료 플랜에서 발신자는 onboarding@resend.dev 고정이며, 수신은 Resend 가입 계정의
   이메일 주소로만 가능하므로 Resend 계정은 skiloveman@naver.com 으로 가입해야 한다. */
const DEST = "skiloveman@naver.com";

export async function onRequestPost({ request, env }) {
  const json = (status, body) =>
    new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });

  if (!env.RESEND_API_KEY) return json(500, { ok: false, error: "not_configured" });

  let data;
  try { data = await request.json(); } catch { return json(400, { ok: false, error: "bad_json" }); }

  const name = String(data.name || "").trim().slice(0, 100);
  const email = String(data.email || "").trim().slice(0, 200);
  const type = String(data.type || "").trim().slice(0, 50);
  const message = String(data.message || "").trim().slice(0, 5000);

  if (String(data.website || "").trim()) return json(200, { ok: true }); // 허니팟 — 봇은 조용히 무시
  if (!message || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return json(400, { ok: false, error: "invalid" });

  const esc = (s) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: "Ashtanga Shala <onboarding@resend.dev>",
      to: [DEST],
      reply_to: email,
      subject: `[아쉬탕가 샬라 1:1] ${type || "문의"} — ${name || email}`,
      html:
        `<p><b>보낸 사람:</b> ${esc(name)} &lt;${esc(email)}&gt;</p>` +
        `<p><b>유형:</b> ${esc(type)}</p><hr/>` +
        `<p style="white-space:pre-wrap;line-height:1.7">${esc(message)}</p>`,
    }),
  });

  if (!res.ok) return json(502, { ok: false, error: "send_failed" });
  return json(200, { ok: true });
}
