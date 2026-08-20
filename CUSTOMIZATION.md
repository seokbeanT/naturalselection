# 수정 안내서

대부분의 실험 조건은 `src/App.tsx` 위쪽의 상수에서 바꿀 수 있습니다.

## 주요 설정

| 바꾸려는 항목 | 코드 위치 또는 상수 | 예시 |
| --- | --- | --- |
| 초기 색상별 개체 수 | `INITIAL` | `{ red: 10, yellow: 10, green: 10, blue: 10 }` |
| 전체 세대 수 | `LAST_GENERATION` | `5` |
| 고정 제거 개수 | `FIXED_REMOVE_GOAL` | `10` |
| 시간제한 | `TIME_LIMIT_SECONDS` | `5` |
| 공 색상 | `COLORS`의 `hex` | 빨강 `#e44138` |
| 배경색 | `HABITATS`의 `hex` | 노랑 `#f1c51f` |
| 번식 배율 | `doubleCounts()` | 현재 각 색상 `× 2` |
| 변이 세대 | `generation === 2` | 숫자 `2` 변경 |
| 변이 비율 | `counts[from] * 0.1` | `0.1`은 10% |

## 예: 시간제한을 8초로 변경

```ts
const TIME_LIMIT_SECONDS = 8;
```

## 예: 고정 제거 개수를 15개로 변경

```ts
const FIXED_REMOVE_GOAL = 15;
```

## 예: 번식을 1.5배로 변경

현재 `doubleCounts()` 함수를 다음처럼 바꿉니다. 개체 수는 정수여야 하므로 반올림 방식을 정해야 합니다.

```ts
function doubleCounts(counts: Counts): Counts {
  return {
    red: Math.round(counts.red * 1.5),
    yellow: Math.round(counts.yellow * 1.5),
    green: Math.round(counts.green * 1.5),
    blue: Math.round(counts.blue * 1.5),
  };
}
```

## 화면 문구와 디자인

- 화면 문구는 `src/App.tsx` 안의 한국어 문자열을 수정합니다.
- 전체 배경, 카드, 버튼 색은 `src/styles.css`의 `:root` 변수를 수정합니다.
- 공 모양은 `.candy`, 색상은 `.candy.red` 등의 규칙을 수정합니다.
- 모바일 화면은 `src/styles.css` 아래쪽의 `@media` 구역에서 조정합니다.

수정 후에는 반드시 `npm run build`를 실행하여 오류가 없는지 확인합니다.
