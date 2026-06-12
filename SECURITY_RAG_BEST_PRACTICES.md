# 🤖 Alexa Skill – Security & Retrieval‑Augmented Generation (RAG) Best Practices

## 📚 Overview
This document provides **actionable guidelines** for hardening the Alexa skill (`miraya‑alexa‑skill`) and mitigating hallucinations when using Retrieval‑Augmented Generation (RAG) to call external services.

---

## 🔒 Security Hardening for the Skill
| Area | Recommendation |
|------|----------------|
| **API Keys & Secrets** | Store `WEBAPP_ENDPOINT` and `WEBAPP_API_KEY` in **AWS Secrets Manager** (or Azure Key Vault) and load them via environment variables. Do **not** commit them to the repo. |
| **TLS** | All outbound HTTP calls (see `fetch` in `src/index.js`) must use **HTTPS** with a valid certificate. Enable **certificate pinning** if possible. |
| **Input Sanitisation** | Validate the Alexa slot value (`question`) against an allow‑list (e.g., max length 256, no control characters). |
| **Rate Limiting** | Implement a per‑user rate‑limit (e.g., 5 requests/min) in the Lambda handler before invoking the backend. |
| **Logging** | Log request IDs, timestamps, and outcome **without** user‑provided content. Use CloudWatch Logs with a retention policy (≤ 90 days). |
| **Least‑Privilege IAM Role** | The Lambda execution role should only have `logs:CreateLogGroup`, `logs:CreateLogStream`, `logs:PutLogEvents`, and permission to read the secret. |
| **Dependency Safety** | Use a lockfile (`package-lock.json`). Run `npm audit` CI step and reject any high‑severity findings. |
| **Container Isolation** | If you move to a container runtime, drop all Linux capabilities (`--cap‑drop ALL`). |
| **Data Privacy** | Do not store raw user queries. If you need analytics, hash the query with SHA‑256 before persistence. |
| **Secure RAG Index** | Encrypt any vector store used by your backend (AES‑256) and restrict network access to the VPC. |

---

## 🧠 RAG Hallucination Mitigation in the Skill
1. **Grounded Prompt** – In the backend, prepend the prompt with:
   ```
   "Answer ONLY using the supplied context. If you cannot answer, say \"I don’t know\"."
   ```
2. **Source Attribution** – Return a `source_id` with each answer and surface it in the Alexa response (e.g., "According to my knowledge base...").
3. **Self‑Consistency** – Generate the answer twice and compare; if they differ, reply with uncertainty.
4. **Confidence Scoring** – Compute a token‑level confidence (log‑prob) and reject answers below 0.75.
5. **Reasoning Trace** – Ask the model to emit a short `Reasoning:` block before the final answer; use it for logging and debugging.
6. **Chunk Overlap** – Retrieve 200‑300 word chunks with 50‑word overlap to keep context coherent.
7. **Human‑in‑the‑Loop** – For high‑risk intents (e.g., medical advice), route the answer to a moderator UI for approval before speaking.

---

## 🛠️ Implementation Checklist (Add to your repo README)
- [ ] Move `WEBAPP_ENDPOINT` & `WEBAPP_API_KEY` to a secret manager.
- [ ] Add input validation for the `question` slot.
- [ ] Enable CloudWatch Logs with a 90‑day retention.
- [ ] Create a rate‑limit middleware in the Lambda handler.
- [ ] Update `package.json` scripts to run `npm audit` CI step.
- [ ] Document the grounded prompt and confidence threshold in the backend service.
- [ ] Add unit tests that verify the backend returns *"I don’t know"* when context is missing.
- [ ] Ensure the Lambda execution role follows the principle of least privilege.

---

## 📦 Deploy
```bash
# Assuming you have the AWS CLI configured
aws lambda update-function-code \
  --function-name mirayaSkillLambda \
  --zip-file fileb://function.zip
```

---

*Created by Antigravity – your AI‑enabled coding companion.*
