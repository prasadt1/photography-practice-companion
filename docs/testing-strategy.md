# Practice Companion - Testing Strategy

> **Canonical:** [`spec.md`](spec.md) phase gates · **Index:** [`README.md`](README.md)

**Version:** 1.0
**Date:** May 24, 2026
**Status:** Design Phase

---

## Table of Contents

1. [Testing Philosophy](#testing-philosophy)
2. [Testing Pyramid](#testing-pyramid)
3. [Unit Testing](#unit-testing)
4. [Integration Testing](#integration-testing)
5. [End-to-End Testing](#end-to-end-testing)
6. [Agent Testing](#agent-testing)
7. [Performance Testing](#performance-testing)
8. [Manual Testing & QA](#manual-testing--qa)
9. [Test Data Management](#test-data-management)
10. [CI/CD Integration](#cicd-integration)

---

## Testing Philosophy

### Principles

1. **Test What Matters**: Focus on critical paths (upload → critique → assignment) over edge cases.
2. **Fast Feedback**: Unit tests run in <5s, integration tests in <30s.
3. **Confidence Over Coverage**: 80% coverage on critical code > 100% on trivial code.
4. **Test Behavior, Not Implementation**: Validate outputs and side effects, not internal state.
5. **Hackathon Pragmatism**: Manual testing acceptable for demo-only features (Field Mode).

### Scope

**In Scope**:
- Coach analysis correctness (structured output, validation)
- Planner rationale grounding (references actual portfolio)
- Reflection ISAR computation (math correctness)
- MongoDB operations (writes, queries, indexes)
- Frontend critique display (renders correctly)
- XMP generation (valid sidecar files)

**Out of Scope** (Hackathon):
- Load testing (single-user demo)
- Security testing (penetration, fuzzing)
- Accessibility audits (WCAG compliance)
- Browser compatibility (Chrome/Safari only)
- Mobile responsive (desktop demo focus, Field Mode on iPhone only)

---

## Testing Pyramid

```
        ┌───────────────┐
        │  Manual E2E   │  Demo rehearsal, judge walkthrough
        │   (1-2 flows) │
        └───────────────┘
              ▲
              │
        ┌─────▼─────────┐
        │  Automated E2E│  Studio Mode upload → critique → assignment
        │   (2-3 flows) │
        └───────────────┘
              ▲
              │
        ┌─────▼─────────┐
        │  Integration  │  Sub-agent calls, MongoDB writes, tool invocations
        │  (10-15 tests)│
        └───────────────┘
              ▲
              │
        ┌─────▼─────────┐
        │   Unit Tests  │  Validation, parsing, utilities
        │  (30-50 tests)│
        └───────────────┘
```

**Ratios**:
- Unit: 60-70%
- Integration: 20-30%
- E2E: 5-10%
- Manual: 5%

---

## Unit Testing

### Backend (Python)

**Framework**: pytest

**Location**: `app/tests/unit/`

**Test Files**:
- `test_schema.py`: Pydantic model validation
- `test_validators.py`: Input validation functions
- `test_embeddings.py`: Embedding dimension checks, mock API calls
- `test_isar_metric.py`: **Intentional Skill Application Rate (ISAR)** computation (given baseline/completion counts → delta)
- `test_xmp_generation.py`: XMP file structure validation (if backend generates XMP)

**Example**:
```python
# app/tests/unit/test_isar_metric.py
from app.sub_agents.reflection import compute_isar_delta

def test_isar_computation():
    baseline_count = 2
    baseline_total = 15
    completion_count = 10
    completion_total = 15

    result = compute_isar_delta(
        baseline_count, baseline_total,
        completion_count, completion_total
    )

    assert result['baseline_rate'] == 0.13  # 2/15
    assert result['completion_rate'] == 0.67  # 10/15
    assert result['delta'] == 0.54  # +54pp
```

**Mocking**:
- Mock Gemini API calls (use fixtures with canned responses)
- Mock Vertex AI embedding calls (return fixed 1408-dim vector)
- Mock MongoDB writes (use `mongomock` or in-memory MongoDB)

**Run**:
```bash
pytest app/tests/unit/ -v
```

**Coverage Goal**: 80% on `app/sub_agents/`, `app/memory/`, `app/tools/`

### Frontend (TypeScript)

**Framework**: Vitest (Vite's test runner)

**Location**: `frontend/src/__tests__/unit/`

**Test Files**:
- `xmpService.test.ts`: XMP generation logic
- `validationService.test.ts`: Zod schema validation
- `agentClient.test.ts`: API call formatting, error handling
- `utils.test.ts`: Date formatting, score calculations

**Example**:
```typescript
// frontend/src/__tests__/unit/xmpService.test.ts
import { generateXMP } from '../services/xmpService';

describe('XMP Service', () => {
  it('generates valid XMP for portfolio entry', () => {
    const entry = {
      scores: { composition: 7, lighting: 8, technique: 6, creativity: 9, subject_impact: 7 },
      glass_box: { observations: ['Good use of rule of thirds'] },
      aesthetic_tags: ['portrait', 'natural-light']
    };

    const xmp = generateXMP(entry, 'IMG_001.jpg');

    expect(xmp).toContain('<?xpacket begin');
    expect(xmp).toContain('<xmp:Rating>7</xmp:Rating>');  // Average score
    expect(xmp).toContain('<dc:subject>portrait</dc:subject>');
  });
});
```

**Run**:
```bash
cd frontend
npm run test:unit
```

**Coverage Goal**: 70% on services, 50% on components (focus on logic, not UI rendering)

---

## Integration Testing

### Backend Integration Tests

**Framework**: pytest with live MongoDB (test database)

**Location**: `app/tests/integration/`

**Test Files**:
- `test_coach_agent.py`: Coach analyzes image → writes to MongoDB → document structure valid
- `test_planner_agent.py`: Planner receives portfolio → generates assignment → assignment has rationale
- `test_reflection_agent.py`: Reflection receives baseline + completion → computes ISAR → updates assignment
- `test_mongodb_operations.py`: Vector search, Atlas Search, change stream detection
- `test_data_store_grounding.py`: Query Data Store → returns principles content

**Setup**:
```python
# conftest.py (pytest fixtures)
import pytest
from pymongo import MongoClient

@pytest.fixture(scope='session')
def test_db():
    client = MongoClient(os.environ['TEST_MONGODB_URI'])
    db = client['practice_companion_test']
    yield db
    client.drop_database('practice_companion_test')  # Cleanup
```

**Example**:
```python
# app/tests/integration/test_coach_agent.py
def test_coach_analyzes_and_writes(test_db):
    from app.sub_agents.coach import analyze_photo

    result = analyze_photo(
        image_url="https://example.com/test-portrait.jpg",
        user_id="test_user_001",
        shoot_id="test_shoot_001"
    )

    # Verify structure
    assert 'scores' in result
    assert 'glass_box' in result
    assert 'spatial_metadata' in result
    assert 'embedding' in result
    assert len(result['embedding']) == 1408

    # Verify MongoDB write
    entry = test_db.portfolio_entries.find_one({'_id': result['_id']})
    assert entry is not None
    assert entry['user_id'] == "test_user_001"
    assert 'grounding_principles' in entry['glass_box']
```

**Run**:
```bash
export TEST_MONGODB_URI="mongodb://localhost:27017"  # Local MongoDB or Atlas test cluster
pytest app/tests/integration/ -v
```

**Coverage Goal**: All critical agent workflows tested end-to-end.

### Frontend Integration Tests

**Framework**: Vitest + Testing Library

**Location**: `frontend/src/__tests__/integration/`

**Test Files**:
- `StudioMode.test.tsx`: Upload flow → API call → display results
- `PracticeTab.test.tsx`: Fetch assignments → render correctly
- `MemoryTab.test.tsx`: Fetch portfolio → render timeline

**Mocking**:
- Mock `agentClient` API calls (return fixtures)
- Mock file upload (synthetic File objects)

**Example**:
```typescript
// frontend/src/__tests__/integration/StudioMode.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import StudioMode from '../components/StudioMode';
import * as agentClient from '../services/agentClient';

vi.mock('../services/agentClient');

describe('Studio Mode Integration', () => {
  it('uploads image and displays critique', async () => {
    const mockResponse = {
      scores: { composition: 7, lighting: 8, technique: 6, creativity: 9, subject_impact: 7 },
      glass_box: {
        observations: ['Good use of rule of thirds', 'Natural light well-balanced'],
        reasoning_steps: ['Analyzed composition...'],
        priority_fixes: []
      }
    };

    agentClient.analyzePhoto.mockResolvedValue(mockResponse);

    render(<StudioMode />);

    const file = new File(['fake-image-data'], 'test.jpg', { type: 'image/jpeg' });
    const input = screen.getByLabelText(/upload/i);
    fireEvent.change(input, { target: { files: [file] } });

    await waitFor(() => {
      expect(screen.getByText(/Good use of rule of thirds/i)).toBeInTheDocument();
      expect(screen.getByText(/7/)).toBeInTheDocument();  // Composition score
    });
  });
});
```

**Run**:
```bash
cd frontend
npm run test:integration
```

---

## End-to-End Testing

### Automated E2E Tests

**Framework**: Playwright (headless browser testing)

**Location**: `e2e/`

**Test Files**:
- `studio-mode-flow.spec.ts`: Full Studio Mode flow (upload → critique → assignment)
- `practice-tab.spec.ts`: View active assignment, baseline vs. current
- `memory-tab.spec.ts`: Search portfolio (vector + text)

**Example**:
```typescript
// e2e/studio-mode-flow.spec.ts
import { test, expect } from '@playwright/test';

test('Studio Mode: Upload → Critique → Assignment', async ({ page }) => {
  await page.goto('http://localhost:5173');

  // Upload image
  const fileInput = page.locator('input[type="file"]');
  await fileInput.setInputFiles('e2e/fixtures/test-portrait.jpg');

  // Wait for critique
  await page.waitForSelector('[data-testid="analysis-results"]', { timeout: 30000 });

  // Verify scores displayed
  await expect(page.locator('[data-testid="composition-score"]')).toContainText(/[0-9]/);

  // Verify Glass Box reasoning
  await expect(page.locator('[data-testid="glass-box"]')).toContainText(/rule of thirds|composition|lighting/i);

  // Navigate to Practice tab
  await page.click('[data-testid="practice-tab"]');

  // Verify assignment appears
  await expect(page.locator('[data-testid="active-assignment"]')).toBeVisible();
  await expect(page.locator('[data-testid="assignment-brief"]')).toContainText(/.+/);
});
```

**Run**:
```bash
npx playwright test
```

**Frequency**: Run before each deployment (CI/CD).

### Manual E2E Tests (Demo Rehearsal)

**Checklist**:

1. **Studio Mode Flow**:
   - [ ] Upload 3 images (drag-drop, file picker)
   - [ ] Verify Glass Box critique displays
   - [ ] Verify spatial overlay shows annotations
   - [ ] Verify assignment generated
   - [ ] Download XMP ZIP
   - [ ] Import XMP into Lightroom Classic → metadata appears

2. **Practice Tab**:
   - [ ] View active assignment
   - [ ] Upload images for active assignment
   - [ ] Verify ISAR delta appears after Reflection
   - [ ] View completed assignments list

3. **Memory Tab**:
   - [ ] View portfolio timeline (chronological grid)
   - [ ] View aesthetic profile
   - [ ] Search: "warm tones" → vector search results
   - [ ] Search: "backlighting" → Atlas Search results

4. **Field Mode** (iPhone):
   - [ ] Connect to LAN HTTPS server
   - [ ] Open Field Mode
   - [ ] Capture frame
   - [ ] Verify voice coaching plays
   - [ ] Verify frame analyzed in near-real-time

**Frequency**: Once before demo recording, once after final deployment.

---

## Agent Testing

### Orchestrator Routing Tests

**Test**: Orchestrator routes requests to correct sub-agents.

**Scenarios**:
- User uploads image → routes to Coach
- User asks "What should I practice?" → routes to Planner
- User has active assignment + uploads image → routes to Coach, then Reflection

**Verification**:
```python
# app/tests/integration/test_orchestrator_routing.py
def test_orchestrator_routes_to_coach(orchestrator):
    response = orchestrator.handle("Analyze this image: [URL]")
    assert 'coach_agent_tool' in response.tool_calls
```

### Sub-Agent Output Validation

**Test**: Sub-agents return valid structured output.

**Scenarios**:
- Coach returns JSON matching `portfolio_entries` schema
- Planner returns JSON matching `assignments` schema
- Reflection returns `skill_delta` object

**Verification**: Use Pydantic validation.

```python
from app.memory.schema import PortfolioEntry

def test_coach_output_schema(coach_agent):
    output = coach_agent.analyze(image_url="...")
    entry = PortfolioEntry(**output)  # Pydantic validation
    assert entry.scores.composition >= 0 and entry.scores.composition <= 10
```

### Tool Integration Tests

**Test**: Orchestrator can call tools successfully.

**Scenarios**:
- MongoDB MCP query returns results
- Agent Builder Data Store query returns principles
- Atlas Search query returns hits

**Verification**:
```python
def test_mongodb_mcp_tool(orchestrator):
    response = orchestrator.handle("Show me my recent uploads")
    assert 'mongodb_mcp' in response.tool_calls
    assert len(response.results) > 0
```

---

## Performance Testing

### Latency Benchmarks

**Target Latencies** (p95):

| Operation | Target | Measurement |
|-----------|--------|-------------|
| Coach analysis (single image) | <15s | Time from upload to portfolio write |
| Planner generates assignment | <10s | Time from request to assignment write |
| Reflection computes ISAR | <20s | Time from request to skill_delta write |
| Vector search (10 results) | <2s | MongoDB Atlas Vector Search query time |
| Atlas Search (10 results) | <2s | MongoDB Atlas Search query time |
| Frontend load (initial) | <3s | Time to interactive (TTI) |

**Measurement**:
```python
import time

def test_coach_latency():
    start = time.time()
    analyze_photo(image_url="...")
    elapsed = time.time() - start
    assert elapsed < 15, f"Coach took {elapsed}s (target: <15s)"
```

**Optimization** (if needed):
- Cache Data Store queries (same principles for same scene type)
- Batch embedding generation
- Use smaller Gemini model for non-critical tasks (if available)

### Load Testing (Optional, Post-Hackathon)

**Tool**: Locust or k6

**Scenario**: 10 concurrent users uploading images.

**Metrics**:
- Requests/second
- Error rate
- Agent Engine auto-scaling behavior

**Not Required for Hackathon**: Single-user demo.

---

## Manual Testing & QA

### Pre-Demo Checklist

**Functionality**:
- [ ] Upload flow works (drag-drop, file picker)
- [ ] Critique displays correctly (scores, Glass Box, overlay)
- [ ] Assignment generation works
- [ ] Practice tab shows active assignment
- [ ] Memory tab shows portfolio + aesthetic profile
- [ ] Search works (vector + text)
- [ ] XMP export downloads ZIP
- [ ] Field Mode voice coaching works (iPhone)

**Visual QA**:
- [ ] No layout breaks on Chrome/Safari (desktop)
- [ ] Text readable (contrast, font size)
- [ ] Images load correctly
- [ ] Loading states show (spinners, progress)
- [ ] Error states show (upload failed, API error)

**Data QA**:
- [ ] Seed data loaded correctly (30 images, 2 assignments, 1 profile)
- [ ] Glass Box reasoning is coherent (not gibberish)
- [ ] Assignment rationale references actual portfolio ("I noticed you...")
- [ ] ISAR delta math is correct (manual verification)

**Demo Rehearsal**:
- [ ] Walk through demo script end-to-end (time: <3 minutes)
- [ ] All voiceover/explanation points hit
- [ ] No awkward pauses or confusion
- [ ] Demo video can be recorded smoothly

### Browser Compatibility

**Primary**: Chrome (latest), Safari (latest on macOS/iOS)

**Not Tested**: Firefox, Edge, older browsers (hackathon scope)

**PWA Install**: Test on iPhone (Safari) for Field Mode.

---

## Test Data Management

### Fixtures

**Location**: `app/tests/fixtures/`

**Files**:
- `test_image.jpg`: Sample portrait for Coach analysis
- `portfolio_entry.json`: Canned Coach output (valid structure)
- `assignment.json`: Canned Planner output
- `skill_delta.json`: Canned Reflection output

**Usage**:
```python
import json

def load_fixture(name):
    with open(f'app/tests/fixtures/{name}.json') as f:
        return json.load(f)

def test_planner():
    portfolio = load_fixture('portfolio_entry')
    result = generate_assignment(portfolio_entries=[portfolio])
    # ...
```

### Test Database

**Setup**:
- Separate MongoDB database: `practice_companion_test`
- Populated with seed data via `scripts/seed-demo-data.py` (Phase 3)
- Cleaned after each test suite run

**Isolation**: Each integration test creates a unique `user_id` to avoid collisions.

### Image Licensing

**Test Images**:
- Use Prasad's own photos (full rights)
- Or license-cleared stock (Unsplash, Pexels)
- Document sources in `app/tests/fixtures/README.md`

---

## CI/CD Integration

### GitHub Actions

**Workflow**: `.github/workflows/test.yml`

**Trigger**: Push to any branch, pull request

**Jobs**:

1. **Backend Tests**:
   ```yaml
   - name: Run Backend Tests
     run: |
       uv sync
       pytest app/tests/ -v --cov=app --cov-report=term
   ```

2. **Frontend Tests**:
   ```yaml
   - name: Run Frontend Tests
     run: |
       cd frontend
       npm install
       npm run test:unit
       npm run test:integration
   ```

3. **E2E Tests** (optional, slow):
   ```yaml
   - name: Run E2E Tests
     run: |
       npm run build
       npx playwright install
       npx playwright test
   ```

**Coverage Report**: Upload to Codecov or display in PR comment.

**Pass Criteria**: All tests pass, coverage ≥70% on critical code.

### Pre-Deployment Gate

**Requirement**: Tests must pass before deployment to production.

**Deployment Workflow**:
```yaml
jobs:
  test:
    runs-on: ubuntu-latest
    steps: [run tests]

  deploy:
    needs: test  # Blocks deploy if tests fail
    runs-on: ubuntu-latest
    steps: [deploy to Agent Engine, Firebase]
```

---

## Appendix: Test Commands Quick Reference

```bash
# Backend Unit Tests
pytest app/tests/unit/ -v

# Backend Integration Tests
export TEST_MONGODB_URI="mongodb://localhost:27017"
pytest app/tests/integration/ -v

# Backend All Tests + Coverage
pytest app/tests/ -v --cov=app --cov-report=html

# Frontend Unit Tests
cd frontend && npm run test:unit

# Frontend Integration Tests
cd frontend && npm run test:integration

# E2E Tests
npx playwright test

# Manual Demo Rehearsal
# Follow checklist in §8
```

---

**End of Testing Strategy Document**
