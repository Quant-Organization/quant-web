# Figma px → rem 변환 가이드

## 설정
- **Figma 디자인 프레임**: 1280px
- **화면 해상도**: 1710px
- **rem 기준**: 16px
- **스케일 비율**: 1.3359375

## 사용 방법

### 1. 기본 변환 (원본 크기)
```typescript
import { toRem, pxToRem } from '$lib/utils';

// 문자열로 받기
const padding = toRem(32); // "2.00rem"
const margin = toRem(48); // "3.00rem"

// 숫자로 받기
const size = pxToRem(64); // 4
```

### 2. 스케일 적용 변환
```typescript
import { toScaledRem, pxToScaledRem } from '$lib/utils';

// 1710px 화면에 맞춰 스케일 적용
const padding = toScaledRem(32); // "2.67rem"
const margin = toScaledRem(48); // "4.01rem"
```

### 3. 여러 값 한번에 변환
```typescript
import { multiToRem } from '$lib/utils';

// padding: top right bottom left
const padding = multiToRem([16, 32, 16, 32]); // "1.00rem 2.00rem 1.00rem 2.00rem"

// 스케일 적용
const margin = multiToRem([8, 16, 24], true); // "0.67rem 1.34rem 2.01rem"
```

### 4. Svelte 컴포넌트에서 사용
```svelte
<script lang="ts">
  import { toRem } from '$lib/utils';
</script>

<div style="padding: {toRem(32)}; margin: {toRem(16)} 0;">
  Content
</div>

<style>
  div {
    max-width: 80rem; /* 1280px */
  }
</style>
```

### 5. CSS 변수로 활용
```svelte
<script lang="ts">
  import { toRem } from '$lib/utils';
  
  const spacing = {
    xs: toRem(4),
    sm: toRem(8),
    md: toRem(16),
    lg: toRem(32),
    xl: toRem(64)
  };
</script>

<div 
  style="
    --spacing-xs: {spacing.xs};
    --spacing-sm: {spacing.sm};
    --spacing-md: {spacing.md};
    --spacing-lg: {spacing.lg};
    --spacing-xl: {spacing.xl};
  "
>
  <p style="padding: var(--spacing-md);">Content</p>
</div>
```

## 변환 예시표

| Figma (px) | toRem() | toScaledRem() |
|------------|---------|---------------|
| 4          | 0.25rem | 0.33rem      |
| 8          | 0.50rem | 0.67rem      |
| 12         | 0.75rem | 1.00rem      |
| 16         | 1.00rem | 1.34rem      |
| 24         | 1.50rem | 2.01rem      |
| 32         | 2.00rem | 2.67rem      |
| 48         | 3.00rem | 4.01rem      |
| 64         | 4.00rem | 5.34rem      |

## 권장 사항

### 원본 크기 유지 (추천)
- `toRem()` 함수 사용
- 디자인 일관성 유지
- 컨테이너에 max-width 설정으로 중앙 정렬

```css
.container {
  max-width: 80rem; /* 1280px */
  margin: 0 auto;
  padding: 0 2rem;
}
```

### 스케일 적용
- `toScaledRem()` 함수 사용
- 전체 화면 활용하고 싶을 때
- 반응형 디자인과 함께 미디어 쿼리 활용

```css
.full-width {
  width: 100%;
  padding: 2.67rem; /* 32px scaled */
}
```
