# Script Builder - Quick Start Guide

## 🚀 Enable Script Builder

```bash
# In .env file
ENABLE_SCRIPT_BUILDER=true
```

## 📋 Quick Test (5 minutes)

### 1. Navigate to Script Page
```
http://localhost:3000/projects/[your-project-id]/script
```

### 2. Generate Blueprint
- **Topic:** "The Rise and Fall of Toxic Fandom in Sports"
- **Duration:** 12 minutes (6 beats)
- **Click:** "Generate Blueprint"
- **Wait:** ~30-60 seconds

### 3. Review & Approve
- **Review** 6 beat cards
- **Click:** "Approve All"
- **Auto-proceeds** to execution

### 4. Watch Execution
- **Progress bar** updates every 2.5 seconds
- **Each beat** takes ~30-60 seconds
- **Total time:** 3-6 minutes

### 5. Create Segments
- **Click:** "Create Segments"
- **Result:** 8-12 TTS-ready segments (100-150 words each)
- **Status:** Project marked as SCRIPT_READY

## 🔄 Test Resume Feature

1. **Start execution** (approve blueprint)
2. **Kill server** during beat 3 (Ctrl+C)
3. **Restart:** `npm run dev`
4. **Navigate back** to script page
5. **Click:** "Resume" button
6. **Verify:** Continues from beat 3

## 🔍 API Endpoints (All 9)

```bash
# Blueprint
POST   /api/script-builder/blueprint
PUT    /api/script-builder/blueprint/[id]/approve
PUT    /api/script-builder/blueprint/[id]/review
POST   /api/script-builder/blueprint/[id]/regenerate

# Execution
POST   /api/script-builder/execute
GET    /api/script-builder/execute/[draftId]/status
POST   /api/script-builder/execute/[draftId]/resume
GET    /api/script-builder/draft/[draftId]

# Segmentation
POST   /api/script-builder/segment
```

## ✅ Verification Checklist

- [ ] Blueprint generates successfully
- [ ] Beat cards display correct data
- [ ] Approve/reject buttons work
- [ ] Progress bar updates in real-time
- [ ] Execution completes all beats
- [ ] Resume works after simulated failure
- [ ] Segmentation creates 8-12 segments
- [ ] No console errors

## 🐛 Common Issues

### "Blueprint not found"
- Check database for blueprint record
- Verify projectId is correct

### Execution stuck
- Check Gemini API logs
- Verify API key in environment
- Use resume endpoint if timeout occurred

### TypeScript errors
- Run: `npm install`
- Restart TypeScript server in IDE

## 📊 Expected Results

| Phase | Duration | Result |
|-------|----------|--------|
| Blueprint | 30-60s | 6 beats with emotions |
| Execution | 3-6 min | Complete script text |
| Segmentation | 10-30s | 8-12 TTS segments |

## 🎯 Next Steps After Testing

1. Test with different topics
2. Test different durations (5min, 8min, 15min)
3. Test blueprint rejection flow
4. Verify TTS generation still works
5. Check database for correct records

## 📚 Full Documentation

- **Complete Report:** `docs/SCRIPT_BUILDER_COMPLETION_REPORT.md`
- **PRD Spec:** `docs/specs/SCRIPT_BUILDER_PRD.md`
- **Test Scenarios:** See completion report

---

**Last Updated:** 2026-01-12
**Status:** Phase 1 MVP Complete ✅
