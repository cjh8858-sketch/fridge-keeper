# Auth — 이메일 매직링크

## 흐름

1. 로그인 화면에서 이메일 입력 → "로그인 링크 보내기"
2. `data/auth-repo.sendMagicLink(email, location.origin + base)` 호출
3. 안내 문구: "메일함에서 링크를 눌러주세요" (스팸함 안내 포함)
4. 링크 클릭 → 앱으로 돌아오면 supabase-js가 세션을 자동 저장(`detectSessionInUrl`)
5. 세션 있음 → 바로 내 냉장고 목록 ([items](items.md))

## 수용 기준

- [x] 잘못된 이메일 형식은 전송 전에 텍스트 오류 표시
- [x] 전송 중 버튼 비활성화, 중복 전송 방지(60초)
- [ ] (사람 확인 필요) 휴대폰에서 받은 링크를 PC에서 열어도 로그인 가능 (기기별 세션은 각각)
- [x] 로그아웃 버튼 (헤더, 로그인 상태에서 항상)

## 제약

- Supabase 기본 메일 발송은 **시간당 횟수 제한**이 있다(개발용). 운영 시 커스텀 SMTP 설정 → [tech-debt](../exec-plans/tech-debt-tracker.md)
- Google 로그인은 나중에 provider 추가로 확장 (UI에 버튼 자리만 고려)
