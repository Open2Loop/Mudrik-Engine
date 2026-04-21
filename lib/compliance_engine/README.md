# compliance_engine

موديول مستقل لاستخراج متطلبات كراسة الشروط من ملفات PDF وإرجاع JSON منظّم.

## نقطة الواجهة

- `POST /api/compliance-engine/extract`
- `multipart/form-data` مع الحقل `rfp` (ملف PDF)

## المخرجات

```json
{
  "ok": true,
  "filename": "rfp.pdf",
  "model_provider": "gemini",
  "source_char_count": 12345,
  "extracted": {
    "technical_requirements": ["..."],
    "mandatory_criteria": ["..."],
    "execution_duration": "12 شهراً"
  }
}
```

## اختيار النموذج

- الافتراضي: `COMPLIANCE_ENGINE_MODEL=gemini`
- بديل: `COMPLIANCE_ENGINE_MODEL=deepseek`

### Gemini

- يتطلب: `GEMINI_API_KEY`
- النموذج المستخدم: `gemini-1.5-pro`

### DeepSeek

- يتطلب: `DEEPSEEK_API_KEY`
- اختياري: `DEEPSEEK_API_BASE` (الافتراضي `https://api.deepseek.com`)
- اختياري: `DEEPSEEK_CHAT_MODEL` (الافتراضي `deepseek-chat`)
